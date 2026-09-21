import React from 'react';
import { Link } from 'react-router-dom';
import { type AgentResult } from '../../types/search';
import StarRating from '../marketplace/StarRating';
import { useCurrency } from '../../hooks/useCurrency';

const AgentResultCard: React.FC<{ result: AgentResult }> = ({ result }) => {
  const currency = useCurrency();
  return (
  <div className="bma-result-card p-3 mb-3">
    <div className="row g-3">
      <div className="col-md-2 col-3">
        {result.logo ? (
          <img
            src={result.logo}
            alt={result.companyName}
            className="w-100 rounded"
            style={{ aspectRatio: '1', objectFit: 'cover' }}
          />
        ) : (
          <div
            className="w-100 d-flex align-items-center justify-content-center bg-light rounded"
            style={{ aspectRatio: '1' }}
          >
            <i className="fas fa-building fa-2x text-muted"></i>
          </div>
        )}
      </div>

      <div className="col-md-7 col-9">
        <h4 className="h5 mb-1">
          <Link to={`/agents/${result._id}`} className="text-decoration-none">
            {result.companyName || 'Travel agent'}
          </Link>
          {result.isVerified && (
            <span className="badge bg-success ms-2">
              <i className="fas fa-circle-check me-1"></i>Verified
            </span>
          )}
        </h4>

        <div className="small text-muted mb-2">
          <i className="fas fa-location-dot me-1"></i>
          {[result.city, result.province].filter(Boolean).join(', ') || 'Pakistan'}
          {typeof result.yearsExperience === 'number' && (
            <>
              <span className="mx-2">·</span>
              <i className="fas fa-award me-1"></i>{result.yearsExperience} years experience
            </>
          )}
          <span className="mx-2">·</span>
          {result.reviewCount && result.avgRating ? (
            <span className="d-inline-flex align-items-center gap-1">
              <StarRating value={result.avgRating} size="sm" />
              {result.avgRating.toFixed(1)} ({result.reviewCount})
            </span>
          ) : (
            // An unrated agent is new, not bad. Empty stars would imply a low
            // score where there is simply no score yet.
            <span>No reviews yet</span>
          )}
        </div>

        {result.categories?.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-2">
            {result.categories.map((category) => (
              <span key={category._id} className="badge bg-light text-dark border">
                {category.name}
              </span>
            ))}
          </div>
        )}

        {result.companyDescription && (
          <p className="small text-muted mb-2 d-none d-md-block">
            {result.companyDescription.length > 160
              ? `${result.companyDescription.slice(0, 160)}…`
              : result.companyDescription}
          </p>
        )}

        {/* What they actually sell, so the customer can judge the agency
            without opening a second page. */}
        {result.topPackages?.length > 0 && (
          <ul className="list-unstyled small mb-0">
            {result.topPackages.map((item) => (
              <li key={item._id} className="mb-1">
                <Link to={`/packages/${item._id}`} className="text-decoration-none">
                  <i className="fas fa-angle-right me-2 text-primary"></i>
                  {item.title}
                </Link>
                <span className="text-muted"> — {currency.format(item.price, item.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="col-md-3 col-12 text-md-end d-flex flex-md-column justify-content-between">
        <div>
          {typeof result.startingPrice === 'number' && (
            <>
              <div className="small text-muted">Packages from</div>
              <div className="h5 bma-price mb-1">
                {currency.format(result.startingPrice, result.topPackages[0]?.currency)}
              </div>
            </>
          )}
          <div className="small text-muted mb-3">
            {result.packageCount} package{result.packageCount === 1 ? '' : 's'}
          </div>
        </div>
        <Link to={`/agents/${result._id}`} className="btn btn-primary btn-sm align-self-md-end">
          View profile
        </Link>
      </div>
    </div>
  </div>
  );
};

export default AgentResultCard;
