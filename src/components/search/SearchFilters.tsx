import React, { useEffect, useState } from 'react';
import { type SearchParams, type SearchType } from '../../types/search';
import { useCategories } from '../../hooks/useCategories';

interface SearchFiltersProps {
  params: SearchParams;
  type: SearchType;
  onChange: (next: SearchParams) => void;
}

// The filter sidebar. Which filters make sense depends on what is being
// searched: price and duration describe an offer, experience describes an
// agency, so each set only appears for the mode it belongs to.
const SearchFilters: React.FC<SearchFiltersProps> = ({ params, type, onChange }) => {
  const categories = useCategories();

  // Local copy so typing in a number field doesn't fire a request per keystroke;
  // committed on blur or Enter.
  const [draft, setDraft] = useState<SearchParams>(params);

  useEffect(() => { setDraft(params); }, [params]);


  const commit = (partial: SearchParams) => onChange({ ...params, ...partial, page: 1 });

  const numberField = (
    label: string,
    key: keyof SearchParams,
    placeholder: string
  ) => (
    <div className="col-6">
      <label className="form-label small text-muted mb-1">{label}</label>
      <input
        type="number"
        className="form-control form-control-sm"
        placeholder={placeholder}
        value={(draft[key] as number | undefined) ?? ''}
        onChange={(event) => setDraft({
          ...draft,
          [key]: event.target.value === '' ? undefined : Number(event.target.value),
        })}
        onBlur={() => commit({ [key]: draft[key] } as SearchParams)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit({ [key]: draft[key] } as SearchParams);
          }
        }}
      />
    </div>
  );

  const hasFilters = Boolean(
    params.category || params.city || params.from || params.to || params.q
    || params.minPrice !== undefined || params.maxPrice !== undefined
    || params.minDuration !== undefined || params.maxDuration !== undefined
    || params.minExperience !== undefined
  );

  return (
    <aside className="bma-filters p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Filters</h5>
        {hasFilters && (
          <button
            type="button"
            className="btn btn-sm btn-link p-0"
            onClick={() => onChange({ type, page: 1 })}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label small text-muted mb-1">Service</label>
        <select
          className="form-select form-select-sm"
          value={params.category || ''}
          onChange={(event) => commit({ category: event.target.value || undefined })}
        >
          <option value="">All services</option>
          {categories.map((category) => (
            <option key={category._id} value={category.slug}>{category.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label small text-muted mb-1">Agent city</label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Lahore"
          value={draft.city || ''}
          onChange={(event) => setDraft({ ...draft, city: event.target.value })}
          onBlur={() => commit({ city: draft.city || undefined })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit({ city: draft.city || undefined });
            }
          }}
        />
      </div>

      {type === 'packages' ? (
        <>
          <div className="mb-3">
            <label className="form-label small text-muted mb-1">Price (PKR)</label>
            <div className="row g-2">
              {numberField('Min', 'minPrice', '0')}
              {numberField('Max', 'maxPrice', '500000')}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small text-muted mb-1">Duration (days)</label>
            <div className="row g-2">
              {numberField('Min', 'minDuration', '1')}
              {numberField('Max', 'maxDuration', '30')}
            </div>
          </div>
        </>
      ) : (
        <div className="mb-3">
          <div className="row g-2">
            {numberField('Min experience (years)', 'minExperience', '5')}
          </div>
        </div>
      )}

      <div className="alert alert-light border small mb-0">
        <i className="fas fa-circle-check text-success me-1"></i>
        Every agent shown here has been verified by our team.
      </div>
    </aside>
  );
};

export default SearchFilters;
