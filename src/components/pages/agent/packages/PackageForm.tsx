import React, { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { type Category } from '../../../../types/category';
import {
  type PackageFormValues,
  type PackageImage,
  type TravelPackage,
} from '../../../../types/package';
import { packageService } from '../../../../services/packageService';
import { showToast, getErrorMessage } from '../../../../utils/toast';
import { useCurrency } from '../../../../hooks/useCurrency';

interface PackageFormProps {
  // Only the categories this agent's subscription covers. The server enforces
  // the same rule; this keeps the agent from picking one it will reject.
  categories: Category[];
  travelPackage?: TravelPackage;
  onSaved: () => void;
  onCancel: () => void;
}

// Mirrors lib/package.ts on the API so the agent sees the same message
// client-side that the server would have sent back.
const schema = yup.object({
  category: yup.string().required('Choose a category'),
  title: yup.string().trim().required('Package name is required')
    .min(5, 'Package name must be at least 5 characters')
    .max(200, 'Package name must be under 200 characters'),
  description: yup.string().trim().required('Description is required')
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be under 2000 characters'),
  destination: yup.string().trim().required('Destination is required').max(100),
  departureCity: yup.string().trim().required('Departure city is required').max(100),
  durationDays: yup.number().typeError('Duration must be a number')
    .required('Duration is required')
    .integer('Duration must be a whole number of days')
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration must be under 365 days'),
  departureDate: yup.string().optional(),
  returnDate: yup.string().optional()
    .test('after-departure', 'Return date must be after the departure date', function (value) {
      const { departureDate } = this.parent;
      if (!value || !departureDate) return true;
      return new Date(value) > new Date(departureDate);
    }),
  hotelInfo: yup.string().trim().max(500, 'Must be under 500 characters').optional(),
  transportInfo: yup.string().trim().max(500, 'Must be under 500 characters').optional(),
  price: yup.number().typeError('Price must be a number')
    .required('Price is required')
    .positive('Price must be greater than zero')
    .max(100000000, 'Price is unrealistically high'),
  priceType: yup.string().oneOf(['per_person', 'per_group']).required(),
  maxTravelers: yup.number().typeError('Must be a number')
    .integer('Must be a whole number').min(1).max(500)
    .transform((value, original) => (original === '' || original === null ? undefined : value))
    .optional(),
  termsAndConditions: yup.string().trim().max(2000, 'Terms must be under 2000 characters').optional(),
  isActive: yup.boolean().required(),
});

// Spelled out rather than inferred from the schema: yup makes every optional
// field `T | undefined`, which react-hook-form's Resolver then refuses to line
// up with the required fields. The cast below is safe because this interface
// and the schema describe the same shape.
interface FormValues {
  category: string;
  title: string;
  description: string;
  destination: string;
  departureCity: string;
  durationDays: number;
  departureDate?: string;
  returnDate?: string;
  hotelInfo?: string;
  transportInfo?: string;
  price: number;
  priceType: 'per_person' | 'per_group';
  maxTravelers?: number;
  termsAndConditions?: string;
  isActive: boolean;
}

const MAX_IMAGES = 10;

const PackageForm: React.FC<PackageFormProps> = ({
  categories,
  travelPackage,
  onSaved,
  onCancel,
}) => {
  const currency = useCurrency();
  const isEdit = Boolean(travelPackage?._id);

  // Inclusions/exclusions and images sit outside react-hook-form: they are
  // list widgets rather than inputs, and the server validates them separately.
  const [inclusions, setInclusions] = useState<string[]>(travelPackage?.inclusions || []);
  const [exclusions, setExclusions] = useState<string[]>(travelPackage?.exclusions || []);
  const [inclusionDraft, setInclusionDraft] = useState('');
  const [exclusionDraft, setExclusionDraft] = useState('');

  const [images, setImages] = useState<PackageImage[]>(travelPackage?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const categoryId = useMemo(() => {
    if (!travelPackage?.category) return '';
    return typeof travelPackage.category === 'string'
      ? travelPackage.category
      : travelPackage.category._id;
  }, [travelPackage]);

  const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      category: categoryId,
      title: travelPackage?.title || '',
      description: travelPackage?.description || '',
      destination: travelPackage?.destination || '',
      departureCity: travelPackage?.departureCity || '',
      durationDays: travelPackage?.durationDays,
      departureDate: toDateInput(travelPackage?.departureDate),
      returnDate: toDateInput(travelPackage?.returnDate),
      hotelInfo: travelPackage?.hotelInfo || '',
      transportInfo: travelPackage?.transportInfo || '',
      price: travelPackage?.price,
      priceType: travelPackage?.priceType || 'per_person',
      maxTravelers: travelPackage?.maxTravelers,
      termsAndConditions: travelPackage?.termsAndConditions || '',
      isActive: travelPackage?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (!travelPackage) return;
    setInclusions(travelPackage.inclusions || []);
    setExclusions(travelPackage.exclusions || []);
    setImages(travelPackage.images || []);
  }, [travelPackage]);

  const addListItem = (
    draft: string,
    setDraft: (value: string) => void,
    list: string[],
    setList: (value: string[]) => void
  ) => {
    const value = draft.trim();
    if (!value) return;
    if (list.length >= 20) {
      showToast.error('You can list at most 20 items');
      return;
    }
    setList([...list, value]);
    setDraft('');
  };

  const handleImagePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files || []);
    // Reset immediately so the same file can be chosen again after a removal.
    event.target.value = '';
    if (picked.length === 0) return;

    if (images.length + picked.length > MAX_IMAGES) {
      showToast.error(`You can upload at most ${MAX_IMAGES} images per package`);
      return;
    }

    try {
      setIsUploading(true);
      const response = await packageService.uploadImages(picked);
      setImages((current) => [...current, ...response.data]);
      // A partial success still returns the images that made it, and names the
      // ones that didn't.
      if (response.errors?.length) {
        response.errors.forEach((message) => showToast.error(message));
      } else {
        showToast.success(response.message);
      }
    } catch (error) {
      showToast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const payload: PackageFormValues = {
      ...values,
      category: values.category,
      durationDays: Number(values.durationDays),
      price: Number(values.price),
      priceType: values.priceType,
      maxTravelers: values.maxTravelers ? Number(values.maxTravelers) : undefined,
      // Sent as empty strings so the API knows to clear a date that was set.
      departureDate: values.departureDate || undefined,
      returnDate: values.returnDate || undefined,
      // A new package is priced in the site currency; an existing one keeps
      // whatever it was created with.
      currency: travelPackage?.currency || currency.code,
      inclusions,
      exclusions,
      images,
    };

    try {
      setIsSaving(true);
      if (isEdit && travelPackage) {
        await packageService.updatePackage(travelPackage._id, payload);
        showToast.success('Package updated');
      } else {
        await packageService.createPackage(payload);
        showToast.success('Package created');
        reset();
      }
      onSaved();
    } catch (error) {
      showToast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  // An agent with no categories cannot create anything: the subscription is
  // what grants a category, so point them at the profile rather than showing a
  // form whose submit can only fail.
  if (categories.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="card-body text-center py-5">
          <i className="fas fa-tags fa-2x mb-3 text-muted"></i>
          <h4>No service categories yet</h4>
          <p className="text-muted mb-0">
            Your packages live inside the categories your subscription covers.
            Select your categories in your profile first, then come back to add packages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="dashboard-card" onSubmit={handleSubmit(onSubmit)}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <h4 className="mb-0">{isEdit ? 'Edit Package' : 'Add Package'}</h4>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Category <span className="text-danger">*</span></label>
            <select className="form-select" {...register('category')}>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
            {errors.category && <small className="text-danger">{errors.category.message}</small>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Package name <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="15 Days Economy Umrah Package"
              {...register('title')}
            />
            {errors.title && <small className="text-danger">{errors.title.message}</small>}
          </div>

          <div className="col-12">
            <label className="form-label">Description <span className="text-danger">*</span></label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe what this package includes, the itinerary and anything a traveller should know."
              {...register('description')}
            />
            {errors.description && <small className="text-danger">{errors.description.message}</small>}
          </div>

          <div className="col-md-4">
            <label className="form-label">Departure city <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Lahore" {...register('departureCity')} />
            {errors.departureCity && <small className="text-danger">{errors.departureCity.message}</small>}
          </div>

          <div className="col-md-4">
            <label className="form-label">Destination <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Makkah & Madinah" {...register('destination')} />
            {errors.destination && <small className="text-danger">{errors.destination.message}</small>}
          </div>

          <div className="col-md-4">
            <label className="form-label">Duration (days) <span className="text-danger">*</span></label>
            <input type="number" className="form-control" placeholder="15" {...register('durationDays')} />
            {errors.durationDays && <small className="text-danger">{errors.durationDays.message}</small>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Departure date</label>
            <input type="date" className="form-control" {...register('departureDate')} />
            <small className="text-muted">Leave empty for an on-request package.</small>
          </div>

          <div className="col-md-6">
            <label className="form-label">Return date</label>
            <input type="date" className="form-control" {...register('returnDate')} />
            {errors.returnDate && <small className="text-danger d-block">{errors.returnDate.message}</small>}
          </div>

          <div className="col-md-4">
            <label className="form-label">Price ({currency.code}) <span className="text-danger">*</span></label>
            <input type="number" className="form-control" placeholder="385000" {...register('price')} />
            {errors.price && <small className="text-danger">{errors.price.message}</small>}
          </div>

          <div className="col-md-4">
            <label className="form-label">Price is</label>
            <select className="form-select" {...register('priceType')}>
              <option value="per_person">Per person</option>
              <option value="per_group">Per group</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Max travellers</label>
            <input type="number" className="form-control" placeholder="40" {...register('maxTravelers')} />
            {errors.maxTravelers && <small className="text-danger">{errors.maxTravelers.message}</small>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Hotel</label>
            <input type="text" className="form-control" placeholder="4-star, 800m from Haram" {...register('hotelInfo')} />
            {errors.hotelInfo && <small className="text-danger">{errors.hotelInfo.message}</small>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Transport</label>
            <input type="text" className="form-control" placeholder="Return flights + AC coach" {...register('transportInfo')} />
            {errors.transportInfo && <small className="text-danger">{errors.transportInfo.message}</small>}
          </div>

          {/* Inclusions / exclusions */}
          {([
            ['What is included', inclusions, setInclusions, inclusionDraft, setInclusionDraft, 'Visa, flights, hotel, transport'],
            ['What is not included', exclusions, setExclusions, exclusionDraft, setExclusionDraft, 'Food, personal expenses'],
          ] as const).map(([label, list, setList, draft, setDraft, placeholder]) => (
            <div className="col-md-6" key={label}>
              <label className="form-label">{label}</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder={placeholder}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    // Enter adds a line; it must not submit the whole form.
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    addListItem(draft, setDraft, list as string[], setList);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => addListItem(draft, setDraft, list as string[], setList)}
                >
                  Add
                </button>
              </div>
              {list.length > 0 && (
                <ul className="list-unstyled mt-2 mb-0">
                  {list.map((item, index) => (
                    <li key={`${item}-${index}`} className="d-flex justify-content-between align-items-center py-1">
                      <span>{item}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => setList(list.filter((_, i) => i !== index))}
                        aria-label={`Remove ${item}`}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="col-12">
            <label className="form-label">Photos</label>
            <input
              type="file"
              className="form-control"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isUploading || images.length >= MAX_IMAGES}
              onChange={handleImagePick}
            />
            <small className="text-muted">
              JPG, PNG or WebP, up to 5MB each. {images.length}/{MAX_IMAGES} uploaded.
            </small>
            {isUploading && <div className="mt-2"><span className="spinner-border spinner-border-sm me-2"></span>Uploading…</div>}
            {images.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {images.map((image) => (
                  <div key={image.url} className="position-relative">
                    <img
                      src={image.url}
                      alt=""
                      style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute top-0 end-0"
                      style={{ padding: '0 6px', lineHeight: 1.4 }}
                      onClick={() => setImages(images.filter((item) => item.url !== image.url))}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-12">
            <label className="form-label">Terms and conditions</label>
            <textarea className="form-control" rows={3} {...register('termsAndConditions')} />
            {errors.termsAndConditions && <small className="text-danger">{errors.termsAndConditions.message}</small>}
          </div>

          <div className="col-12">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="package-active" {...register('isActive')} />
              <label className="form-check-label" htmlFor="package-active">
                Show this package to customers
              </label>
            </div>
            <small className="text-muted">
              Turn this off to retire a package without deleting it — for a departure that has passed or a group that is full.
            </small>
          </div>
        </div>
      </div>

      <div className="card-footer d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={isSaving || isUploading}>
          {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create package'}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PackageForm;
