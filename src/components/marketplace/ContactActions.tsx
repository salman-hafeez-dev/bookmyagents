import React from 'react';
import { toWhatsAppNumber } from '../../utils/format';

interface ContactActionsProps {
  whatsapp?: string;
  phone?: string;
  // Pre-filled so the agent knows which package the enquiry is about.
  message?: string;
  className?: string;
  size?: 'default' | 'compact';
}

// WhatsApp and Call, the two actions that work the moment a customer sees
// them. Request-a-quote is deliberately absent until there is somewhere to
// record it — a button that does nothing costs more trust than it earns.
const ContactActions: React.FC<ContactActionsProps> = ({
  whatsapp,
  phone,
  message,
  className = '',
  size = 'default',
}) => {
  const waNumber = toWhatsAppNumber(whatsapp);
  const waHref = waNumber
    ? `https://wa.me/${waNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`
    : null;

  const compact = size === 'compact';

  return (
    <div className={`d-flex gap-2 ${className}`}>
      {waHref ? (
        <a
          className="bma-action bma-action--whatsapp"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
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
        <a className="bma-action bma-action--call" href={`tel:${phone.replace(/\s/g, '')}`}>
          <i className="fas fa-phone" aria-hidden="true"></i>
          {compact ? 'Call' : 'Call now'}
        </a>
      )}
    </div>
  );
};

export default ContactActions;
