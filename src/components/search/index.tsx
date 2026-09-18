import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeaderThree from '../../layouts/headers/HeaderThree';
import FooterThree from '../../layouts/footers/FooterThree';
import SearchBar from './SearchBar';
import SearchFilters from './SearchFilters';
import PackageResultCard from './PackageResultCard';
import AgentResultCard from './AgentResultCard';
import {
  type AgentResult,
  type PackageResult,
  type SearchParams,
  type SearchResult,
  type SearchType,
  isAgentResult,
} from '../../types/search';
import { searchApi, fromQueryString, toQueryString } from '../../services/searchApi';

// The results page. The URL is the single source of truth for what is being
// searched, so a customer can bookmark or share a search and the back button
// behaves the way they expect.
const SearchResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [params, setParams] = useState<SearchParams>(() => fromQueryString(location.search));
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const type: SearchType = params.type || 'packages';

  useEffect(() => {
    setParams(fromQueryString(location.search));
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await searchApi.search(params);
        if (cancelled) return;
        setResults(response.data);
        setTotal(response.pagination.total);
        setPages(response.pagination.pages);
      } catch (requestError) {
        if (cancelled) return;
        console.error('Search failed:', requestError);
        setError('We could not run that search. Please try again.');
        setResults([]);
        setTotal(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [params]);

  // Every change routes through the URL rather than local state, which keeps
  // the two from disagreeing.
  const updateParams = useCallback((next: SearchParams) => {
    navigate(`/search?${toQueryString(next)}`);
  }, [navigate]);

  const switchType = (nextType: SearchType) => {
    // Price and duration describe a package; experience describes an agency.
    // Carrying them across would silently filter the new mode by something the
    // customer can no longer see.
    updateParams({
      type: nextType,
      q: params.q,
      from: params.from,
      to: params.to,
      category: params.category,
      city: params.city,
      page: 1,
    });
  };

  const sortOptions = type === 'packages'
    ? [
      { value: 'recommended', label: 'Recommended' },
      { value: 'price_asc', label: 'Price: low to high' },
      { value: 'price_desc', label: 'Price: high to low' },
      { value: 'duration', label: 'Shortest trip' },
      { value: 'newest', label: 'Newest' },
    ]
    : [
      { value: 'recommended', label: 'Recommended' },
      { value: 'experience', label: 'Most experienced' },
      { value: 'packages', label: 'Most packages' },
      { value: 'newest', label: 'Newest' },
    ];

  return (
    <>
      <HeaderThree />

      <main className="bma-page pb-80" style={{ background: '#f7f8fa' }}>
        {/* HeaderThree sits transparently over the page, so inner pages need a
            band of their own to sit below it — the same job the template's
            breadcrumb image does on other inner pages. */}
        <div
          className="tg-breadcrumb-spacing-3 include-bg p-relative fix"
          style={{ backgroundImage: 'url(/assets/img/breadcrumb/breadcrumb-2.jpg)' }}
        >
          <div className="tg-hero-top-shadow"></div>
        </div>

        <SearchBar initial={params} onTypeChange={switchType} className="pt-40 pb-40" />

        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-12 mb-4">
              <SearchFilters params={params} type={type} onChange={updateParams} />
            </div>

            <div className="col-lg-9 col-12">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <span className="small text-muted">
                  {isLoading
                    ? 'Searching…'
                    : `${total} ${type === 'agents' ? 'agent' : 'package'}${total === 1 ? '' : 's'} found`}
                </span>

                <div className="d-flex align-items-center gap-2">
                  <label className="small text-muted mb-0" htmlFor="search-sort">Sort by</label>
                  <select
                    id="search-sort"
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={params.sort || 'recommended'}
                    onChange={(event) => updateParams({ ...params, sort: event.target.value, page: 1 })}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              {isLoading && (
                <div className="text-center py-5">
                  <span className="spinner-border" role="status" aria-label="Searching"></span>
                </div>
              )}

              {!isLoading && !error && results.length === 0 && (
                <div className="text-center bg-white border rounded py-5">
                  <i className="fas fa-magnifying-glass fa-2x text-muted mb-3"></i>
                  <h4>No {type} found</h4>
                  <p className="text-muted mb-0">
                    Try a different city or service, or clear some filters.
                  </p>
                </div>
              )}

              {!isLoading && !error && results.length > 0 && (
                type === 'agents' ? (
                  <div>
                    {(results as AgentResult[]).filter(isAgentResult).map((result) => (
                      <AgentResultCard key={result._id} result={result} />
                    ))}
                  </div>
                ) : (
                  <div className="row g-3">
                    {(results as PackageResult[]).map((result) => (
                      <div className="col-xl-4 col-md-6 col-12" key={result._id}>
                        <PackageResultCard result={result} />
                      </div>
                    ))}
                  </div>
                )
              )}

              {!isLoading && pages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    {Array.from({ length: pages }, (_, index) => index + 1).map((pageNumber) => (
                      <li
                        key={pageNumber}
                        className={`page-item ${(params.page || 1) === pageNumber ? 'active' : ''}`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => updateParams({ ...params, page: pageNumber })}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </main>

      <FooterThree />
    </>
  );
};

export default SearchResults;
