import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { type PackageResult } from '../../../types/search';
import { searchApi } from '../../../services/searchApi';
import PackageResultCard from '../../search/PackageResultCard';

// Replaces the template's dummy listing grid with real packages from real
// verified agents. Uses the same ranking as the search page, so what is
// promoted on the homepage and what ranks in search never disagree.
const FeaturedPackages: React.FC = () => {
  const [packages, setPackages] = useState<PackageResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    searchApi
      .searchPackages({ limit: 6, sort: 'recommended' })
      .then((response) => { if (!cancelled) setPackages(response.data); })
      .catch((error) => console.error('Failed to load featured packages:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // An empty marketplace should look like a homepage without a listings
  // section, not like a broken listings section.
  if (isLoading || packages.length === 0) return null;

  return (
    <div className="tg-listing-area pt-60 pb-60">
      <div className="container">
        <div className="row mb-40">
          <div className="col-md-8">
            <h2 className="tg-section-title mb-1">Featured packages</h2>
            <p className="text-muted mb-0">From verified travel agents across Pakistan.</p>
          </div>
          <div className="col-md-4 text-md-end">
            <Link to="/search" className="btn btn-outline-primary">Browse all packages</Link>
          </div>
        </div>

        <div className="row g-3">
          {packages.map((item) => (
            <div className="col-xl-4 col-md-6 col-12" key={item._id}>
              <PackageResultCard result={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedPackages;
