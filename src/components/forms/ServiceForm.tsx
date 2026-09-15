import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { type Service, type CreateServiceData } from '../../types/service';
import { serviceService } from '../../services/serviceService';
import { showToast, getErrorMessage } from '../../utils/toast';
import { trackUploadProgress } from '../../utils/uploadHandler';

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: CreateServiceData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// interface FormData {
//   title: string;
//   description: string;
//   pictures: File[];
//   contactDetails: {
//     phone: string;
//     email: string;
//     address: string;
//     website: string;
//   };
//   category: string;
//   price: number;
//   location: {
//     city: string;
//     state: string;
//     country: string;
//     coordinates: {
//       lat: number;
//       lng: number;
//     };
//   };
// }

const schema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  pictures: yup.array().optional(),
  contactDetails: yup.object({
    phone: yup.string().required('Phone is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    address: yup.string().required('Address is required'),
    website: yup.string().url('Invalid website URL').required('Website is required'),
  }),
  category: yup.string().required('Category is required'),
  price: yup.number().required('Price is required').min(0, 'Price must be positive'),
  location: yup.object({
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    country: yup.string().required('Country is required'),
    coordinates: yup.object({
      lat: yup.number().required('Latitude is required'),
      lng: yup.number().required('Longitude is required'),
    }),
  }),
});

