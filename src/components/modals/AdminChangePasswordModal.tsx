import React, { useState } from 'react';
import ConfirmationModal from '../common/ConfirmationModal';
import PasswordStrength from '../common/PasswordStrength';
import { userService } from '../../services/userService';
import { showToast } from '../../utils/toast';
import { isPasswordValid } from '../../utils/passwordValidator';
import { extractApiError } from '../../services/agentProfileService';

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  agent: { _id: string; fullName: string; email?: string } | null;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Admin-initiated password reset for another account.
 *
 * No current password is asked for — that is the point of an admin reset. The
 * API refuses to act on the admin's own account, so changing your own password
 * always goes through the self-service flow where the current one is verified.
 */
const AdminChangePasswordModal: React.FC<AdminChangePasswordModalProps> = ({
  isOpen, agent, onSuccess, onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = isPasswordValid(newPassword) && !!confirmPassword && !mismatch;

  const handleConfirm = async () => {
    if (!agent) return;

    const nextErrors: Record<string, string> = {};
    if (!isPasswordValid(newPassword)) nextErrors.newPassword = 'Password does not meet the requirements below';
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setLoading(true);
    setErrors({});
    try {
      await userService.changePassword(agent._id, { newPassword, confirmPassword });
      showToast.success(`Password changed. ${agent.fullName} has been signed out everywhere.`);
      reset();
      onSuccess();
    } catch (error) {
      const parsed = extractApiError(error);
      // The API tells us which field failed where it can.
      const field = (error as { response?: { data?: { field?: string } } })?.response?.data?.field;
      setErrors(field ? { [field]: parsed.message } : {});
      showToast.error(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      title="Change Agent Password"
      subtitle={agent.fullName}
      heading="Set New Password"
      description="You are setting a new password for this agent. Share it with them securely — they will be signed out of every device."
      icon="password"
      actionColor="primary"
      size="md"
      actionLabel="Change Password"
      loading={loading}
      confirmDisabled={!canSubmit}
      onConfirm={handleConfirm}
      onCancel={handleClose}
    >
      <div className="mb-20">
        <label htmlFor="admin-new-password" className="form-label fw-semibold">
          New password<span className="text-danger ms-1">*</span>
        </label>
        <input
          id="admin-new-password"
          type="password"
          autoComplete="new-password"
          className={`form-control${errors.newPassword ? ' is-invalid' : ''}`}
          value={newPassword}
          onChange={(event) => { setNewPassword(event.target.value); setErrors({}); }}
          disabled={loading}
        />
        {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
        <PasswordStrength password={newPassword} />
      </div>

      <div className="mb-0">
        <label htmlFor="admin-confirm-password" className="form-label fw-semibold">
          Confirm password<span className="text-danger ms-1">*</span>
        </label>
        <input
          id="admin-confirm-password"
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

export default AdminChangePasswordModal;
