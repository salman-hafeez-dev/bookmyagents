import React, { useState } from 'react';
import ConfirmationModal from '../common/ConfirmationModal';
import PasswordStrength from '../common/PasswordStrength';
import { profileService } from '../../services/profileService';
import { showToast } from '../../utils/toast';
import { isPasswordValid } from '../../utils/passwordValidator';
import { extractApiError } from '../../services/agentProfileService';

interface AgentResetPasswordModalProps {
  isOpen: boolean;
  /** Called after a successful change — the caller signs the user out. */
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Self-service password change.
 *
 * The current password is verified server-side before the new one is accepted,
 * and the change invalidates every token the account holds — so the caller must
 * sign the user out on success.
 */
const AgentResetPasswordModal: React.FC<AgentResetPasswordModalProps> = ({
  isOpen, onSuccess, onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = !!currentPassword && isPasswordValid(newPassword)
    && !!confirmPassword && !mismatch && !sameAsCurrent;

  const handleConfirm = async () => {
    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = 'Enter your current password';
    if (!isPasswordValid(newPassword)) nextErrors.newPassword = 'Password does not meet the requirements below';
    if (sameAsCurrent) nextErrors.newPassword = 'New password must be different from your current one';
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setLoading(true);
    setErrors({});
    try {
      await profileService.updatePassword({ currentPassword, newPassword, confirmPassword });
      showToast.success('Password updated. Please sign in again.');
      reset();
      onSuccess();
    } catch (error) {
      const parsed = extractApiError(error);
      const field = (error as { response?: { data?: { field?: string } } })?.response?.data?.field;
      // A wrong current password comes back without a field marker.
      setErrors(field ? { [field]: parsed.message } : { currentPassword: parsed.message });
      showToast.error(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      title="Reset Your Password"
      heading="Update Your Password"
      description="Enter your current password to verify it's you, then choose a new one. You'll be signed out of every device."
      icon="security"
      actionColor="primary"
      size="md"
      actionLabel="Reset Password"
      loading={loading}
      confirmDisabled={!canSubmit}
      onConfirm={handleConfirm}
      onCancel={handleClose}
    >
      <div className="mb-20">
        <label htmlFor="reset-current-password" className="form-label fw-semibold">
          Current password<span className="text-danger ms-1">*</span>
        </label>
        <input
          id="reset-current-password"
          type="password"
          autoComplete="current-password"
          className={`form-control${errors.currentPassword ? ' is-invalid' : ''}`}
          value={currentPassword}
          onChange={(event) => { setCurrentPassword(event.target.value); setErrors({}); }}
          disabled={loading}
        />
        {errors.currentPassword && <div className="invalid-feedback">{errors.currentPassword}</div>}
      </div>

      <div className="mb-20">
        <label htmlFor="reset-new-password" className="form-label fw-semibold">
          New password<span className="text-danger ms-1">*</span>
        </label>
        <input
          id="reset-new-password"
          type="password"
          autoComplete="new-password"
          className={`form-control${errors.newPassword || sameAsCurrent ? ' is-invalid' : ''}`}
          value={newPassword}
          onChange={(event) => { setNewPassword(event.target.value); setErrors({}); }}
          disabled={loading}
        />
        {(errors.newPassword || sameAsCurrent) && (
          <div className="invalid-feedback">
            {errors.newPassword || 'New password must be different from your current one'}
          </div>
        )}
        <PasswordStrength password={newPassword} />
      </div>

      <div className="mb-0">
        <label htmlFor="reset-confirm-password" className="form-label fw-semibold">
          Confirm new password<span className="text-danger ms-1">*</span>
        </label>
        <input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          className={`form-control${errors.confirmPassword || mismatch ? ' is-invalid' : ''}`}
          value={confirmPassword}
          onChange={(event) => { setConfirmPassword(event.target.value); setErrors({}); }}
          disabled={loading}
        />
        {(errors.confirmPassword || mismatch) && (
          <div className="invalid-feedback">{errors.confirmPassword || 'Passwords do not match'}</div>
        )}
      </div>
    </ConfirmationModal>
  );
};

export default AgentResetPasswordModal;
