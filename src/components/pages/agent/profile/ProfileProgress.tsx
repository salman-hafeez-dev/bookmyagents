import React from 'react';
import { type ProfileCompletion, type ProfileStep } from '../../../../types/agentProfile';

interface ProfileProgressProps {
  percentage: number;
  completion: ProfileCompletion;
}

// Mirrors the server-side weighting in lib/agentProfile.ts. Kept here only for
// display — the percentage itself always comes from the API.
const STEPS: { key: ProfileStep; label: string; weight: number }[] = [
  { key: 'basicInfo', label: 'Basic information', weight: 25 },
  { key: 'businessDetails', label: 'Business details', weight: 25 },
  { key: 'categorySelected', label: 'Service categories', weight: 20 },
  { key: 'documentsUploaded', label: 'Documents', weight: 15 },
  { key: 'adminApproved', label: 'Admin approval', weight: 15 },
];

const ProfileProgress: React.FC<ProfileProgressProps> = ({ percentage, completion }) => (
  <div className="dashboard-card mb-30">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Profile completion</h5>
        <span className="fw-bold fs-5">{percentage}%</span>
      </div>

      <div
        className="progress mb-20"
        style={{ height: 10 }}
        role="progressbar"
        aria-label="Profile completion"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-bar ${percentage === 100 ? 'bg-success' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <ul className="list-unstyled mb-0 d-flex flex-wrap gap-3">
        {STEPS.map((step) => (
          <li key={step.key} className="d-flex align-items-center gap-2">
            <i
              className={completion?.[step.key] ? 'fas fa-check-circle text-success' : 'far fa-circle text-muted'}
              aria-hidden="true"
            />
            <span className={completion?.[step.key] ? '' : 'text-muted'}>
              {step.label} <small className="text-muted">({step.weight}%)</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default ProfileProgress;
