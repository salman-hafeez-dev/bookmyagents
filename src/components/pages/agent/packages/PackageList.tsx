import React from 'react';
import { type TravelPackage } from '../../../../types/package';

interface PackageListProps {
  packages: TravelPackage[];
  isLoading: boolean;
  onEdit: (travelPackage: TravelPackage) => void;
  onDelete: (travelPackage: TravelPackage) => void;
  onToggleActive: (travelPackage: TravelPackage) => void;
  onCreate: () => void;
}

const formatPrice = (travelPackage: TravelPackage) => {
  const amount = new Intl.NumberFormat('en-PK').format(travelPackage.price);
  const suffix = travelPackage.priceType === 'per_group' ? 'per group' : 'per person';
  return `${travelPackage.currency} ${amount} ${suffix}`;
};

const formatDeparture = (travelPackage: TravelPackage) => {
  if (!travelPackage.departureDate) return 'On request';
  return new Date(travelPackage.departureDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const categoryName = (travelPackage: TravelPackage) =>
  typeof travelPackage.category === 'string' ? '' : travelPackage.category?.name || '';

const PackageList: React.FC<PackageListProps> = ({
  packages,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  onCreate,
}) => {
  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="card-body text-center py-5">
          <span className="spinner-border" role="status" aria-label="Loading packages"></span>
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="card-body text-center py-5">
          <i className="fas fa-suitcase-rolling fa-2x mb-3 text-muted"></i>
          <h4>No packages yet</h4>
          <p className="text-muted">
            A package is what customers actually search for and compare — your profile
            on its own gives them nothing to book.
          </p>
          <button type="button" className="btn btn-primary" onClick={onCreate}>
            Add your first package
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-3">
      {packages.map((travelPackage) => (
        <div className="col-xl-4 col-lg-6 col-12" key={travelPackage._id}>
          <div className="dashboard-card h-100">
            {travelPackage.images[0] && (
              <img
                src={travelPackage.images[0].url}
                alt=""
                style={{ width: '100%', height: 160, objectFit: 'cover' }}
              />
            )}

            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="badge bg-light text-dark">{categoryName(travelPackage)}</span>
                <span className={`badge ${travelPackage.isActive ? 'bg-success' : 'bg-secondary'}`}>
                  {travelPackage.isActive ? 'Live' : 'Hidden'}
                </span>
              </div>

              <h5 className="mb-1">{travelPackage.title}</h5>
              <p className="text-muted mb-2">
                {travelPackage.departureCity} → {travelPackage.destination} · {travelPackage.durationDays} days
              </p>

              <ul className="list-unstyled small text-muted mb-3">
                <li><i className="fas fa-tag me-2"></i>{formatPrice(travelPackage)}</li>
                <li><i className="fas fa-plane-departure me-2"></i>Departs {formatDeparture(travelPackage)}</li>
                {typeof travelPackage.viewCount === 'number' && (
                  <li><i className="fas fa-eye me-2"></i>{travelPackage.viewCount} views</li>
                )}
              </ul>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => onEdit(travelPackage)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => onToggleActive(travelPackage)}
                >
                  {travelPackage.isActive ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(travelPackage)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PackageList;
