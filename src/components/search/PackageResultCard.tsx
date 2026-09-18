import React from 'react';
import { Link } from 'react-router-dom';
import { type PackageResult } from '../../types/search';

const formatPrice = (result: PackageResult) => {
  const amount = new Intl.NumberFormat('en-PK').format(result.price);
  return `${result.currency} ${amount}`;
};

const formatDeparture = (result: PackageResult) => {
  if (!result.departureDate) return 'On request';
  return new Date(result.departureDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const PackageResultCard: React.FC<{ result: PackageResult }> = ({ result }) => (
  <div className="tg-listing-card-item mb-25 h-100 border rounded overflow-hidden bg-white">
    <div className="tg-listing-card-thumb p-relative">
      {result.images[0] ? (
        <img
          className="w-100"
          src={result.images[0].url}
          alt={result.title}
          style={{ height: 200, objectFit: 'cover' }}
        />
      ) : (
        <div
          className="w-100 d-flex align-items-center justify-content-center bg-light"
          style={{ height: 200 }}
        >
          <i className="fas fa-image fa-2x text-muted"></i>
        </div>
      )}
      <span className="badge bg-primary position-absolute" style={{ top: 12, left: 12 }}>
        {result.category?.name}
      </span>
    </div>

    <div className="tg-listing-card-content p-3">
      <h4 className="tg-listing-card-title h5 mb-2">
        <Link to={`/packages/${result._id}`}>{result.title}</Link>
      </h4>

      <div className="small text-muted mb-2">
        <i className="fas fa-location-dot me-1"></i>
        {result.departureCity} → {result.destination}
        <span className="mx-2">·</span>
        <i className="fas fa-clock me-1"></i>{result.durationDays} days
      </div>

      <div className="small text-muted mb-3">
        <i className="fas fa-plane-departure me-1"></i>Departs {formatDeparture(result)}
      </div>

      {/* The agent is part of the result, not a footnote: the plan's whole
          premise is that customers compare verified agencies, not just prices. */}
      <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
        {result.agent?.logo ? (
          <img
            src={result.agent.logo}
            alt=""
            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : (
          <span
            className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle"
            style={{ width: 32, height: 32 }}
          >
            <i className="fas fa-building text-muted small"></i>
          </span>
        )}
        <div className="small">
          <Link to={`/agents/${result.agent?._id}`} className="fw-semibold text-decoration-none">
            {result.agent?.companyName || 'Travel agent'}
          </Link>
          {result.agent?.isVerified && (
            <i className="fas fa-circle-check text-success ms-1" title="Verified agent"></i>
          )}
          <div className="text-muted">{result.agent?.city}</div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <div>
          <div className="fw-bold text-primary">{formatPrice(result)}</div>
          <div className="small text-muted">
            {result.priceType === 'per_group' ? 'per group' : 'per person'}
          </div>
        </div>
        <Link to={`/packages/${result._id}`} className="btn btn-sm btn-outline-primary">
          View details
        </Link>
      </div>
    </div>
  </div>
);

export default PackageResultCard;
