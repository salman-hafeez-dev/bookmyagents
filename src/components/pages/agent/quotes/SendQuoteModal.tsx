import React, { useState } from 'react';
import { type SendQuoteResponse } from '../../../../types/quote';
import { showToast } from '../../../../utils/toast';

interface SendQuoteModalProps {
  result: SendQuoteResponse['data'] | null;
  onClose: () => void;
}

// Shown after a quotation is issued.
//
// The platform never messages the customer. It produces the link and a
// ready-made WhatsApp message, and the agent sends it from their own number —
// which is how these deals are actually done here, and needs no WhatsApp
// Business API, no approved templates and no per-message cost.
const SendQuoteModal: React.FC<SendQuoteModalProps> = ({ result, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.shareLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is blocked in some browsers and over plain http, so
      // the link stays visible and selectable as the fallback.
      showToast.error('Could not copy — select the link and copy it manually');
    }
  };

  return (
    <div
      className="bma-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="bma-modal" role="dialog" aria-modal="true" aria-labelledby="send-quote-title">
        <div className="bma-modal-head">
          <div>
            <h2 className="h5 mb-1" id="send-quote-title">Quotation ready to send</h2>
            <p className="small text-muted mb-0">{result.reference} · {result.customerName}</p>
          </div>
          <button type="button" className="bma-modal-close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <div className="bma-modal-body">
          <a
            className="bma-action bma-action--whatsapp w-100 mb-3"
            href={result.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-whatsapp" aria-hidden="true"></i>
            Send on WhatsApp to {result.customerWhatsapp}
          </a>

          <label className="form-label">Quotation link</label>
          <div className="input-group mb-2">
            <input className="form-control" readOnly value={result.shareLink} onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-outline-secondary" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <p className="small text-muted mb-3">
            The customer can open this without an account. It shows the full quotation and lets
            them accept, decline or ask for changes.
          </p>

          <div className="bma-quote-preview">
            <span className="small text-muted d-block mb-1">Message</span>
            {result.whatsappMessage}
          </div>
        </div>

        <div className="bma-modal-foot">
          <button type="button" className="bma-search-submit px-4" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default SendQuoteModal;
