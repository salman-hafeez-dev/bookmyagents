import React, { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import { leadService } from '../../services/leadService';
import { type QuoteRequestInput } from '../../types/lead';
import { useCurrency } from '../../hooks/useCurrency';

interface RequestQuoteModalProps {
  open: boolean;
  onClose: () => void;
  agentId?: string;
  packageId?: string;
  agentName?: string;
  packageTitle?: string;
}

type FieldErrors = Partial<Record<keyof QuoteRequestInput, string>>;

const EMPTY: QuoteRequestInput = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  message: '',
};

// The form that turns an anonymous visitor into a lead the agent can act on.
//
// Kept deliberately short: name and phone are the only required fields,
// because every extra required box costs enquiries, and an agent would rather
// have a name and a number than nothing at all.
const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({
  open,
  onClose,
  agentId,
  packageId,
  agentName,
  packageTitle,
}) => {
  const currency = useCurrency();
  const [values, setValues] = useState<QuoteRequestInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Reset on open so a second enquiry doesn't start from the previous one's
  // success screen.
  useEffect(() => {
    if (!open) return;
    setValues(EMPTY);
    setErrors({});
    setIsDone(false);
    setFormError(null);
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  const set = (key: keyof QuoteRequestInput, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    try {
      setIsSubmitting(true);
      await leadService.submitQuoteRequest(
        { agentId, packageId },
        {
          ...values,
          travellers: values.travellers ? Number(values.travellers) : undefined,
          durationDays: values.durationDays ? Number(values.durationDays) : undefined,
          budget: values.budget ? Number(values.budget) : undefined,
        }
      );
      setIsDone(true);
    } catch (error) {
      // The API returns a per-field errors map, so each message lands beside
      // the input that caused it rather than as one opaque banner.
      const payload = (error as {
        response?: { data?: { errors?: FieldErrors; message?: string } };
      })?.response?.data;

      if (payload?.errors) {
        setErrors(payload.errors);
      } else {
        setFormError(payload?.message || 'We could not send your request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const subject = packageTitle || agentName;

  return (
    <Modal
      onClose={onClose}
      title={isDone ? 'Request sent' : 'Request a quote'}
      subtitle={!isDone && subject ? `For ${subject}` : undefined}
      size="md"
      busy={isSubmitting}
      onSubmit={isDone ? undefined : handleSubmit}
      footer={isDone ? (
        <button type="button" className="bma-search-submit px-4" onClick={onClose}>Done</button>
      ) : (
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="bma-search-submit px-4" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send request'}
          </button>
        </>
      )}
    >
        {isDone ? (
          <div className="text-center py-2">
            <div className="bma-success-mark mb-3">
              <i className="fas fa-check" aria-hidden="true"></i>
            </div>
            <h3 className="h6 mb-2">Your request is with the agent</h3>
            <p className="text-muted small mb-4">
              {agentName ? `${agentName} will` : 'The agent will'} contact you on the number you
              provided. Most agents reply within a day.
            </p>
          </div>
        ) : (
          <>
              {formError && (
                <div className="alert alert-danger py-2 small" role="alert">{formError}</div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="quote-name">
                    Your name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="quote-name"
                    ref={firstFieldRef}
                    type="text"
                    className={`form-control${errors.customerName ? ' is-invalid' : ''}`}
                    value={values.customerName}
                    onChange={(event) => set('customerName', event.target.value)}
                  />
                  {errors.customerName && (
                    <div className="invalid-feedback d-block">{errors.customerName}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="quote-phone">
                    WhatsApp number <span className="text-danger">*</span>
                  </label>
                  <input
                    id="quote-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="03001234567"
                    className={`form-control${errors.customerPhone ? ' is-invalid' : ''}`}
                    value={values.customerPhone}
                    onChange={(event) => set('customerPhone', event.target.value)}
                  />
                  {errors.customerPhone && (
                    <div className="invalid-feedback d-block">{errors.customerPhone}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="quote-email">Email <span className="text-muted small">(optional)</span></label>
                  <input
                    id="quote-email"
                    type="email"
                    className={`form-control${errors.customerEmail ? ' is-invalid' : ''}`}
                    value={values.customerEmail}
                    onChange={(event) => set('customerEmail', event.target.value)}
                  />
                  {errors.customerEmail && (
                    <div className="invalid-feedback d-block">{errors.customerEmail}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="quote-travellers">Travellers</label>
                  <input
                    id="quote-travellers"
                    type="number"
                    min={1}
                    className={`form-control${errors.travellers ? ' is-invalid' : ''}`}
                    value={values.travellers ?? ''}
                    onChange={(event) => set('travellers', event.target.value)}
                  />
                  {errors.travellers && (
                    <div className="invalid-feedback d-block">{errors.travellers}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="quote-date">Preferred date</label>
                  <input
                    id="quote-date"
                    type="date"
                    className="form-control"
                    value={values.preferredDate ?? ''}
                    onChange={(event) => set('preferredDate', event.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="quote-budget">Budget ({currency.code})</label>
                  <input
                    id="quote-budget"
                    type="number"
                    min={0}
                    className={`form-control${errors.budget ? ' is-invalid' : ''}`}
                    value={values.budget ?? ''}
                    onChange={(event) => set('budget', event.target.value)}
                  />
                  {errors.budget && <div className="invalid-feedback d-block">{errors.budget}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="quote-message">Anything else?</label>
                  <textarea
                    id="quote-message"
                    rows={3}
                    className="form-control"
                    placeholder="Hotel preference, departure city, special requirements, or ask for a call instead…"
                    value={values.message}
                    onChange={(event) => set('message', event.target.value)}
                  />
                </div>
              </div>

              <div className="bma-quote-notice mt-3">
                <i className="fab fa-whatsapp" aria-hidden="true"></i>
                <div>
                  <strong>Your quotation will be sent to you on WhatsApp.</strong>
                  <div className="small">
                    Please give an active WhatsApp number. If you would rather the agent called
                    you instead, say so in the message below. Your name and number are shared
                    with this agent so they can reply.
                  </div>
                </div>
              </div>
          </>
        )}
    </Modal>
  );
};

export default RequestQuoteModal;
