import React, { useState } from 'react';
import Modal from '../../common/Modal';
import RichTextEditor from '../../common/RichTextEditor';
import { legalPageService } from '../../../services/legalPageService';
import { extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { type LegalPage, type LegalPageInput } from '../../../types/legalPage';

interface LegalPageFormModalProps {
  /** Existing page to edit, or null to create a new one. */
  page: LegalPage | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: LegalPageInput = {
  slug: '',
  title: '',
  content: '',
  excerpt: '',
  metaTitle: '',
  metaDescription: '',
  status: 'draft',
  displayOrder: 0,
  showInFooter: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Create/edit a legal document. Reuses the project's Modal and the shared
 * RichTextEditor — the same editor the blog module uses, so admins get one
 * consistent writing experience and there is only one editor to maintain.
 */
const LegalPageFormModal: React.FC<LegalPageFormModalProps> = ({ page, onClose, onSaved }) => {
  const isEdit = Boolean(page?._id);
  const [form, setForm] = useState<LegalPageInput>(
    page
      ? {
        slug: page.slug,
        title: page.title,
        content: page.content || '',
        excerpt: page.excerpt || '',
        metaTitle: page.metaTitle || '',
        metaDescription: page.metaDescription || '',
        status: page.status || 'draft',
        displayOrder: page.displayOrder ?? 0,
        showInFooter: page.showInFooter ?? true,
      }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // On a new page the slug tracks the title until the admin edits it by hand.
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const set = <K extends keyof LegalPageInput>(key: K, value: LegalPageInput[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => (previous[key as string] ? { ...previous, [key as string]: '' } : previous));
  };

  const onTitleChange = (value: string) => {
    set('title', value);
    if (!slugTouched) set('slug', slugify(value));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && page?._id) await legalPageService.update(page._id, form);
      else await legalPageService.create(form);

      showToast.success(isEdit ? 'Legal page updated' : 'Legal page created');
      onSaved();
    } catch (error) {
      const parsed = extractApiError(error);
      setErrors(parsed.errors || {});
      showToast.error(parsed.errors ? 'Please fix the highlighted fields' : parsed.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? `Edit ${page?.title}` : 'New legal page'}
      size="xl"
      busy={saving}
      onSubmit={save}
      footer={(
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create page'}
          </button>
        </>
      )}
    >
      <div className="row">
        <div className="col-lg-8">
          <div className="mb-20">
            <label htmlFor="lp-title" className="form-label fw-semibold">
              Title<span className="text-danger ms-1">*</span>
            </label>
            <input
              id="lp-title"
              className={`form-control${errors.title ? ' is-invalid' : ''}`}
              value={form.title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Terms & Conditions"
              disabled={saving}
            />
            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
          </div>

          <div className="mb-20">
            <label htmlFor="lp-slug" className="form-label fw-semibold">
              URL slug<span className="text-danger ms-1">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">/legal/</span>
              <input
                id="lp-slug"
                className={`form-control${errors.slug ? ' is-invalid' : ''}`}
                value={form.slug}
                onChange={(event) => { setSlugTouched(true); set('slug', event.target.value); }}
                placeholder="terms-and-conditions"
                disabled={saving}
              />
              {errors.slug && <div className="invalid-feedback">{errors.slug}</div>}
            </div>
            <small className="text-muted d-block mt-1">
              Lowercase letters, numbers and hyphens. Changing it on a published page breaks existing links.
            </small>
          </div>

          <div className="mb-20">
            <label className="form-label fw-semibold">
              Content<span className="text-danger ms-1">*</span>
            </label>
            <RichTextEditor
              content={form.content}
              onChange={(content) => set('content', content)}
              placeholder="Write the policy here — use headings for each section…"
              disabled={saving}
              minHeight={360}
            />
            {errors.content && <div className="text-danger small mt-2">{errors.content}</div>}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="mb-20">
            <label htmlFor="lp-status" className="form-label fw-semibold">Status</label>
            <select
              id="lp-status"
              className="form-select"
              value={form.status}
              onChange={(event) => set('status', event.target.value as LegalPageInput['status'])}
              disabled={saving}
            >
              <option value="draft">Draft — not visible to visitors</option>
              <option value="published">Published — live on the website</option>
            </select>
          </div>

          <div className="mb-20">
            <label htmlFor="lp-excerpt" className="form-label fw-semibold">Summary</label>
            <textarea
              id="lp-excerpt"
              rows={3}
              className="form-control"
              value={form.excerpt || ''}
              onChange={(event) => set('excerpt', event.target.value)}
              placeholder="One line shown under the page title."
              disabled={saving}
            />
          </div>

          <div className="mb-20">
            <label htmlFor="lp-metaTitle" className="form-label fw-semibold">SEO title</label>
            <input
              id="lp-metaTitle"
              className="form-control"
              value={form.metaTitle || ''}
              onChange={(event) => set('metaTitle', event.target.value)}
              placeholder="Defaults to the page title"
              disabled={saving}
            />
          </div>

          <div className="mb-20">
            <label htmlFor="lp-metaDescription" className="form-label fw-semibold">SEO description</label>
            <textarea
              id="lp-metaDescription"
              rows={3}
              className="form-control"
              value={form.metaDescription || ''}
              onChange={(event) => set('metaDescription', event.target.value)}
              placeholder="Shown in search results. Around 155 characters."
              disabled={saving}
            />
          </div>

          <div className="mb-20">
            <label htmlFor="lp-displayOrder" className="form-label fw-semibold">Display order</label>
            <input
              id="lp-displayOrder"
              type="number"
              className="form-control"
              value={form.displayOrder ?? 0}
              onChange={(event) => set('displayOrder', Number(event.target.value))}
              disabled={saving}
            />
            <small className="text-muted d-block mt-1">Lower numbers appear first in the footer.</small>
          </div>

          <div className="form-check">
            <input
              id="lp-showInFooter"
              type="checkbox"
              className="form-check-input"
              checked={form.showInFooter ?? true}
              onChange={(event) => set('showInFooter', event.target.checked)}
              disabled={saving}
            />
            <label className="form-check-label" htmlFor="lp-showInFooter">
              Link from the footer
              <small className="d-block text-muted">The page stays reachable by URL either way.</small>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LegalPageFormModal;
