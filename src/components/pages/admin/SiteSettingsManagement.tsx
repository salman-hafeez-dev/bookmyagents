import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { CardSkeleton } from '../../dashboard-admin/Skeleton';
import { siteSettingsService } from '../../../services/siteSettingsService';
import { extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { siteApi } from '../../../redux/api/siteApi';
import {
  DAYS_OF_WEEK,
  SOCIAL_PLATFORMS,
  type BusinessHour,
  type QuickLink,
  type SiteSettings,
  type SocialLink,
} from '../../../types/siteSettings';

const EMPTY: SiteSettings = {
  businessName: '',
  tagline: '',
  description: '',
  phones: [],
  whatsapp: '',
  emails: [],
  address: { line1: '', line2: '', city: '', state: '', country: '', postalCode: '' },
  mapEmbedUrl: '',
  mapLink: '',
  businessHours: [],
  socialLinks: [],
  contactPage: { heading: '', subheading: '', infoHeading: '', infoText: '', formEnabled: true, formNote: '' },
  footer: { description: '', quickLinks: [], copyrightText: '' },
};

const defaultHours = (): BusinessHour[] =>
  DAYS_OF_WEEK.map((day) => ({
    day,
    opens: day === 'Sunday' ? '' : '09:00',
    closes: day === 'Sunday' ? '' : '18:00',
    closed: day === 'Sunday',
  }));

/**
 * The single place the site's business information is edited.
 *
 * Whatever is saved here is what the footer, the contact page and every other
 * public surface show — there is no second copy anywhere in the frontend. On
 * a successful save the shared siteApi cache is invalidated so the change is
 * visible without a reload.
 */
const SiteSettingsManagement: React.FC = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState<SiteSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await siteSettingsService.getAdminSettings();
      const data = response.data;
      if (data) {
        setForm({
          ...EMPTY,
          ...data,
          address: { ...EMPTY.address, ...(data.address || {}) },
          contactPage: { ...EMPTY.contactPage, ...(data.contactPage || {}) },
          footer: { ...EMPTY.footer, ...(data.footer || {}), quickLinks: data.footer?.quickLinks || [] },
          phones: data.phones || [],
          emails: data.emails || [],
          socialLinks: data.socialLinks || [],
          businessHours: data.businessHours?.length ? data.businessHours : defaultHours(),
        });
      }
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const clearError = (key: string) =>
    setErrors((previous) => (previous[key] ? { ...previous, [key]: '' } : previous));

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    clearError(key as string);
  };

  // --- repeatable list helpers (phones, emails, socials, quick links) ---

  const setListItem = (key: 'phones' | 'emails', index: number, value: string) => {
    const next = [...form[key]];
    next[index] = value;
    set(key, next);
  };

  const removeListItem = (key: 'phones' | 'emails', index: number) =>
    set(key, form[key].filter((_, position) => position !== index));

  const setSocial = (index: number, patch: Partial<SocialLink>) => {
    const next = form.socialLinks.map((link, position) => (position === index ? { ...link, ...patch } : link));
    set('socialLinks', next);
  };

  const setQuickLink = (index: number, patch: Partial<QuickLink>) => {
    const next = (form.footer.quickLinks || []).map((link, position) => (position === index ? { ...link, ...patch } : link));
    set('footer', { ...form.footer, quickLinks: next });
    clearError('footer.quickLinks');
  };

  const setHour = (index: number, patch: Partial<BusinessHour>) => {
    const next = form.businessHours.map((hour, position) => (position === index ? { ...hour, ...patch } : hour));
    set('businessHours', next);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      // Blank rows are dropped rather than rejected — an admin leaving an
      // empty "add another" row behind shouldn't fail the save.
      const payload: Partial<SiteSettings> = {
        ...form,
        phones: form.phones.map((phone) => phone.trim()).filter(Boolean),
        emails: form.emails.map((email) => email.trim()).filter(Boolean),
        socialLinks: form.socialLinks.filter((link) => link.platform && link.url.trim()),
        footer: {
          ...form.footer,
          quickLinks: (form.footer.quickLinks || []).filter((link) => link.label.trim() && link.url.trim()),
        },
      };

      await siteSettingsService.updateSettings(payload);

      // Everything public reads these through siteApi — drop the cached copy
      // so the footer and contact page pick up the new values right away.
      dispatch(siteApi.util.invalidateTags(['SiteSettings']));

      showToast.success('Site settings updated');
      fetchSettings();
    } catch (error) {
      const parsed = extractApiError(error);
      setErrors(parsed.errors || {});
      showToast.error(parsed.errors ? 'Please fix the highlighted fields' : parsed.message);
    } finally {
      setSaving(false);
    }
  };

  const input = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { required?: boolean; placeholder?: string; type?: string; error?: string; help?: string } = {},
  ) => (
    <div className="mb-20">
      <label htmlFor={id} className="form-label fw-semibold">
        {label}{options.required && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        id={id}
        type={options.type || 'text'}
        className={`form-control${options.error ? ' is-invalid' : ''}`}
        value={value || ''}
        placeholder={options.placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={saving}
      />
      {options.error && <div className="invalid-feedback">{options.error}</div>}
      {options.help && !options.error && <small className="text-muted d-block mt-1">{options.help}</small>}
    </div>
  );

  const textarea = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { rows?: number; placeholder?: string; error?: string; help?: string } = {},
  ) => (
    <div className="mb-20">
      <label htmlFor={id} className="form-label fw-semibold">{label}</label>
      <textarea
        id={id}
        rows={options.rows || 3}
        className={`form-control${options.error ? ' is-invalid' : ''}`}
        value={value || ''}
        placeholder={options.placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={saving}
      />
      {options.error && <div className="invalid-feedback">{options.error}</div>}
      {options.help && !options.error && <small className="text-muted d-block mt-1">{options.help}</small>}
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="card-body"><CardSkeleton count={3} /></div>
      </div>
    );
  }

  return (
    <form onSubmit={save}>
      <div className="dashboard-card mb-30">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0">Site &amp; Contact Settings</h4>
          <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save all changes'}
          </button>
        </div>
        <div className="card-body">
          <p className="text-muted">
            These details are what visitors see in the footer, on the Contact page and anywhere else the site
            shows your business information. Nothing here is hardcoded in the website — saving takes effect
            without a redeploy. Leave a field blank and it simply isn&apos;t shown.
          </p>
        </div>
      </div>

      {/* Business identity */}
      <div className="dashboard-card mb-30">
        <div className="card-header"><h5 className="mb-0">Business</h5></div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-6">
              {input('ss-businessName', 'Business name', form.businessName, (value) => set('businessName', value), {
                required: true, error: errors.businessName, placeholder: 'Book My Travel Agents',
              })}
            </div>
            <div className="col-lg-6">
              {input('ss-tagline', 'Tagline', form.tagline || '', (value) => set('tagline', value), {
                error: errors.tagline, placeholder: 'Find and book trusted travel agents',
              })}
            </div>
          </div>
          {textarea('ss-description', 'Short description', form.description || '', (value) => set('description', value), {
            error: errors.description,
            help: 'Used as the default blurb in the footer and as a fallback meta description.',
          })}
        </div>
      </div>

      {/* Contact channels */}
      <div className="dashboard-card mb-30">
        <div className="card-header"><h5 className="mb-0">Contact details</h5></div>
        <div className="card-body">
          <div className="mb-20">
            <label className="form-label fw-semibold">Phone numbers</label>
            {form.phones.length === 0 && (
              <p className="text-muted small mb-2">No phone number configured — no phone link is shown on the site.</p>
            )}
            {form.phones.map((phone, index) => (
              <div className="input-group mb-2" key={`phone-${index}`}>
                <input
                  className={`form-control${errors.phones ? ' is-invalid' : ''}`}
                  value={phone}
                  onChange={(event) => setListItem('phones', index, event.target.value)}
                  placeholder="+92 300 0000000"
                  aria-label={`Phone number ${index + 1}`}
                  disabled={saving}
                />
                <button
                  type="button" className="btn btn-outline-danger"
                  onClick={() => removeListItem('phones', index)}
                  disabled={saving}
                  aria-label={`Remove phone number ${index + 1}`}
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>
            ))}
            {errors.phones && <div className="text-danger small mb-2">{errors.phones}</div>}
            <button
              type="button" className="btn btn-sm btn-outline-secondary"
              onClick={() => set('phones', [...form.phones, ''])}
              disabled={saving}
            >
              <i className="fas fa-plus me-2" aria-hidden="true" />Add phone number
            </button>
          </div>

          <div className="row">
            <div className="col-lg-6">
              {input('ss-whatsapp', 'WhatsApp number', form.whatsapp || '', (value) => set('whatsapp', value), {
                error: errors.whatsapp,
                placeholder: '+92 300 0000000',
                help: 'Leave blank to hide every WhatsApp button on the site.',
              })}
            </div>
          </div>

          <div className="mb-20">
            <label className="form-label fw-semibold">Email addresses</label>
            {form.emails.map((email, index) => (
              <div className="input-group mb-2" key={`email-${index}`}>
                <input
                  className={`form-control${errors.emails ? ' is-invalid' : ''}`}
                  type="email"
                  value={email}
                  onChange={(event) => setListItem('emails', index, event.target.value)}
                  placeholder="info@example.com"
                  aria-label={`Email address ${index + 1}`}
                  disabled={saving}
                />
                <button
                  type="button" className="btn btn-outline-danger"
                  onClick={() => removeListItem('emails', index)}
                  disabled={saving}
                  aria-label={`Remove email address ${index + 1}`}
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>
            ))}
            {errors.emails && <div className="text-danger small mb-2">{errors.emails}</div>}
            <button
              type="button" className="btn btn-sm btn-outline-secondary"
              onClick={() => set('emails', [...form.emails, ''])}
              disabled={saving}
            >
              <i className="fas fa-plus me-2" aria-hidden="true" />Add email address
            </button>
          </div>
        </div>
      </div>

      {/* Address & map */}
      <div className="dashboard-card mb-30">
        <div className="card-header"><h5 className="mb-0">Address &amp; location</h5></div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-6">
              {input('ss-line1', 'Address line 1', form.address.line1 || '', (value) => set('address', { ...form.address, line1: value }), { placeholder: 'Office 12, Business Plaza' })}
            </div>
            <div className="col-lg-6">
              {input('ss-line2', 'Address line 2', form.address.line2 || '', (value) => set('address', { ...form.address, line2: value }))}
            </div>
            <div className="col-lg-4">
              {input('ss-city', 'City', form.address.city || '', (value) => set('address', { ...form.address, city: value }))}
            </div>
            <div className="col-lg-4">
              {input('ss-state', 'State / Province', form.address.state || '', (value) => set('address', { ...form.address, state: value }))}
            </div>
            <div className="col-lg-4">
              {input('ss-postalCode', 'Postal code', form.address.postalCode || '', (value) => set('address', { ...form.address, postalCode: value }))}
            </div>
            <div className="col-lg-4">
              {input('ss-country', 'Country', form.address.country || '', (value) => set('address', { ...form.address, country: value }))}
            </div>
          </div>

          {input('ss-mapLink', 'Google Maps link', form.mapLink || '', (value) => set('mapLink', value), {
            error: errors.mapLink,
            placeholder: 'https://maps.google.com/...',
            help: 'Where the address links to. Leave blank and the address is shown as plain text.',
          })}
          {input('ss-mapEmbedUrl', 'Google Maps embed URL', form.mapEmbedUrl || '', (value) => set('mapEmbedUrl', value), {
            error: errors.mapEmbedUrl,
            placeholder: 'https://www.google.com/maps/embed?pb=...',
            help: 'From Google Maps → Share → Embed a map → copy the src URL. Leave blank to hide the map.',
          })}
        </div>
      </div>

      {/* Business hours */}
      <div className="dashboard-card mb-30">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">Business hours</h5>
          {form.businessHours.length === 0 && (
            <button
              type="button" className="btn btn-sm btn-outline-secondary"
              onClick={() => set('businessHours', defaultHours())}
              disabled={saving}
            >
              Add a standard week
            </button>
          )}
        </div>
        <div className="card-body">
          {errors.businessHours && <div className="alert alert-danger py-2">{errors.businessHours}</div>}
          {form.businessHours.length === 0 ? (
            <p className="text-muted mb-0">No hours configured — the site won&apos;t show an opening-hours block.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Opens</th>
                    <th scope="col">Closes</th>
                    <th scope="col">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {form.businessHours.map((hour, index) => (
                    <tr key={hour.day}>
                      <td className="fw-semibold">{hour.day}</td>
                      <td>
                        <input
                          type="time" className="form-control" value={hour.opens || ''}
                          onChange={(event) => setHour(index, { opens: event.target.value })}
                          disabled={saving || hour.closed}
                          aria-label={`${hour.day} opening time`}
                        />
                      </td>
                      <td>
                        <input
                          type="time" className="form-control" value={hour.closes || ''}
                          onChange={(event) => setHour(index, { closes: event.target.value })}
                          disabled={saving || hour.closed}
                          aria-label={`${hour.day} closing time`}
                        />
                      </td>
                      <td>
                        <div className="form-check">
                          <input
                            id={`closed-${hour.day}`}
                            type="checkbox" className="form-check-input"
                            checked={hour.closed}
                            onChange={(event) => setHour(index, { closed: event.target.checked })}
                            disabled={saving}
                          />
                          <label className="form-check-label" htmlFor={`closed-${hour.day}`}>Closed</label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Social links */}
      <div className="dashboard-card mb-30">
        <div className="card-header"><h5 className="mb-0">Social links</h5></div>
        <div className="card-body">
          {errors.socialLinks && <div className="alert alert-danger py-2">{errors.socialLinks}</div>}
          {form.socialLinks.length === 0 && (
            <p className="text-muted small">No social links configured — the icon row is hidden entirely.</p>
          )}
          {form.socialLinks.map((link, index) => (
            <div className="row g-2 mb-2 align-items-center" key={`social-${index}`}>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={link.platform}
                  onChange={(event) => setSocial(index, { platform: event.target.value })}
                  disabled={saving}
                  aria-label={`Social platform ${index + 1}`}
                >
                  <option value="">Select platform…</option>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.value}>{platform.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-7">
                <input
                  className="form-control"
                  value={link.url}
                  onChange={(event) => setSocial(index, { url: event.target.value })}
                  placeholder="https://facebook.com/yourpage"
                  aria-label={`Social URL ${index + 1}`}
                  disabled={saving}
                />
              </div>
              <div className="col-md-1 text-end">
                <button
                  type="button" className="btn btn-outline-danger"
                  onClick={() => set('socialLinks', form.socialLinks.filter((_, position) => position !== index))}
                  disabled={saving}
                  aria-label={`Remove social link ${index + 1}`}
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          ))}
          <button
            type="button" className="btn btn-sm btn-outline-secondary mt-2"
            onClick={() => set('socialLinks', [...form.socialLinks, { platform: '', url: '' }])}
            disabled={saving}
          >
            <i className="fas fa-plus me-2" aria-hidden="true" />Add social link
          </button>
        </div>
      </div>

      {/* Contact page copy */}
      <div className="dashboard-card mb-30">
        <div className="card-header"><h5 className="mb-0">Contact page</h5></div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-6">
              {input('ss-cp-heading', 'Page heading', form.contactPage.heading || '', (value) => set('contactPage', { ...form.contactPage, heading: value }), { placeholder: "Let's connect and plan your next trip" })}
            </div>
            <div className="col-lg-6">
              {input('ss-cp-infoHeading', 'Information block heading', form.contactPage.infoHeading || '', (value) => set('contactPage', { ...form.contactPage, infoHeading: value }), { placeholder: 'Information' })}
            </div>
          </div>
          {textarea('ss-cp-subheading', 'Page subheading', form.contactPage.subheading || '', (value) => set('contactPage', { ...form.contactPage, subheading: value }), { rows: 2, help: 'Also used as the page’s meta description.' })}
          {textarea('ss-cp-infoText', 'Information block text', form.contactPage.infoText || '', (value) => set('contactPage', { ...form.contactPage, infoText: value }), { rows: 2 })}

          <div className="form-check mb-20">
            <input
              id="ss-cp-formEnabled"
              type="checkbox" className="form-check-input"
              checked={form.contactPage.formEnabled}
              onChange={(event) => set('contactPage', { ...form.contactPage, formEnabled: event.target.checked })}
              disabled={saving}
            />
            <label className="form-check-label" htmlFor="ss-cp-formEnabled">
              Show the message form
              <small className="d-block text-muted">
                Switch off to show only your contact details, with the note below in place of the form.
              </small>
            </label>
          </div>
          {textarea('ss-cp-formNote', 'Note shown with the form', form.contactPage.formNote || '', (value) => set('contactPage', { ...form.contactPage, formNote: value }), { rows: 2 })}
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-card mb-30">
        <div className="card-header"><h5 className="mb-0">Footer</h5></div>
        <div className="card-body">
          {textarea('ss-footer-description', 'Footer description', form.footer.description || '', (value) => set('footer', { ...form.footer, description: value }), {
            rows: 2, help: 'Falls back to the short business description when left blank.',
          })}

          <div className="mb-20">
            <label className="form-label fw-semibold">Quick links</label>
            {errors['footer.quickLinks'] && <div className="text-danger small mb-2">{errors['footer.quickLinks']}</div>}
            {(form.footer.quickLinks || []).map((link, index) => (
              <div className="row g-2 mb-2 align-items-center" key={`quicklink-${index}`}>
                <div className="col-md-4">
                  <input
                    className="form-control" value={link.label}
                    onChange={(event) => setQuickLink(index, { label: event.target.value })}
                    placeholder="About Us" aria-label={`Quick link label ${index + 1}`} disabled={saving}
                  />
                </div>
                <div className="col-md-7">
                  <input
                    className="form-control" value={link.url}
                    onChange={(event) => setQuickLink(index, { url: event.target.value })}
                    placeholder="/about" aria-label={`Quick link URL ${index + 1}`} disabled={saving}
                  />
                </div>
                <div className="col-md-1 text-end">
                  <button
                    type="button" className="btn btn-outline-danger"
                    onClick={() => set('footer', {
                      ...form.footer,
                      quickLinks: (form.footer.quickLinks || []).filter((_, position) => position !== index),
                    })}
                    disabled={saving}
                    aria-label={`Remove quick link ${index + 1}`}
                  >
                    <i className="fas fa-times" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button" className="btn btn-sm btn-outline-secondary mt-2"
              onClick={() => set('footer', { ...form.footer, quickLinks: [...(form.footer.quickLinks || []), { label: '', url: '' }] })}
              disabled={saving}
            >
              <i className="fas fa-plus me-2" aria-hidden="true" />Add quick link
            </button>
            <small className="text-muted d-block mt-2">
              Internal paths like <code>/about</code> stay inside the site; full URLs open in a new tab.
              Terms, privacy and any other published legal page are linked automatically.
            </small>
          </div>

          {input('ss-footer-copyright', 'Copyright text', form.footer.copyrightText || '', (value) => set('footer', { ...form.footer, copyrightText: value }), {
            placeholder: `Copyright © ${new Date().getFullYear()} ${form.businessName || 'Your business'} | All Rights Reserved`,
            help: 'Leave blank to use the business name and the current year automatically.',
          })}
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mb-30">
        <button type="button" className="btn btn-outline-secondary" onClick={fetchSettings} disabled={saving}>
          Discard changes
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save all changes'}
        </button>
      </div>
    </form>
  );
};

export default SiteSettingsManagement;
