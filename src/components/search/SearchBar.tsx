import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Category } from '../../types/category';
import { type SearchParams, type SearchType } from '../../types/search';
import { categoryService } from '../../services/categoryService';
import { toQueryString } from '../../services/searchApi';

interface SearchBarProps {
  // Prefilled when the bar sits above existing results, so editing one field
  // doesn't silently discard the rest of the customer's search.
  initial?: SearchParams;
  className?: string;
}

// The marketplace's main search: From / Where / Category, plus the two buttons
// that decide whether the customer gets offers or agencies back.
const SearchBar: React.FC<SearchBarProps> = ({ initial, className = '' }) => {
  const navigate = useNavigate();

  const [type, setType] = useState<SearchType>(initial?.type || 'packages');
  const [from, setFrom] = useState(initial?.from || '');
  const [to, setTo] = useState(initial?.to || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .getCategories({ limit: 20 })
      .then((response) => {
        if (!cancelled) setCategories(response.data || []);
      })
      .catch((error) => console.error('Failed to load categories:', error));
    return () => { cancelled = true; };
  }, []);

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
        <div className="tg-booking-form-wrap p-4 bg-white rounded shadow-sm">

          {/* The two buttons. Packages is the default because that is what a
              customer usually arrives looking for; Agents is a deliberate
              choice, not a guess the site makes on their behalf. */}
          <div className="btn-group mb-3" role="group" aria-label="What to search for">
            <button
              type="button"
              className={`btn ${type === 'packages' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setType('packages')}
            >
              <i className="fas fa-suitcase-rolling me-2"></i>Packages
            </button>
            <button
              type="button"
              className={`btn ${type === 'agents' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setType('agents')}
            >
              <i className="fas fa-user-tie me-2"></i>Agents
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-2 align-items-end">
              <div className="col-lg-3 col-md-6 col-12">
                <label className="form-label small text-muted mb-1">From</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Lahore"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </div>

              <div className="col-lg-3 col-md-6 col-12">
                <label className="form-label small text-muted mb-1">Where</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Makkah, Hunza, UK…"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </div>

              <div className="col-lg-4 col-md-8 col-12">
                <label className="form-label small text-muted mb-1">Service</label>
                <select
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
                <button type="submit" className="btn btn-primary w-100">
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
