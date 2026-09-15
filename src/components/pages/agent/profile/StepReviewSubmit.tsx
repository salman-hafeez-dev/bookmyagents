import React, { useState } from 'react';
import { agentProfileService, extractApiError } from '../../../../services/agentProfileService';
import { showToast } from '../../../../utils/toast';
import { formatFileSize } from '../../../../utils/formatFileSize';
import { type AgentProfile, type ProfileStep } from '../../../../types/agentProfile';

interface StepReviewSubmitProps {
  profile: AgentProfile;
  onRefresh: () => Promise<void> | void;
  onBack: () => void;
  onGoToStep: (index: number) => void;
}

// Documents are deliberately absent: they are recommended, not required, so a
// profile can be submitted for review without them.
const REQUIRED_STEPS: { key: ProfileStep; label: string; stepIndex: number }[] = [
  { key: 'basicInfo', label: 'Basic information', stepIndex: 0 },
  { key: 'businessDetails', label: 'Business details', stepIndex: 1 },
  { key: 'categorySelected', label: 'Service categories', stepIndex: 2 },
];

const SummaryRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="row py-2 border-bottom">
    <dt className="col-sm-4 text-muted fw-normal">{label}</dt>
    <dd className="col-sm-8 mb-0">{value || <span className="text-muted fst-italic">Not provided</span>}</dd>
  </div>
);

const StepReviewSubmit: React.FC<StepReviewSubmitProps> = ({ profile, onRefresh, onBack, onGoToStep }) => {
  const [submitting, setSubmitting] = useState(false);

  const { basicInfo, businessDetails } = profile;
  const missing = REQUIRED_STEPS.filter((step) => !profile.profileCompletion[step.key]);
  const alreadyDecided = profile.status === 'pending' || profile.status === 'approved';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await agentProfileService.submitForReview();
      await onRefresh();
      showToast.success('Profile submitted — an admin will review it shortly.');
    } catch (error) {
      const parsed = extractApiError(error);
      showToast.error(parsed.message);
      // The server is the authority on what's missing; re-sync so the checklist
      // reflects its answer rather than our stale copy.
      if (parsed.error === 'INCOMPLETE_PROFILE') await onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h4>Step 5 — Review &amp; submit</h4>
      </div>
      <div className="card-body">
        {missing.length > 0 && (
          <div className="alert alert-warning" role="alert">
            <h6 className="alert-heading">Finish these before submitting</h6>
            <ul className="mb-0">
              {missing.map((step) => (
                <li key={step.key}>
                  {step.label} —{' '}
                  <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => onGoToStep(step.stepIndex)}>
                    go to step
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h6 className="fw-semibold mt-3 mb-2">Basic information</h6>
        <dl className="mb-30">
          <SummaryRow label="Company name" value={basicInfo.companyName} />
          <SummaryRow label="Owner" value={basicInfo.ownerName} />
          <SummaryRow label="Phone" value={basicInfo.phone} />
          <SummaryRow label="WhatsApp" value={basicInfo.whatsapp} />
          <SummaryRow label="Email" value={basicInfo.email} />
          <SummaryRow
            label="Website"
            value={basicInfo.website && (
              <a href={basicInfo.website} target="_blank" rel="noopener noreferrer">{basicInfo.website}</a>
            )}
          />
          <SummaryRow
            label="Location"
            value={[basicInfo.businessLocation, basicInfo.city, basicInfo.province].filter(Boolean).join(', ')}
          />
          <SummaryRow label="Office address" value={basicInfo.officeAddress} />
        </dl>

        <h6 className="fw-semibold mb-2">Business details</h6>
        <dl className="mb-30">
          <SummaryRow label="Description" value={businessDetails.companyDescription} />
          <SummaryRow
            label="Experience"
            value={businessDetails.yearsExperience !== undefined && businessDetails.yearsExperience !== ''
              ? `${businessDetails.yearsExperience} year${businessDetails.yearsExperience === 1 ? '' : 's'}`
              : undefined}
          />
          <SummaryRow label="Services offered" value={businessDetails.servicesOffered} />
          <SummaryRow label="Areas served" value={businessDetails.areaServed?.join(', ')} />
        </dl>

        <h6 className="fw-semibold mb-2">Service categories</h6>
        <p className="mb-30">
          {profile.categories.length > 0
            ? profile.categories.map((category) => (
                <span key={category._id} className="badge bg-primary me-2">{category.name}</span>
              ))
            : <span className="text-muted fst-italic">None selected</span>}
        </p>

        <h6 className="fw-semibold mb-2">Documents ({profile.documents.length})</h6>
        {profile.documents.length > 0 ? (
          <ul className="mb-30">
            {profile.documents.map((document) => (
              <li key={document._id}>
                {document.name} <span className="text-muted">({formatFileSize(document.fileSize)})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mb-30">
            No documents uploaded. You can still submit, but verification usually takes longer without them.
          </p>
        )}

        <div className="d-flex justify-content-between gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack}>Back</button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={submitting || missing.length > 0 || alreadyDecided}
          >
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>

        {alreadyDecided && (
          <p className="text-muted text-end mt-2 mb-0">
            <small>
              {profile.status === 'pending'
                ? 'Already submitted — waiting on an admin decision.'
                : 'Your profile is already approved.'}
            </small>
          </p>
        )}
      </div>
    </div>
  );
};

export default StepReviewSubmit;
