import React, { useEffect, useState } from 'react';
import { type Lead, type LeadStatus, CONTACTABLE_TYPES } from '../../../../types/lead';
import { leadService } from '../../../../services/leadService';
import { showToast, getErrorMessage } from '../../../../utils/toast';
import { formatMoney, formatDate, toWhatsAppNumber } from '../../../../utils/format';
import { STATUS_META, STATUS_ORDER, TYPE_META, timeAgo } from './leadMeta';

interface LeadDetailProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
}

// A side panel rather than a full page: an agent triaging an inbox wants to
// open one lead, act, and get back to the list without losing their place.
const LeadDetail: React.FC<LeadDetailProps> = ({ lead, onClose, onUpdated }) => {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<LeadStatus | null>(null);

  useEffect(() => {
    setNotes(lead?.agentNotes || '');
  }, [lead]);

  useEffect(() => {
    if (!lead) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lead, onClose]);

  if (!lead) return null;

  const type = TYPE_META[lead.type];
  const isContactable = CONTACTABLE_TYPES.includes(lead.type);
  const waNumber = toWhatsAppNumber(lead.customerPhone);

  const changeStatus = async (status: LeadStatus) => {
    if (status === lead.status) return;
    try {
      setSavingStatus(status);
      const response = await leadService.updateLead(lead._id, { status });
      onUpdated(response.data);
      showToast.success(`Marked as ${STATUS_META[status].label.toLowerCase()}`);
    } catch (error) {
      showToast.error(getErrorMessage(error));
    } finally {
      setSavingStatus(null);
    }
  };

  const saveNotes = async () => {
    try {
      setIsSaving(true);
      const response = await leadService.updateLead(lead._id, { agentNotes: notes });
      onUpdated(response.data);
      showToast.success('Note saved');
    } catch (error) {
      showToast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="bma-drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <aside className="bma-drawer" role="dialog" aria-modal="true" aria-label="Lead details">
        <header className="bma-drawer-head">
          <div>
            <span className={`bma-lead-badge ${STATUS_META[lead.status].className}`}>
              {STATUS_META[lead.status].label}
            </span>
            <h2 className="h5 mt-2 mb-1">
              {lead.customerName || type.label}
            </h2>
            <p className="small text-muted mb-0">
              <i className={`${type.icon} me-2`} aria-hidden="true"></i>
              {type.label} · {timeAgo(lead.createdAt)}
            </p>
          </div>
          <button type="button" className="bma-modal-close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </header>

        <div className="bma-drawer-body">
          {/* Contact — only enquiries carry it, and saying so beats an empty box */}
          {isContactable ? (
            <section className="mb-4">
              <h3 className="bma-section-heading h6">Contact</h3>
              <dl className="bma-facts mb-3">
                {lead.customerPhone && <div><dt>Phone</dt><dd>{lead.customerPhone}</dd></div>}
                {lead.customerEmail && <div><dt>Email</dt><dd>{lead.customerEmail}</dd></div>}
              </dl>
              <div className="d-flex gap-2">
                {waNumber && (
                  <a
                    className="bma-action bma-action--whatsapp"
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-whatsapp" aria-hidden="true"></i>WhatsApp
                  </a>
                )}
                {lead.customerPhone && (
                  <a className="bma-action bma-action--call" href={`tel:${lead.customerPhone}`}>
                    <i className="fas fa-phone" aria-hidden="true"></i>Call
                  </a>
                )}
              </div>
            </section>
          ) : (
            <div className="alert alert-light border small">
              <i className="fas fa-circle-info me-2" aria-hidden="true"></i>
              This customer tapped {type.short.toLowerCase()} from your listing without leaving
              their details — they should be contacting you directly.
            </div>
          )}

          {/* What they asked for */}
          {(lead.travellers || lead.durationDays || lead.budget || lead.preferredDate || lead.package) && (
            <section className="mb-4">
              <h3 className="bma-section-heading h6">Request</h3>
              <dl className="bma-facts mb-0">
                {lead.package && <div><dt>Package</dt><dd>{lead.package.title}</dd></div>}
                {lead.category && <div><dt>Category</dt><dd>{lead.category.name}</dd></div>}
                {lead.travellers && <div><dt>Travellers</dt><dd>{lead.travellers}</dd></div>}
                {lead.durationDays && <div><dt>Duration</dt><dd>{lead.durationDays} days</dd></div>}
                {lead.preferredDate && (
                  <div><dt>Preferred date</dt><dd>{formatDate(lead.preferredDate)}</dd></div>
                )}
                {lead.budget && <div><dt>Budget</dt><dd>{formatMoney(lead.budget)}</dd></div>}
              </dl>
            </section>
          )}

          {lead.message && (
            <section className="mb-4">
              <h3 className="bma-section-heading h6">Message</h3>
              <p className="bma-quote mb-0">{lead.message}</p>
            </section>
          )}

          {/* Pipeline */}
          <section className="mb-4">
            <h3 className="bma-section-heading h6">Status</h3>
            <div className="d-flex flex-wrap gap-2">
              {STATUS_ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`bma-status-pick${lead.status === status ? ' is-active' : ''}`}
                  disabled={savingStatus !== null}
                  onClick={() => changeStatus(status)}
                >
                  {savingStatus === status
                    ? <span className="spinner-border spinner-border-sm" />
                    : STATUS_META[status].label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="bma-section-heading h6">Your notes</h3>
            <textarea
              className="form-control mb-2"
              rows={3}
              placeholder="What was agreed, what to follow up on…"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={saveNotes}
              disabled={isSaving || notes === (lead.agentNotes || '')}
            >
              {isSaving ? 'Saving…' : 'Save note'}
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
};

export default LeadDetail;
