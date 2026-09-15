import React from 'react';
import { type AgentProfile } from '../../../../types/agentProfile';

interface ProfileStatusBannerProps {
  profile: AgentProfile;
}

const ProfileStatusBanner: React.FC<ProfileStatusBannerProps> = ({ profile }) => {
  const { status, rejectionReason, rejectionReasonDetails, adminNotes, submittedForReviewAt, approvedAt } = profile;

  if (status === 'pending') {
    return (
      <div className="alert alert-warning" role="status">
        <h6 className="alert-heading mb-1">
          <i className="fas fa-clock me-2" aria-hidden="true" />
          Awaiting admin review
        </h6>
        <p className="mb-0">
          Submitted {submittedForReviewAt ? new Date(submittedForReviewAt).toLocaleDateString() : 'recently'}.
          Your profile is locked while an admin reviews it — you&apos;ll be able to edit again once there&apos;s a decision.
        </p>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="alert alert-success" role="status">
        <h6 className="alert-heading mb-1">
          <i className="fas fa-check-circle me-2" aria-hidden="true" />
          Profile approved
        </h6>
        <p className="mb-0">
          Approved {approvedAt ? new Date(approvedAt).toLocaleDateString() : ''} — your profile is now publicly visible.
        </p>
        {adminNotes && <hr />}
        {adminNotes && <p className="mb-0"><strong>Note from the admin:</strong> {adminNotes}</p>}
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="alert alert-danger" role="alert">
        <h6 className="alert-heading mb-1">
          <i className="fas fa-exclamation-triangle me-2" aria-hidden="true" />
          Changes requested
        </h6>
        {rejectionReason && <p className="mb-1"><strong>Reason:</strong> {rejectionReason}</p>}
        {rejectionReasonDetails && <p className="mb-1">{rejectionReasonDetails}</p>}
        {adminNotes && <p className="mb-1"><strong>Note from the admin:</strong> {adminNotes}</p>}
        <p className="mb-0">Update the details below and submit again for review.</p>
      </div>
    );
  }

  return null;
};

export default ProfileStatusBanner;