const categories = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'tours', label: 'Tours' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSubmit, onCancel, isLoading = false }) => {
  const [description, setDescription] = useState(service?.description || '');
  // Images already saved on the service (Cloudinary URLs). Tracked separately
  // from newly picked files so an edit keeps what's already there.
  const [existingPictures, setExistingPictures] = useState<string[]>(service?.pictures || []);
  // Object URLs for files picked in this session, rebuilt whenever they change.
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: service?.title || '',
      description: service?.description || '',
      pictures: [],
      contactDetails: {
        phone: service?.contactDetails.phone || '',
        email: service?.contactDetails.email || '',
        address: service?.contactDetails.address || '',
        website: service?.contactDetails.website || '',
      },
      category: service?.category || '',
      price: service?.price || 0,
      location: {
        city: service?.location.city || '',
        state: service?.location.state || '',
        country: service?.location.country || '',
        coordinates: {
          lat: service?.location.coordinates.lat || 0,
          lng: service?.location.coordinates.lng || 0,
        },
      },
    },
  });

  const watchedPictures = watch('pictures');
  const totalImageCount = existingPictures.length + newPreviews.length;

  useEffect(() => {
    const files = Array.from(watchedPictures || []).filter((f): f is File => f instanceof File);
    const urls = files.map((file) => URL.createObjectURL(file));
    setNewPreviews(urls);
    // Object URLs leak until revoked, so release the previous batch whenever
    // the selection changes and on unmount.
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [watchedPictures]);

  // Re-seed when the form is handed a different service to edit. Keyed on the
  // joined URLs rather than the array identity, so a parent refetch handing
  // back an equal-but-new array doesn't silently undo the user's removals.
  const servicePicturesKey = (service?.pictures || []).join('|');
  useEffect(() => {
    setExistingPictures(service?.pictures || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?._id, servicePicturesKey]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files || []);
    if (picked.length === 0) return;

    const current = Array.from(watchedPictures || []).filter((f): f is File => f instanceof File);
    // Append rather than replace, so picking a second time adds to the set.
    // Skip files already staged, since re-opening the picker is easy to repeat.
    const isDuplicate = (file: File) => current.some(
      (existing) => existing.name === file.name
        && existing.size === file.size
        && existing.lastModified === file.lastModified
    );
    const added = picked.filter((file) => !isDuplicate(file));

    if (added.length < picked.length) {
      showToast.info('Some images were already selected and have been skipped');
    }
    if (added.length > 0) {
      setValue('pictures', [...current, ...added], { shouldValidate: true });
    }

    // Clear the input so the same file can be chosen again after removal.
    event.target.value = '';
  };

  // Drops an image that is already saved on the service.
  const removeExistingImage = (index: number) => {
    setExistingPictures((previous) => previous.filter((_, i) => i !== index));
  };

  // Drops a file picked in this session, before it is ever uploaded.
  const removeNewImage = (index: number) => {
    const current = Array.from(watchedPictures || []).filter((f): f is File => f instanceof File);
    setValue('pictures', current.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setDescription(content);
      setValue('description', content);
    }
  };

  const onFormSubmit = async (data: any) => {
    try {
      const files = Array.from(data.pictures || []).filter(f => f instanceof File) as File[];
      const pictureUrls: string[] = [];

      // Upload pictures if provided with rollback support
      if (files.length > 0) {
        setIsUploading(true);

        // Upload all pictures with progress tracking
        const uploadedUrls = await trackUploadProgress.uploadMultiple(
          files,
          (file) => serviceService.uploadServiceImages([file]).then(urls => ({
            url: urls[0],
            publicId: `unknown-${Date.now()}`, // We don't have publicId from current API
          })),
          (current, total) => {
            setUploadProgress((current / total) * 100);
          }
        );

        pictureUrls.push(...uploadedUrls.urls);

        if (pictureUrls.length === 0 && files.length > 0) {
          throw new Error('Failed to upload images');
        }

        setIsUploading(false);
        setUploadProgress(0);
      }

      const serviceData: CreateServiceData = {
        title: data.title,
        description: data.description,
        // Previously saved images the user kept, plus anything uploaded now.
        // Sending only the new uploads would wipe the existing gallery on edit.
        pictures: [...existingPictures, ...pictureUrls],
        contactDetails: data.contactDetails,
        category: data.category as any,
        price: data.price,
        location: data.location,
      };

      await onSubmit(serviceData);
      showToast.success('Service created/updated successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsUploading(false);
      setUploadProgress(0);
      showToast.error(getErrorMessage(error));
      throw error;
    }
  };

  return (
    <div className="service-form">
      <div className="row">
        <div className="col-12">
          <div className="form-card">
            <div className="card-header">
              <h4>{service ? 'Edit Service' : 'Create New Service'}</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onFormSubmit)}>
                {/* Basic Information */}
                <div className="form-section mb-4">
                  <h5 className="section-title">Basic Information</h5>
                  
                  <div className="row g-3">
                    <div className="col-lg-8 col-md-7 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="title" className="form-label">Service Title *</label>
                        <input
                          type="text"
                          id="title"
                          className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                          {...register('title')}
                          placeholder="Enter service title"
                        />
                        {errors.title && (
                          <div className="invalid-feedback">{errors.title.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-5 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="category" className="form-label">Category *</label>
                        <select
                          id="category"
                          className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                          {...register('category')}
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        {errors.category && (
                          <div className="invalid-feedback">{errors.category.message}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="price" className="form-label">Price ($) *</label>
                    <input
                      type="number"
                      id="price"
                      className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                      {...register('price', { valueAsNumber: true })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.price && (
                      <div className="invalid-feedback">{errors.price.message}</div>
                    )}
                  </div>
                </div>

                {/* Description with Rich Text Editor */}
                <div className="form-section mb-4">
                  <h5 className="section-title">Description</h5>
                  
                  <div className="rich-text-editor">
                    <div className="editor-toolbar">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => formatText('bold')}
                        title="Bold"
                      >
                        <i className="fas fa-bold"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => formatText('italic')}
                        title="Italic"
                      >
                        <i className="fas fa-italic"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => formatText('underline')}
                        title="Underline"
                      >
                        <i className="fas fa-underline"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => formatText('insertUnorderedList')}
                        title="Bullet List"
                      >
                        <i className="fas fa-list-ul"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => formatText('insertOrderedList')}
                        title="Numbered List"
                      >
                        <i className="fas fa-list-ol"></i>
                      </button>
                    </div>
                    
                    <div
                      ref={editorRef}
                      contentEditable
                      className={`form-control editor-content ${errors.description ? 'is-invalid' : ''}`}
                      style={{ minHeight: '200px', padding: '10px' }}
                      onInput={handleEditorChange}
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                    {errors.description && (
                      <div className="invalid-feedback">{errors.description.message}</div>
                    )}
                  </div>
                </div>

                {/* Images */}
                <div className="form-section mb-4">
                  <h5 className="section-title">Service Images</h5>
                  
                  <div className="form-group mb-3">
                    <label htmlFor="images" className="form-label">
                      Upload Images {service ? '' : '*'}
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="images"
                      className={`form-control ${errors.pictures ? 'is-invalid' : ''}`}
                      onChange={handleImageUpload}
                      multiple
                      accept="image/*"
                    />
                    {errors.pictures && (
                      <div className="invalid-feedback">{errors.pictures.message}</div>
                    )}
                    <small className="form-text text-muted">
                      Choose one or more images. Picking again adds to the set rather than
                      replacing it, so you can build the gallery up over several goes.
                    </small>
                  </div>

                  {totalImageCount === 0 ? (
                    <div className="alert alert-light border text-center mb-0">
                      <i className="fas fa-images fa-2x text-muted mb-2 d-block" aria-hidden="true"></i>
                      <span className="text-muted">No images on this service yet.</span>
                    </div>
                  ) : (
                    <div className="image-previews">
                      <small className="text-muted d-block mb-2">
                        {totalImageCount} image{totalImageCount === 1 ? '' : 's'}
                        {newPreviews.length > 0 && <> · {newPreviews.length} pending upload</>}
                      </small>
                      <div className="row">
                        {/* Already saved on the service */}
                        {existingPictures.map((url, index) => (
                          <div key={`existing-${url}`} className="col-md-3 mb-3">
                            <div className="image-preview-card">
                              <img
                                src={url}
                                alt={`Service image ${index + 1}`}
                                className="img-fluid rounded"
                                style={{ height: '150px', objectFit: 'cover', width: '100%' }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger mt-2 w-100"
                                onClick={() => removeExistingImage(index)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Picked in this session, not uploaded yet */}
                        {newPreviews.map((preview, index) => (
                          <div key={`new-${preview}`} className="col-md-3 mb-3">
                            <div className="image-preview-card position-relative">
                              <span
                                className="badge bg-primary position-absolute"
                                style={{ top: 8, left: 8 }}
                              >
                                New
                              </span>
                              <img
                                src={preview}
                                alt={`New image ${index + 1}`}
                                className="img-fluid rounded"
                                style={{ height: '150px', objectFit: 'cover', width: '100%' }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger mt-2 w-100"
                                onClick={() => removeNewImage(index)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Details */}
                <div className="form-section mb-4">
                  <h5 className="section-title">Contact Details</h5>
                  
                  <div className="row g-3">
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="phone" className="form-label">Phone *</label>
                        <input
                          type="tel"
                          id="phone"
                          className={`form-control ${errors.contactDetails?.phone ? 'is-invalid' : ''}`}
                          {...register('contactDetails.phone')}
                          placeholder="+1 (555) 123-4567"
                        />
                        {errors.contactDetails?.phone && errors.contactDetails.phone.message && (
                          <div className="invalid-feedback">{errors.contactDetails.phone.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="email" className="form-label">Email *</label>
                        <input
                          type="email"
                          id="email"
                          className={`form-control ${errors.contactDetails?.email ? 'is-invalid' : ''}`}
                          {...register('contactDetails.email')}
                          placeholder="contact@example.com"
                        />
                        {errors.contactDetails?.email && errors.contactDetails.email.message && (
                          <div className="invalid-feedback">{errors.contactDetails.email.message}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="address" className="form-label">Address *</label>
                    <textarea
                      id="address"
                      className={`form-control ${errors.contactDetails?.address ? 'is-invalid' : ''}`}
                      {...register('contactDetails.address')}
                      rows={3}
                      placeholder="Enter full address"
                    />
                    {errors.contactDetails?.address && errors.contactDetails.address.message && (
                      <div className="invalid-feedback">{errors.contactDetails.address.message}</div>
                    )}
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="website" className="form-label">Website *</label>
                    <input
                      type="url"
                      id="website"
                      className={`form-control ${errors.contactDetails?.website ? 'is-invalid' : ''}`}
                      {...register('contactDetails.website')}
                      placeholder="https://www.example.com"
                    />
                    {errors.contactDetails?.website && errors.contactDetails.website.message && (
                      <div className="invalid-feedback">{errors.contactDetails.website.message}</div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="form-section mb-4">
                  <h5 className="section-title">Location</h5>
                  
                  <div className="row g-3">
                    <div className="col-lg-4 col-md-6 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="city" className="form-label">City *</label>
                        <input
                          type="text"
                          id="city"
                          className={`form-control ${errors.location?.city ? 'is-invalid' : ''}`}
                          {...register('location.city')}
                          placeholder="Enter city"
                        />
                        {errors.location?.city && errors.location.city.message && (
                          <div className="invalid-feedback">{errors.location.city.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="state" className="form-label">State *</label>
                        <input
                          type="text"
                          id="state"
                          className={`form-control ${errors.location?.state ? 'is-invalid' : ''}`}
                          {...register('location.state')}
                          placeholder="Enter state"
                        />
                        {errors.location?.state && errors.location.state.message && (
                          <div className="invalid-feedback">{errors.location.state.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="country" className="form-label">Country *</label>
                        <input
                          type="text"
                          id="country"
                          className={`form-control ${errors.location?.country ? 'is-invalid' : ''}`}
                          {...register('location.country')}
                          placeholder="Enter country"
                        />
                        {errors.location?.country && errors.location.country.message && (
                          <div className="invalid-feedback">{errors.location.country.message}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="lat" className="form-label">Latitude *</label>
                        <input
                          type="number"
                          id="lat"
                          className={`form-control ${errors.location?.coordinates?.lat ? 'is-invalid' : ''}`}
                          {...register('location.coordinates.lat', { valueAsNumber: true })}
                          placeholder="0.000000"
                          step="any"
                        />
                        {errors.location?.coordinates?.lat && errors.location.coordinates.lat.message && (
                          <div className="invalid-feedback">{errors.location.coordinates.lat.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="lng" className="form-label">Longitude *</label>
                        <input
                          type="number"
                          id="lng"
                          className={`form-control ${errors.location?.coordinates?.lng ? 'is-invalid' : ''}`}
                          {...register('location.coordinates.lng', { valueAsNumber: true })}
                          placeholder="0.000000"
                          step="any"
                        />
                        {errors.location?.coordinates?.lng && errors.location.coordinates.lng.message && (
                          <div className="invalid-feedback">{errors.location.coordinates.lng.message}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && uploadProgress > 0 && (
                  <div className="mb-3">
                    <small className="text-muted d-block mb-2">Uploading images...</small>
                    <div className="progress" style={{ height: '4px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${uploadProgress}%` }}
                        aria-valuenow={uploadProgress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                    <small className="text-muted d-block mt-1">{Math.round(uploadProgress)}%</small>
                  </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                  <div className="d-flex justify-content-end gap-3 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-secondary flex-fill flex-md-fill-0"
                      onClick={onCancel}
                      disabled={isLoading || isUploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-fill flex-md-fill-0 position-relative"
                      disabled={isLoading || isUploading}
                      title={isUploading ? 'Uploading images...' : ''}
                    >
                      {isUploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <span className="d-none d-sm-inline">Uploading...</span>
                          <span className="d-sm-none">Upload...</span>
                        </>
                      ) : isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <span className="d-none d-sm-inline">{service ? 'Updating...' : 'Creating...'}</span>
                          <span className="d-sm-none">{service ? 'Update...' : 'Create...'}</span>
                        </>
                      ) : (
                        <>
                          <span className="d-none d-sm-inline">{service ? 'Update Service' : 'Create Service'}</span>
                          <span className="d-sm-none">{service ? 'Update' : 'Create'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;
