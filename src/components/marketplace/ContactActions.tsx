import React from 'react';
import { toWhatsAppNumber } from '../../utils/format';
import { leadService } from '../../services/leadService';

interface ContactActionsProps {
  whatsapp?: string;
  phone?: string;
  // Pre-filled so the agent knows which package the enquiry is about.
  message?: string;
  // Which agent or package the action belongs to, so it can be recorded.
  agentId?: string;
  packageId?: string;
  onRequestQuote?: () => void;
  className?: string;
  size?: 'default' | 'compact';
}

// WhatsApp, Call, and Request a quote.
//
// Every action records a lead before it hands the customer over, but never
// waits on it and never blocks on failure: the tap has to reach WhatsApp
// whether or not our own request succeeded.
const ContactActions: React.FC<ContactActionsProps> = ({
  whatsapp,
  phone,
  message,
  agentId,
  packageId,
  onRequestQuote,
  className = '',
  size = 'default',
}) => {
  const waNumber = toWhatsAppNumber(whatsapp);
  const waHref = waNumber
    ? `https://wa.me/${waNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`
    : null;

  const compact = size === 'compact';
  const target = { agentId, packageId };

  return (
    <div className={`d-flex gap-2 ${className}`}>
      {waHref ? (
        <a
          className="bma-action bma-action--whatsapp"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { void leadService.record('whatsapp_click', target); }}
        >
          <i className="fab fa-whatsapp" aria-hidden="true"></i>
          {compact ? 'WhatsApp' : 'Message on WhatsApp'}
        </a>
      ) : (
        <span className="bma-action is-disabled" aria-disabled="true">
          <i className="fab fa-whatsapp" aria-hidden="true"></i>
          WhatsApp unavailable
        </span>
      )}

      {phone && (
        <a
          className="bma-action bma-action--call"
          href={`tel:${phone.replace(/\s/g, '')}`}
          onClick={() => { void leadService.record('phone_click', target); }}
        >
          <i className="fas fa-phone" aria-hidden="true"></i>
          {compact ? 'Call' : 'Call now'}
        </a>
      )}

      {onRequestQuote && (
        <button type="button" className="bma-action bma-action--quote" onClick={onRequestQuote}>
          <i className="fas fa-file-invoice" aria-hidden="true"></i>
          {compact ? 'Quote' : 'Request a quote'}
        </button>
      )}
    </div>
  );
};

export default ContactActions;
