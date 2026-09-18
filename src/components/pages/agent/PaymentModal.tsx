import React, { useEffect, useRef, useState } from 'react';
import Modal from '../../common/Modal';
import { paymentService } from '../../../services/paymentService';
import { extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { formatFileSize } from '../../../utils/formatFileSize';
import { formatAmount, type PaymentAccount } from '../../../types/payment';
import { type Subscription } from '../../../services/subscriptionService';
import { useConfirm } from '../../../contexts/ConfirmContext';

interface PaymentModalProps {
  plan: Subscription;
  onClose: () => void;
  onSubmitted: () => void;
}

// Mirrors the server-side limits in lib/paymentValidators.ts.
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const AccountRow: React.FC<{ label: string; value?: string; copyable?: boolean }> = ({
  label, value, copyable,
}) => {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is blocked in some browsers/contexts; the value is on screen
      // to copy by hand, so this isn't worth surfacing as an error.
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center gap-2 py-1">
      <span className="text-muted">{label}</span>
      <span className="d-flex align-items-center gap-2 text-end">
        <strong style={{ wordBreak: 'break-all' }}>{value}</strong>
        {copyable && (
          <button
            type="button"
            className="btn btn-sm btn-link p-0"
            onClick={copy}
            aria-label={`Copy ${label}`}
            title={`Copy ${label}`}
          >
            <i className={copied ? 'fas fa-check text-success' : 'far fa-copy'} aria-hidden="true" />
          </button>
        )}
      </span>
    </div>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = ({ plan, onClose, onSubmitted }) => {
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;
    paymentService.getPaymentAccount()
      .then((response) => { if (!cancelled) setAccount(response.data); })
      .catch((error) => { if (!cancelled) showToast.error(extractApiError(error).message); })
      .finally(() => { if (!cancelled) setLoadingAccount(false); });
    return () => { cancelled = true; };
  }, []);

  // Object URLs leak until revoked.
  useEffect(() => {
    if (!proof) { setProofPreview(null); return; }
    const url = URL.createObjectURL(proof);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setErrors((p) => ({ ...p, paymentProof: `That image is ${formatFileSize(file.size)} — the limit is 5 MB.` }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((p) => ({ ...p, paymentProof: 'Screenshot must be a JPG, PNG or WebP image.' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setErrors((p) => ({ ...p, paymentProof: '' }));
    setProof(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return; // guard against a double-click firing two requests

    const ok = await confirm({
      title: 'Submit Payment',
      subtitle: plan.name,
      heading: 'Confirm Your Transfer',
      description: 'Check the transaction number and screenshot are correct — an admin verifies them before your plan is activated.',
      icon: 'info',
      actionColor: 'primary',
      actionLabel: 'Submit Payment',
    });
    if (!ok) return;


    const nextErrors: Record<string, string> = {};
    if (!transactionNumber.trim()) nextErrors.transactionNumber = 'Transaction number is required';
    if (!senderAccountName.trim()) nextErrors.senderAccountName = 'Sender account name is required';
    if (!proof) nextErrors.paymentProof = 'Attach a screenshot of your transfer';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setSubmitting(true);
    setProgress(0);
    setErrors({});
    try {
      await paymentService.submitPlanPayment({
        subscriptionId: plan._id,
        transactionNumber: transactionNumber.trim(),
        senderAccountName: senderAccountName.trim(),
        paymentProof: proof!,
      }, setProgress);
      showToast.success('Payment submitted. An admin will verify it and activate your plan.');
      onSubmitted();
    } catch (error) {
      const parsed = extractApiError(error);
      setErrors(parsed.errors || {});
      showToast.error(parsed.message);
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={`Pay for ${plan.name}`}
      subtitle="Manual bank transfer"
      ariaLabel={`Pay for the ${plan.name} plan`}
      size="md"
      busy={submitting}
      onSubmit={handleSubmit}
      footer={(
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !account}>
            {submitting ? 'Submitting…' : 'Submit payment & request plan'}
          </button>
        </>
      )}
    >
      <div className="d-flex justify-content-between align-items-center p-3 mb-3 rounded bg-light">
        <span>
          <span className="d-block text-muted small">Selected plan</span>
          <strong>{plan.name}</strong>
        </span>
        <span className="text-end">
          <span className="d-block text-muted small">Amount due</span>
          <strong className="fs-5">{formatAmount(plan.price, account?.currency || 'PKR')}</strong>
        </span>
      </div>

      <h6 className="fw-semibold">Transfer to this account</h6>
      {loadingAccount ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading payment details…</span>
          </div>
        </div>
      ) : !account ? (
        <div className="alert alert-warning" role="alert">
          No payment account has been configured yet. Please contact support before transferring
          any money — we can&apos;t tell you where to send it.
        </div>
      ) : (
        <div className="border rounded p-3 mb-3">
          <AccountRow label="Bank" value={account.bankName} />
          <AccountRow label="Account title" value={account.accountTitle} />
          <AccountRow label="Account number" value={account.accountNumber} copyable />
          <AccountRow label="IBAN" value={account.iban} copyable />
          {account.instructions && (
            <p className="text-muted small mb-0 mt-2 pt-2 border-top" style={{ whiteSpace: 'pre-wrap' }}>
              {account.instructions}
            </p>
          )}
        </div>
      )}

      <h6 className="fw-semibold">Confirm your transfer</h6>

      <div className="mb-20">
        <label htmlFor="transactionNumber" className="form-label">
          Transaction number<span className="text-danger ms-1">*</span>
        </label>
        <input
          id="transactionNumber"
          type="text"
          className={`form-control${errors.transactionNumber ? ' is-invalid' : ''}`}
          value={transactionNumber}
          onChange={(e) => setTransactionNumber(e.target.value)}
          placeholder="e.g. TRX123456789"
          disabled={submitting}
        />
        {errors.transactionNumber && <div className="invalid-feedback">{errors.transactionNumber}</div>}
      </div>

      <div className="mb-20">
        <label htmlFor="senderAccountName" className="form-label">
          Sender account name<span className="text-danger ms-1">*</span>
        </label>
        <input
          id="senderAccountName"
          type="text"
          className={`form-control${errors.senderAccountName ? ' is-invalid' : ''}`}
          value={senderAccountName}
          onChange={(e) => setSenderAccountName(e.target.value)}
          placeholder="Name on the account you paid from"
          disabled={submitting}
        />
        {errors.senderAccountName && <div className="invalid-feedback">{errors.senderAccountName}</div>}
      </div>

      <div className="mb-20">
        <label htmlFor="paymentProof" className="form-label">
          Payment screenshot<span className="text-danger ms-1">*</span>
        </label>
        <input
          ref={fileInputRef}
          id="paymentProof"
          type="file"
          className={`form-control${errors.paymentProof ? ' is-invalid' : ''}`}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={submitting}
        />
        {errors.paymentProof
          ? <div className="invalid-feedback">{errors.paymentProof}</div>
          : <small className="text-muted">JPG, PNG or WebP, up to 5 MB. Make sure the transaction reference is legible.</small>}

        {proofPreview && (
          <div className="mt-2">
            <img
              src={proofPreview}
              alt="Payment screenshot preview"
              className="rounded border"
              style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain' }}
            />
            <div>
              <small className="text-muted">{proof?.name} · {formatFileSize(proof?.size || 0)}</small>
            </div>
          </div>
        )}
      </div>

      {submitting && progress > 0 && (
        <div className="mb-2">
          <div className="d-flex justify-content-between"><small>Uploading…</small><small>{progress}%</small></div>
          <div
            className="progress" style={{ height: 6 }} role="progressbar"
            aria-label="Upload progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <p className="text-muted small mb-0">
        Submitting does not activate the plan. An admin verifies your payment first — you stay on your
        current plan until then.
      </p>
    </Modal>
  );
};

export default PaymentModal;
