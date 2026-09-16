import React, { useState } from 'react';
import Modal from './Modal';
import PaymentStatusBadge from './PaymentStatusBadge';
import { formatAmount, type Payment } from '../../types/payment';

interface PaymentDetailsModalProps {
  payment: Payment;
  agentName?: string;
  agentEmail?: string;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="row py-2 border-bottom">
    <dt className="col-sm-5 text-muted fw-normal">{label}</dt>
    <dd className="col-sm-7 mb-0">{value || <span className="text-muted fst-italic">—</span>}</dd>
  </div>
);

const nameOf = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'object' && 'fullName' in (value as Record<string, unknown>)) {
    return (value as { fullName: string }).fullName;
  }
  return undefined;
};

/**
 * Read-only view of one manual payment, including the proof screenshot.
 *
 * The proof is a private Cloudinary asset — `paymentProofUrl` is a signed URL
 * the API mints only for the owning agent or an admin, so it is rendered here
 * rather than linked out to.
 */
const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  payment, agentName, agentEmail, onClose,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [proofFailed, setProofFailed] = useState(false);

  const resolvedAgent = agentName || nameOf(payment.agent) || nameOf(payment.userId);
  const resolvedEmail = agentEmail
    || (typeof payment.agent === 'object' ? payment.agent?.email : undefined);

  return (
    <>
      <Modal
        onClose={onClose}
        title="Payment details"
        subtitle={payment.transactionNumber}
        size="lg"
        footer={<button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>}
      >
        <dl className="mb-3">
          <Row label="Agent" value={resolvedAgent && (
            <>{resolvedAgent}{resolvedEmail && <span className="text-muted d-block small">{resolvedEmail}</span>}</>
          )} />
          <Row label="Plan" value={payment.planNameSnapshot} />
          <Row label="Amount" value={<strong>{formatAmount(payment.amount, payment.currency)}</strong>} />
          <Row label="Transaction number" value={<code>{payment.transactionNumber}</code>} />
          <Row label="Sender account name" value={payment.senderAccountName} />
          <Row label="Method" value={payment.paymentMethod.replace('_', ' ')} />
          <Row label="Status" value={<PaymentStatusBadge status={payment.status} />} />
          <Row label="Submitted at" value={new Date(payment.submittedAt).toLocaleString()} />
          {payment.verifiedAt && (
            <Row
              label={payment.status === 'rejected' ? 'Reviewed at' : 'Verified at'}
              value={new Date(payment.verifiedAt).toLocaleString()}
            />
          )}
          {nameOf(payment.reviewer) && <Row label="Reviewed by" value={nameOf(payment.reviewer)} />}
          {payment.rejectionReason && (
            <Row label="Rejection reason" value={<span className="text-danger">{payment.rejectionReason}</span>} />
          )}
          {payment.invoice && <Row label="Invoice" value={<code>{payment.invoice.invoiceNumber}</code>} />}
        </dl>

        <h6 className="fw-semibold">Payment proof</h6>
        {!payment.paymentProofUrl ? (
          <p className="text-muted mb-0">No screenshot available.</p>
        ) : proofFailed ? (
          <div className="alert alert-warning mb-0" role="alert">
            The screenshot could not be loaded.
          </div>
        ) : (
          <>
            <button
              type="button"
              className="btn p-0 border-0 bg-transparent"
              onClick={() => setZoomed(true)}
              title="Click to enlarge"
            >
              <img
                src={payment.paymentProofUrl}
                alt="Payment proof"
                onError={() => setProofFailed(true)}
                className="rounded border"
                style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', cursor: 'zoom-in' }}
              />
            </button>
            <small className="text-muted d-block">Click the image to enlarge.</small>
          </>
        )}
      </Modal>

      {zoomed && payment.paymentProofUrl && (
        <Modal
          onClose={() => setZoomed(false)}
          title="Payment proof"
          size="full"
          dark
          flushBody
        >
          <div
            className="d-flex h-100 align-items-center justify-content-center p-3"
            onClick={() => setZoomed(false)}
            style={{ cursor: 'zoom-out' }}
          >
            <img
              src={payment.paymentProofUrl}
              alt="Payment proof, enlarged"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default PaymentDetailsModal;
