import React from 'react';
import { Link } from 'react-router-dom';

// Loading, not-found and error states shared by the two detail pages, so a
// customer meets the same shapes and the same tone whichever page they open.

const Line: React.FC<{ w: string; h?: number; className?: string }> = ({ w, h = 14, className = '' }) => (
  <div className={`bma-skeleton mb-2 ${className}`} style={{ width: w, height: h }} />
);

// Mirrors the real layout rather than showing a spinner, so the page does not
// visibly jump when the content arrives.
export const DetailSkeleton: React.FC<{ variant?: 'package' | 'agent' }> = ({ variant = 'package' }) => (
  <div className="container py-4" aria-busy="true" aria-live="polite">
    <span className="visually-hidden">Loading…</span>

    {variant === 'agent' ? (
      <div className="bma-card overflow-hidden mb-4">
        <div className="bma-skeleton" style={{ height: 240, borderRadius: 0 }} />
        <div className="bma-agent-head">
          <div className="bma-skeleton bma-agent-logo" />
          <Line w="240px" h={24} className="mt-3" />
          <Line w="180px" />
          <Line w="320px" />
        </div>
      </div>
    ) : (
      <>
        <div className="bma-skeleton mb-3" style={{ height: 420, borderRadius: 14 }} />
        <div className="d-flex gap-2 mb-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="bma-skeleton" style={{ width: 92, height: 68 }} />
          ))}
        </div>
      </>
    )}

    <div className="row g-4">
      <div className="col-lg-8">
        <div className="bma-card bma-card-pad">
          <Line w="60%" h={26} />
          <Line w="40%" />
          <div className="mt-4">
            <Line w="100%" />
            <Line w="95%" />
            <Line w="88%" />
            <Line w="70%" />
          </div>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="bma-card bma-card-pad">
          <Line w="50%" h={28} />
          <Line w="70%" />
          <div className="bma-skeleton mt-4" style={{ height: 46, borderRadius: 10 }} />
          <div className="bma-skeleton mt-2" style={{ height: 46, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  </div>
);

interface DetailMessageProps {
  icon: string;
  title: string;
  description: string;
  // Offered on failures so a customer is never left with only a dead end.
  onRetry?: () => void;
  // The way out should match what the customer was looking for: someone who
  // opened an agent link wants other agents, not a package list.
  exitTo?: string;
  exitLabel?: string;
}

export const DetailMessage: React.FC<DetailMessageProps> = ({
  icon,
  title,
  description,
  onRetry,
  exitTo = '/search',
  exitLabel = 'Browse all packages',
}) => (
  <div className="container py-5">
    <div className="bma-card bma-empty mx-auto" style={{ maxWidth: 560 }}>
      <i className={`${icon} fa-2x d-block`} aria-hidden="true"></i>
      <h2 className="h4 mb-2" style={{ color: 'var(--bma-ink)' }}>{title}</h2>
      <p className="mb-4">{description}</p>
      <div className="d-flex justify-content-center gap-2 flex-wrap">
        {onRetry && (
          <button type="button" className="bma-search-submit px-4" onClick={onRetry}>
            Try again
          </button>
        )}
        <Link to={exitTo} className="btn btn-outline-secondary">{exitLabel}</Link>
      </div>
    </div>
  </div>
);

// A package or agent that is missing, unapproved or deactivated all answer 404
// identically, so the customer-facing wording covers every one of them without
// hinting at which it was.
export const NotFoundState: React.FC<{ kind: 'package' | 'agent' }> = ({ kind }) => (
  <DetailMessage
    icon="fas fa-compass"
    title={kind === 'package' ? 'This package is no longer available' : 'This agent is not available'}
    description={
      kind === 'package'
        ? 'It may have been removed by the agent, or the link may be out of date. There are plenty of others to explore.'
        : 'They may no longer be listed with us, or the link may be out of date. You can browse our other verified agents instead.'
    }
    exitTo={kind === 'package' ? '/search' : '/search?type=agents'}
    exitLabel={kind === 'package' ? 'Browse all packages' : 'Browse verified agents'}
  />
);

export const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <DetailMessage
    icon="fas fa-triangle-exclamation"
    title="Something went wrong"
    description="We could not load this page just now. Please check your connection and try again."
    onRetry={onRetry}
  />
);
