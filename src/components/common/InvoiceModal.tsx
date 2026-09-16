import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { paymentService } from '../../services/paymentService';

interface InvoiceModalProps {
  /** The payment the invoice belongs to — the PDF endpoint is keyed by payment. */
  paymentId: string;
  /** Used for the window title and download filename; falls back if unknown. */
  invoiceNumber?: string;
  onClose: () => void;
}

// An axios error whose response body is a Blob (because responseType was
// 'blob') hides the JSON message inside it. This digs the real message out so
// "this payment isn't verified" reaches the user instead of a generic failure.
async function readBlobError(error: unknown): Promise<string> {
  const response = (error as { response?: { data?: unknown; status?: number } })?.response;
  const data = response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message as string;
    } catch {
      // Not JSON — fall through to the generic message.
    }
  }
  if (response?.status === 404) return 'Invoice not found.';
  return 'The invoice could not be loaded. Please try again.';
}

/**
 * Views the platform-generated invoice PDF inline.
 *
 * The PDF is fetched once as a blob (the endpoint needs an auth header, which
 * an <iframe src> cannot send) and the resulting object URL serves both the
 * viewer and the download link.
 */
const InvoiceModal: React.FC<InvoiceModalProps> = ({ paymentId, invoiceNumber, onClose }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    paymentService.getInvoicePdfBlob(paymentId)
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch(async (err) => {
        const message = await readBlobError(err);
        if (!cancelled) setError(message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      // Object URLs are held until revoked.
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [paymentId]);

  const fileName = `${invoiceNumber || 'invoice'}.pdf`;

  return (
    <Modal
      onClose={onClose}
      title={`Invoice${invoiceNumber ? ` ${invoiceNumber}` : ''}`}
      size="full"
      flushBody
      footer={(
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
          {blobUrl && (
            <a className="btn btn-primary" href={blobUrl} download={fileName}>
              <i className="fas fa-download me-2" aria-hidden="true" />Download
            </a>
          )}
        </>
      )}
    >
      {loading ? (
        <div className="d-flex h-100 align-items-center justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading invoice…</span>
          </div>
        </div>
      ) : error ? (
        <div className="d-flex h-100 align-items-center justify-content-center text-center px-4">
          <div>
            <i className="fas fa-file-circle-exclamation fa-2x text-muted mb-3 d-block" aria-hidden="true" />
            <p className="mb-0">{error}</p>
          </div>
        </div>
      ) : (
        <iframe
          src={blobUrl || undefined}
          title={invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice'}
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      )}
    </Modal>
  );
};

export default InvoiceModal;
