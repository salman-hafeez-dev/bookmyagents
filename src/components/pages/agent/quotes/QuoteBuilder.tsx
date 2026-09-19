import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../common/Modal';
import { type Lead } from '../../../../types/lead';
import {
  type Quote,
  type QuoteInput,
  type QuoteLineItem,
} from '../../../../types/quote';
import { quoteService } from '../../../../services/quoteService';
import { showToast } from '../../../../utils/toast';
import { formatMoney } from '../../../../utils/format';

interface QuoteBuilderProps {
  open: boolean;
  onClose: () => void;
  // Building a new quotation from a lead, or editing an existing one.
  lead?: Lead | null;
  quote?: Quote | null;
  onSaved: (quote: Quote) => void;
}

const BLANK_ITEM: QuoteLineItem = { description: '', detail: '', amount: 0 };

// The services an agent quotes most often, offered as one-tap starting points
// so a typical quotation is a few taps rather than a blank form.
const SUGGESTED = ['Flights', 'Hotel', 'Transport', 'Visa', 'Activities', 'Tour services'];

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

const defaultValidity = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
};

// Where the agent turns a customer's request into a priced offer.
const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ open, onClose, lead, quote, onSaved }) => {
  const [form, setForm] = useState<QuoteInput>({
    customerName: '', customerWhatsapp: '', lineItems: [BLANK_ITEM],
    inclusions: [], exclusions: [], validUntil: defaultValidity(),
  });
  const [inclusionDraft, setInclusionDraft] = useState('');
  const [exclusionDraft, setExclusionDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Prefilled from the customer's own request: retyping what they already told
  // you is the fastest way to get it wrong.
  useEffect(() => {
    if (!open) return;
    setErrors({});

    if (quote) {
      setForm({
        customerName: quote.customerName,
        customerWhatsapp: quote.customerWhatsapp,
        customerEmail: quote.customerEmail,
        destination: quote.destination,
        travellers: quote.travellers,
        travelStartDate: toDateInput(quote.travelStartDate),
        travelEndDate: toDateInput(quote.travelEndDate),
        lineItems: quote.lineItems.length ? quote.lineItems : [BLANK_ITEM],
        inclusions: quote.inclusions || [],
        exclusions: quote.exclusions || [],
        notes: quote.notes,
        termsAndConditions: quote.termsAndConditions,
        validUntil: toDateInput(quote.validUntil),
      });
      return;
    }

    setForm({
      leadId: lead?._id,
      customerName: lead?.customerName || '',
      customerWhatsapp: lead?.customerPhone || '',
      customerEmail: lead?.customerEmail,
      destination: lead?.package?.title || lead?.category?.name || '',
      travellers: lead?.travellers,
      travelStartDate: toDateInput(lead?.preferredDate),
      lineItems: [BLANK_ITEM],
      inclusions: [],
      exclusions: [],
      validUntil: defaultValidity(),
    });
  }, [open, lead, quote]);

  // Mirrors exactly what the API will sum, so the agent never sees one total
  // and the customer another.
  const total = useMemo(
    () => form.lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [form.lineItems]
  );

  if (!open) return null;

  const setItem = (index: number, patch: Partial<QuoteLineItem>) => {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const addItem = (description = '') =>
    setForm((current) => ({ ...current, lineItems: [...current.lineItems, { ...BLANK_ITEM, description }] }));

  const removeItem = (index: number) =>
    setForm((current) => ({
      ...current,
      // Never leave zero rows: an empty table reads as broken rather than empty.
      lineItems: current.lineItems.length === 1
        ? [BLANK_ITEM]
        : current.lineItems.filter((_, i) => i !== index),
    }));

  const addToList = (field: 'inclusions' | 'exclusions', value: string, reset: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setForm((current) => ({ ...current, [field]: [...current[field], trimmed] }));
    reset();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    try {
      setIsSaving(true);
      const payload: QuoteInput = {
        ...form,
        travellers: form.travellers ? Number(form.travellers) : undefined,
        lineItems: form.lineItems
          .filter((item) => item.description.trim() || Number(item.amount) > 0)
          .map((item) => ({ ...item, amount: Number(item.amount) || 0 })),
      };

      const response = quote
        ? await quoteService.update(quote._id, payload)
        : await quoteService.create(payload);

      showToast.success(response.message);
      onSaved(response.data);
      onClose();
    } catch (error) {
      const payload = (error as {
        response?: { data?: { errors?: Record<string, string>; message?: string } };
      })?.response?.data;

      if (payload?.errors) {
        setErrors(payload.errors);
        showToast.error('Please check the highlighted fields');
      } else {
        showToast.error(payload?.message || 'We could not save this quotation.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={quote ? `Edit quotation ${quote.reference}` : 'Create quotation'}
      subtitle="Saved as a draft — nothing reaches the customer until you send it."
      size="lg"
      busy={isSaving}
      onSubmit={handleSubmit}
      footer={(
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className="bma-search-submit px-4" disabled={isSaving}>
            {isSaving ? 'Saving…' : quote ? 'Save changes' : 'Save draft'}
          </button>
        </>
      )}
    >
            {/* Customer */}
            <h3 className="bma-section-heading h6">Customer</h3>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label" htmlFor="q-name">Name <span className="text-danger">*</span></label>
                <input
                  id="q-name"
                  className={`form-control${errors.customerName ? ' is-invalid' : ''}`}
                  value={form.customerName}
                  onChange={(event) => setForm({ ...form, customerName: event.target.value })}
                />
                {errors.customerName && <div className="invalid-feedback d-block">{errors.customerName}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="q-wa">
                  WhatsApp number <span className="text-danger">*</span>
                </label>
                <input
                  id="q-wa"
                  className={`form-control${errors.customerWhatsapp ? ' is-invalid' : ''}`}
                  placeholder="03001234567"
                  value={form.customerWhatsapp}
                  onChange={(event) => setForm({ ...form, customerWhatsapp: event.target.value })}
                />
                {errors.customerWhatsapp
                  ? <div className="invalid-feedback d-block">{errors.customerWhatsapp}</div>
                  : <small className="text-muted">The quotation link is sent here.</small>}
              </div>
            </div>

            {/* Trip */}
            <h3 className="bma-section-heading h6">Trip</h3>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label" htmlFor="q-dest">Destination / package</label>
                <input
                  id="q-dest"
                  className="form-control"
                  value={form.destination || ''}
                  onChange={(event) => setForm({ ...form, destination: event.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label" htmlFor="q-trav">Travellers</label>
                <input
                  id="q-trav"
                  type="number"
                  min={1}
                  className="form-control"
                  value={form.travellers ?? ''}
                  onChange={(event) => setForm({ ...form, travellers: Number(event.target.value) || undefined })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label" htmlFor="q-start">Departure</label>
                <input
                  id="q-start"
                  type="date"
                  className="form-control"
                  value={form.travelStartDate || ''}
                  onChange={(event) => setForm({ ...form, travelStartDate: event.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label" htmlFor="q-end">Return</label>
                <input
                  id="q-end"
                  type="date"
                  className={`form-control${errors.travelEndDate ? ' is-invalid' : ''}`}
                  value={form.travelEndDate || ''}
                  onChange={(event) => setForm({ ...form, travelEndDate: event.target.value })}
                />
                {errors.travelEndDate && <div className="invalid-feedback d-block">{errors.travelEndDate}</div>}
              </div>
            </div>

            {/* Line items */}
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="bma-section-heading h6 mb-0">Services &amp; prices</h3>
              <span className="small text-muted">Total updates as you type</span>
            </div>

            {errors.lineItems && <div className="text-danger small mb-2">{errors.lineItems}</div>}

            <div className="bma-quote-items mt-2 mb-2">
              {form.lineItems.map((item, index) => (
                <div className="bma-quote-item" key={index}>
                  <div className="bma-quote-item-main">
                    <input
                      className={`form-control${errors[`lineItems.${index}.description`] ? ' is-invalid' : ''}`}
                      placeholder="Service, e.g. Hotel"
                      value={item.description}
                      onChange={(event) => setItem(index, { description: event.target.value })}
                    />
                    <input
                      className="form-control form-control-sm mt-1"
                      placeholder="Detail, e.g. 3 nights twin sharing (optional)"
                      value={item.detail || ''}
                      onChange={(event) => setItem(index, { detail: event.target.value })}
                    />
                  </div>
                  <input
                    type="number"
                    min={0}
                    className={`form-control bma-quote-amount${errors[`lineItems.${index}.amount`] ? ' is-invalid' : ''}`}
                    placeholder="0"
                    value={item.amount || ''}
                    onChange={(event) => setItem(index, { amount: Number(event.target.value) || 0 })}
                  />
                  <button
                    type="button"
                    className="bma-quote-remove"
                    onClick={() => removeItem(index)}
                    aria-label="Remove item"
                  >
                    <i className="fas fa-times" aria-hidden="true"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addItem()}>
                <i className="fas fa-plus me-1"></i>Add item
              </button>
              {SUGGESTED.filter((name) => !form.lineItems.some((item) => item.description === name))
                .map((name) => (
                  <button key={name} type="button" className="bma-chip" style={{ cursor: 'pointer' }} onClick={() => addItem(name)}>
                    + {name}
                  </button>
                ))}
            </div>

            <div className="bma-quote-total mb-4">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>

            {/* Inclusions / exclusions */}
            <div className="row g-3 mb-4">
              {([
                ['What is included', 'inclusions', inclusionDraft, setInclusionDraft] as const,
                ['What is not included', 'exclusions', exclusionDraft, setExclusionDraft] as const,
              ]).map(([label, field, draft, setDraft]) => (
                <div className="col-md-6" key={field}>
                  <label className="form-label">{label}</label>
                  <div className="input-group">
                    <input
                      className="form-control"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;
                        event.preventDefault();
                        addToList(field, draft, () => setDraft(''));
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => addToList(field, draft, () => setDraft(''))}
                    >
                      Add
                    </button>
                  </div>
                  {form[field].length > 0 && (
                    <ul className="list-unstyled mt-2 mb-0 small">
                      {form[field].map((entry, index) => (
                        <li key={`${entry}-${index}`} className="d-flex justify-content-between align-items-center py-1">
                          <span>{entry}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-0"
                            onClick={() => setForm((current) => ({
                              ...current,
                              [field]: current[field].filter((_, i) => i !== index),
                            }))}
                            aria-label={`Remove ${entry}`}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Terms */}
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" htmlFor="q-valid">
                  Valid until <span className="text-danger">*</span>
                </label>
                <input
                  id="q-valid"
                  type="date"
                  className={`form-control${errors.validUntil ? ' is-invalid' : ''}`}
                  value={form.validUntil}
                  onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
                />
                {errors.validUntil && <div className="invalid-feedback d-block">{errors.validUntil}</div>}
              </div>
              <div className="col-md-8">
                <label className="form-label" htmlFor="q-notes">Notes for the customer</label>
                <textarea
                  id="q-notes"
                  rows={2}
                  className="form-control"
                  value={form.notes || ''}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="q-terms">Terms and conditions</label>
                <textarea
                  id="q-terms"
                  rows={3}
                  className="form-control"
                  placeholder="Payment terms, cancellation policy…"
                  value={form.termsAndConditions || ''}
                  onChange={(event) => setForm({ ...form, termsAndConditions: event.target.value })}
                />
              </div>
            </div>
    </Modal>
  );
};

export default QuoteBuilder;
