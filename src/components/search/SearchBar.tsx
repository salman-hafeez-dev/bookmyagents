import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type SearchParams, type SearchType } from '../../types/search';
import { useCategories } from '../../hooks/useCategories';
import { toQueryString } from '../../services/searchApi';
import ModeSwitch from './ModeSwitch';

interface SearchBarProps {
  // Prefilled when the bar sits above existing results, so editing one field
  // doesn't silently discard the rest of the customer's search.
  initial?: SearchParams;
  // Supplied by the results page so flipping the switch re-runs the search
  // immediately. On the homepage there are no results to re-run, so the choice
  // is simply carried into the search the customer is about to make.
  onTypeChange?: (type: SearchType) => void;
  className?: string;
}

// The marketplace's main search: From / Where / Service, with the switch that
// decides whether the customer gets offers or agencies back.
const SearchBar: React.FC<SearchBarProps> = ({ initial, onTypeChange, className = '' }) => {
  const navigate = useNavigate();

  const [type, setType] = useState<SearchType>(initial?.type || 'packages');
  const [from, setFrom] = useState(initial?.from || '');
  const [to, setTo] = useState(initial?.to || '');
  const [category, setCategory] = useState(initial?.category || '');
  const categories = useCategories();

  // Keep in step when the URL changes underneath us — a category card, the
  // back button, or a filter applied in the sidebar.
  useEffect(() => {
    setType(initial?.type || 'packages');
    setFrom(initial?.from || '');
    setTo(initial?.to || '');
    setCategory(initial?.category || '');
  }, [initial?.type, initial?.from, initial?.to, initial?.category]);


  const handleTypeChange = (next: SearchType) => {
    setType(next);
    onTypeChange?.(next);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params: SearchParams = {
      type,
      from: from.trim() || undefined,
      to: to.trim() || undefined,
      category: category || undefined,
    };
    navigate(`/search?${toQueryString(params)}`);
  };

  return (
    <div className={`tg-booking-form-area ${className}`}>
      <div className="container">
        <div className="bma-search-card">

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <span className="text-muted small mb-0">I'm looking for</span>
            <ModeSwitch value={type} onChange={handleTypeChange} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-2 align-items-end">
              <div className="col-lg-3 col-md-6 col-12">
                <label className="form-label mb-1" htmlFor="search-from">From</label>
                <input
                  id="search-from"
                  type="text"
                  className="form-control"
                  placeholder="Lahore"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </div>

              <div className="col-lg-3 col-md-6 col-12">
                <label className="form-label mb-1" htmlFor="search-to">Where</label>
                <input
                  id="search-to"
                  type="text"
                  className="form-control"
                  placeholder="Makkah, Hunza, UK…"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </div>

              <div className="col-lg-4 col-md-8 col-12">
                <label className="form-label mb-1" htmlFor="search-category">Service</label>
                <select
                  id="search-category"
                  className="form-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">All services</option>
                  {categories.map((item) => (
                    <option key={item._id} value={item.slug}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-lg-2 col-md-4 col-12">
                <button type="submit" className="bma-search-submit w-100">
                  <i className="fas fa-search me-2"></i>Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
