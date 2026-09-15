import React, { useState } from 'react';
import ProfileFormField from './ProfileFormField';
import { agentProfileService, extractApiError } from '../../../../services/agentProfileService';
import { showToast } from '../../../../utils/toast';
import {
  type AgentBasicInfo,
  type AgentProfile,
  type ProfileProgress,
} from '../../../../types/agentProfile';

interface StepBasicInfoProps {
  profile: AgentProfile;
  locked: boolean;
  onSaved: (progress: ProfileProgress) => void;
  onNext: () => void;
}

const PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir', 'Islamabad Capital Territory'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha', 'Other'];

const toOptions = (values: string[], placeholder: string) => [
  { value: '', label: placeholder },
  ...values.map((value) => ({ value, label: value })),
];

const StepBasicInfo: React.FC<StepBasicInfoProps> = ({ profile, locked, onSaved, onNext }) => {
  const [form, setForm] = useState<AgentBasicInfo>({
    companyName: profile.basicInfo.companyName || '',
    ownerName: profile.basicInfo.ownerName || '',
    phone: profile.basicInfo.phone || '',
    whatsapp: profile.basicInfo.whatsapp || '',
    email: profile.basicInfo.email || '',
    website: profile.basicInfo.website || '',
    businessLocation: profile.basicInfo.businessLocation || '',
    city: profile.basicInfo.city || '',
    province: profile.basicInfo.province || '',
    officeAddress: profile.basicInfo.officeAddress || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    // Clear the field's error as soon as the agent starts fixing it.
    setErrors((previous) => (previous[name] ? { ...previous, [name]: '' } : previous));
  };

  const save = async (): Promise<boolean> => {
    setSaving(true);
    setErrors({});
    try {
      const response = await agentProfileService.saveBasicInfo(form);
      onSaved(response.data);
      showToast.success('Basic information saved');
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
        <h4>Step 1 — Basic information</h4>
      </div>
      <div className="card-body">
        <fieldset disabled={locked || saving} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="row">
            <div className="col-md-6">
              <ProfileFormField
                label="Company name" name="companyName" value={form.companyName}
                onChange={handleChange} required error={errors.companyName}
                placeholder="e.g. Al-Madinah Travels" maxLength={100}
              />
            </div>
            <div className="col-md-6">
              <ProfileFormField
                label="Owner / authorised person" name="ownerName" value={form.ownerName}
                onChange={handleChange} required error={errors.ownerName}
                placeholder="Full name" maxLength={100}
              />
            </div>
            <div className="col-md-6">
              <ProfileFormField
                label="Phone number" name="phone" type="tel" value={form.phone}
                onChange={handleChange} required error={errors.phone}
                placeholder="+923001234567" hint="Format: +923XXXXXXXXX or 03XXXXXXXXX"
              />
            </div>
            <div className="col-md-6">
              <ProfileFormField
                label="WhatsApp number" name="whatsapp" type="tel" value={form.whatsapp}
                onChange={handleChange} required error={errors.whatsapp}
                placeholder="+923001234567" hint="Travellers will contact you here"
              />
            </div>
            <div className="col-md-6">
              <ProfileFormField
                label="Business email" name="email" type="email" value={form.email}
                onChange={handleChange} required error={errors.email}
                placeholder="bookings@yourcompany.com"
                hint="Public contact address — it does not have to match your login email"
              />
            </div>
            <div className="col-md-6">
              <ProfileFormField
                label="Website" name="website" type="url" value={form.website || ''}
                onChange={handleChange} error={errors.website}
                placeholder="https://yourcompany.com" hint="Optional"
              />
            </div>
            <div className="col-md-6">
              <ProfileFormField
                label="Business location" name="businessLocation" value={form.businessLocation}
                onChange={handleChange} required error={errors.businessLocation}
                placeholder="e.g. Gulberg III" hint="Area or neighbourhood"
              />
            </div>
            <div className="col-md-6">
              <ProfileFormField
                label="City" name="city" type="select" value={form.city}
                onChange={handleChange} required error={errors.city}
                options={toOptions(CITIES, 'Select city')}
              />
            </div>
            <div className="col-md-6">
              <ProfileFormField
                label="Province" name="province" type="select" value={form.province}
                onChange={handleChange} required error={errors.province}
                options={toOptions(PROVINCES, 'Select province')}
              />
            </div>
            <div className="col-12">
              <ProfileFormField
                label="Office address" name="officeAddress" type="textarea" value={form.officeAddress}
                onChange={handleChange} required error={errors.officeAddress}
                placeholder="Complete office address" minLength={10} maxLength={500}
              />
            </div>
          </div>
        </fieldset>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={save} disabled={locked || saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSaveAndContinue} disabled={locked || saving}>
            {saving ? 'Saving…' : 'Save & continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepBasicInfo;
