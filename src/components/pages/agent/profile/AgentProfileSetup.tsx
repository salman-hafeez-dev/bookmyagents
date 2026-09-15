import React, { useCallback, useEffect, useState } from 'react';
import ProfileProgress from './ProfileProgress';
import ProfileStatusBanner from './ProfileStatusBanner';
import StepBasicInfo from './StepBasicInfo';
import StepBusinessDetails from './StepBusinessDetails';
import StepCategories from './StepCategories';
import StepDocuments from './StepDocuments';
import StepReviewSubmit from './StepReviewSubmit';
import { agentProfileService, extractApiError } from '../../../../services/agentProfileService';
import { type AgentProfile, type ProfileProgress as Progress, type ProfileStep } from '../../../../types/agentProfile';

const STEPS: { label: string; shortLabel: string; completionKey?: ProfileStep }[] = [
  { label: 'Basic information', shortLabel: 'Basic', completionKey: 'basicInfo' },
  { label: 'Business details', shortLabel: 'Business', completionKey: 'businessDetails' },
  { label: 'Service categories', shortLabel: 'Categories', completionKey: 'categorySelected' },
  { label: 'Documents', shortLabel: 'Documents', completionKey: 'documentsUploaded' },
  { label: 'Review & submit', shortLabel: 'Review' },
];

const AgentProfileSetup: React.FC = () => {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const response = await agentProfileService.getStatus();
      setProfile(response.data);
      setLoadError('');
      return response.data;
    } catch (error) {
      setLoadError(extractApiError(error).message);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialise = async () => {
      const loaded = await loadProfile();
      if (cancelled || !loaded) {
        if (!cancelled) setLoading(false);
        return;
      }
      // Drop the agent on the first step they haven't finished, so returning
      // to a half-filled profile resumes where they left off.
      const firstIncomplete = STEPS.findIndex(
        (step) => step.completionKey && !loaded.profileCompletion[step.completionKey]
      );
      setActiveStep(firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete);
      setLoading(false);
    };

    initialise();
    return () => { cancelled = true; };
  }, [loadProfile]);

  // Step 1 and 2 return the refreshed progress directly, so the header updates
  // without a second round trip.
  const applyProgress = (progress: Progress) => {
    setProfile((previous) => (previous ? { ...previous, ...progress } : previous));
  };

  const refresh = useCallback(async () => { await loadProfile(); }, [loadProfile]);

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading your profile…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-card">
        <div className="card-body">
          <div className="alert alert-danger mb-3" role="alert">
            {loadError || 'We could not load your agent profile.'}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => { setLoading(true); refresh().finally(() => setLoading(false)); }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // While an admin is reviewing, the profile is read-only server-side. Reflect
  // that in the UI rather than letting saves fail with a 409.
  const locked = profile.status === 'pending';

  const goTo = (index: number) => setActiveStep(Math.min(Math.max(index, 0), STEPS.length - 1));

  return (
    <>
      <ProfileStatusBanner profile={profile} />
      <ProfileProgress
        percentage={profile.profileCompletionPercentage}
        completion={profile.profileCompletion}
      />

      <ul className="nav nav-pills flex-wrap gap-2 mb-30" role="tablist">
        {STEPS.map((step, index) => {
          const done = step.completionKey ? profile.profileCompletion[step.completionKey] : false;
          return (
            <li className="nav-item" key={step.label} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={activeStep === index}
                className={`nav-link ${activeStep === index ? 'active' : ''}`}
                onClick={() => goTo(index)}
              >
                {done && <i className="fas fa-check me-2" aria-hidden="true" />}
                <span className="d-none d-md-inline">{index + 1}. {step.label}</span>
                <span className="d-md-none">{step.shortLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {activeStep === 0 && (
        <StepBasicInfo
          profile={profile} locked={locked}
          onSaved={applyProgress} onNext={() => goTo(1)}
        />
      )}
      {activeStep === 1 && (
        <StepBusinessDetails
          profile={profile} locked={locked}
          onSaved={applyProgress} onBack={() => goTo(0)} onNext={() => goTo(2)}
        />
      )}
      {activeStep === 2 && (
        <StepCategories
          profile={profile} locked={locked}
          onSaved={refresh} onBack={() => goTo(1)} onNext={() => goTo(3)}
        />
      )}
      {activeStep === 3 && (
        <StepDocuments
          profile={profile} locked={locked}
          onRefresh={refresh} onBack={() => goTo(2)} onNext={() => goTo(4)}
        />
      )}
      {activeStep === 4 && (
        <StepReviewSubmit
          profile={profile}
          onRefresh={refresh} onBack={() => goTo(3)} onGoToStep={goTo}
        />
      )}
    </>
  );
};

export default AgentProfileSetup;
