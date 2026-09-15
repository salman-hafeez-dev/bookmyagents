import React, { useState } from 'react';
import ProfileFormField from './ProfileFormField';
import { agentProfileService, extractApiError } from '../../../../services/agentProfileService';
import { showToast } from '../../../../utils/toast';
import {
  type AgentBusinessDetails,
  type AgentProfile,
  type AgentSocialMedia,
  type ProfileProgress,
} from '../../../../types/agentProfile';

interface StepBusinessDetailsProps {
  profile: AgentProfile;
  locked: boolean;
  onSaved: (progress: ProfileProgress) => void;
  onBack: () => void;
  onNext: () => void;
}

const SOCIAL_FIELDS: { key: keyof AgentSocialMedia; label: string; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourpage' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourpage' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/yourpage' },
];

const MAX_AREAS = 20;

const StepBusinessDetails: React.FC<StepBusinessDetailsProps> = ({
  profile, locked, onSaved, onBack, onNext,
}) => {
  const [form, setForm] = useState<AgentBusinessDetails>({
    companyDescription: profile.businessDetails.companyDescription || '',
    yearsExperience: profile.businessDetails.yearsExperience ?? '',
    servicesOffered: profile.businessDetails.servicesOffered || '',
    areaServed: profile.businessDetails.areaServed || [],
    socialMedia: profile.businessDetails.socialMedia || {},
  });
  const [areaDraft, setAreaDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => (previous[name] ? { ...previous, [name]: '' } : previous));
  };

  const handleSocialChange = (key: keyof AgentSocialMedia, value: string) => {
    setForm((previous) => ({ ...previous, socialMedia: { ...previous.socialMedia, [key]: value } }));
    setErrors((previous) => (previous[`socialMedia.${key}`] ? { ...previous, [`socialMedia.${key}`]: '' } : previous));
  };

  const addArea = () => {
    const area = areaDraft.trim();
    if (!area) return;
    if (form.areaServed.length >= MAX_AREAS) {
      showToast.info(`You can list at most ${MAX_AREAS} areas served`);
      return;
    }
    // Case-insensitive so "Dubai" and "dubai" don't both end up in the list.
    if (form.areaServed.some((existing) => existing.toLowerCase() === area.toLowerCase())) {
      showToast.info(`"${area}" is already on the list`);
      setAreaDraft('');
      return;
    }
    setForm((previous) => ({ ...previous, areaServed: [...previous.areaServed, area] }));
    setAreaDraft('');
    setErrors((previous) => (previous.areaServed ? { ...previous, areaServed: '' } : previous));
  };

  const removeArea = (area: string) => {
    setForm((previous) => ({
      ...previous,
      areaServed: previous.areaServed.filter((existing) => existing !== area),
    }));
  };

  const handleAreaKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter adds an area rather than submitting the surrounding form.
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addArea();
    }
  };

  const save = async (): Promise<boolean> => {
    setSaving(true);
    setErrors({});
    try {
      const response = await agentProfileService.saveBusinessDetails(form);
      onSaved(response.data);
      showToast.success('Business details saved');
      return true;
    } catch (error) {
      const parsed = extractApiError(error);
      setErrors(parsed.errors || {});
      showToast.error(parsed.errors ? 'Please fix the highlighted fields' : parsed.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (await save()) onNext();
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h4>Step 2 — Business details</h4>
      </div>
      <div className="card-body">
        <fieldset disabled={locked || saving} style={{ border: 0, padding: 0, margin: 0 }}>
          <ProfileFormField
            label="Company description" name="companyDescription" type="textarea"
            value={form.companyDescription} onChange={handleChange} required
            error={errors.companyDescription} rows={6} minLength={100} maxLength={1000}
            placeholder="Tell travellers who you are, what makes your agency different, and the kind of trips you specialise in."
            hint="At least 100 characters — this is the main thing travellers read about you."
          />

          <div className="row">
            <div className="col-md-4">
              <ProfileFormField
                label="Years of experience" name="yearsExperience" type="number"
                value={form.yearsExperience} onChange={handleChange} required
                error={errors.yearsExperience} min={0} max={100} placeholder="10"
              />
            </div>
            <div className="col-md-8">
              <ProfileFormField
                label="Services offered" name="servicesOffered" value={form.servicesOffered}
                onChange={handleChange} required error={errors.servicesOffered}
                placeholder="Umrah packages, visa processing, ticketing…"
                minLength={10} maxLength={500}
              />
            </div>
          </div>

          <div className="mb-20">
            <label htmlFor="agent-profile-area-draft" className="form-label fw-semibold">
              Areas served<span className="text-danger ms-1">*</span>
            </label>
            <div className="input-group">
              <input
                id="agent-profile-area-draft"
                type="text"
                className={`form-control${errors.areaServed ? ' is-invalid' : ''}`}
                value={areaDraft}
                onChange={(event) => setAreaDraft(event.target.value)}
                onKeyDown={handleAreaKeyDown}
                placeholder="e.g. Saudi Arabia, then press Enter"
                aria-describedby="agent-profile-area-hint"
              />
              <button type="button" className="btn btn-outline-primary" onClick={addArea} disabled={!areaDraft.trim()}>
                Add
              </button>
            </div>
            <small id="agent-profile-area-hint" className="text-muted">
              Countries or regions you arrange travel to. Press Enter to add each one.
            </small>
            {errors.areaServed && <div><small className="text-danger">{errors.areaServed}</small></div>}

            {form.areaServed.length > 0 && (
              <ul className="list-unstyled d-flex flex-wrap gap-2 mt-2 mb-0">
                {form.areaServed.map((area) => (
                  <li key={area}>
                    <span className="badge bg-primary d-inline-flex align-items-center gap-2 p-2">
                      {area}
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        style={{ fontSize: '0.6rem' }}
                        aria-label={`Remove ${area}`}
                        onClick={() => removeArea(area)}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h6 className="fw-semibold mb-2">Social media <span className="text-muted fw-normal">(optional)</span></h6>
          <div className="row">
            {SOCIAL_FIELDS.map((field) => (
              <div className="col-md-6" key={field.key}>
                <ProfileFormField
                  label={field.label}
                  name={`socialMedia.${field.key}`}
                  type="url"
                  value={form.socialMedia?.[field.key] || ''}
                  onChange={(event) => handleSocialChange(field.key, event.target.value)}
                  error={errors[`socialMedia.${field.key}`]}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="d-flex justify-content-between gap-2 mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack} disabled={saving}>
            Back
          </button>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={save} disabled={locked || saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveAndContinue} disabled={locked || saving}>
              {saving ? 'Saving…' : 'Save & continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepBusinessDetails;
