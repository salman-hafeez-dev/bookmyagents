import React from 'react';
import { Link } from 'react-router-dom';
import { type TravelPackage } from '../../types/package';
import { formatDate, formatMoney, formatPriceType } from '../../utils/format';

interface AgentPackageCardProps {
  travelPackage: TravelPackage;
  categoryName: string;
}

// A package as it appears on its own agent's profile. Deliberately not the
// search card: the agency is already established by the page around it, so
// repeating the company name and verified badge on every tile is noise.
const AgentPackageCard: React.FC<AgentPackageCardProps> = ({ travelPackage, categoryName }) => {
  const departure = formatDate(travelPackage.departureDate);

  return (
    <article className="bma-result-card h-100 d-flex flex-column">
      <Link to={`/packages/${travelPackage._id}`} className="d-block">
        {travelPackage.images?.[0] ? (
          <img
            src={travelPackage.images[0].url}
            alt={travelPackage.title}
            className="w-100"
            style={{ height: 180, objectFit: 'cover' }}
          />
        ) : (
          <div
            className="w-100 d-flex align-items-center justify-content-center"
            style={{ height: 180, background: '#ece9f6' }}
          >
            <i className="fas fa-image fa-2x" style={{ color: '#9d97b5' }} aria-hidden="true"></i>
          </div>
        )}
      </Link>

      <div className="p-3 d-flex flex-column flex-grow-1">
        <span className="bma-chip align-self-start mb-2">{categoryName}</span>

        <h3 className="h6 mb-2 tg-listing-card-title">
          <Link to={`/packages/${travelPackage._id}`}>{travelPackage.title}</Link>
        </h3>

        <div className="bma-meta small mb-3">
          <span><i className="fas fa-location-dot"></i>{travelPackage.departureCity} → {travelPackage.destination}</span>
          <span><i className="fas fa-clock"></i>{travelPackage.durationDays} days</span>
        </div>

        {departure && (
          <div className="small text-muted mb-3">
            <i className="fas fa-plane-departure me-1"></i>Departs {departure}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-end mt-auto pt-2">
          <div>
            <div className="bma-price">{formatMoney(travelPackage.price, travelPackage.currency)}</div>
            <div className="small text-muted">{formatPriceType(travelPackage.priceType)}</div>
          </div>
          <Link to={`/packages/${travelPackage._id}`} className="btn btn-sm btn-outline-primary">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
};

export default AgentPackageCard;
