import React, { useCallback, useEffect, useState } from 'react';
import {
  type AdminLead,
  type AdminLeadFilters,
  type LeadStatus,
  type LeadType,
  type PlatformLeadStats,
  CONTACTABLE_TYPES,
} from '../../../types/lead';
import { type Category } from '../../../types/category';
import { leadService } from '../../../services/leadService';
import { categoryService } from '../../../services/categoryService';
import { showToast, getErrorMessage } from '../../../utils/toast';
import StatTile from '../../dashboard-admin/StatTile';
import Pager from '../../dashboard-admin/Pager';
import { STATUS_META, STATUS_ORDER, TYPE_META, timeAgo } from '../agent/leads/leadMeta';

const DAY_RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last year' },
];

const TYPE_FILTERS: { value: LeadType | ''; label: string }[] = [
  { value: '', label: 'All activity' },
  { value: 'quote_request', label: 'Quote requests' },
  { value: 'inquiry', label: 'Enquiries' },
  { value: 'whatsapp_click', label: 'WhatsApp taps' },
  { value: 'phone_click', label: 'Phone taps' },
];

// Platform-wide lead activity.
//
// The agent inbox answers "did I get business"; this answers the questions
// that price the product — which categories customers actually want, and which
// agents turn interest into deals.
const LeadsManagement: React.FC = () => {
  const [stats, setStats] = useState<PlatformLeadStats | null>(null);
  const [days, setDays] = useState(30);

  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [filters, setFilters] = useState<AdminLeadFilters>({ page: 1, limit: 20 });
  const [searchDraft, setSearchDraft] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const response = await leadService.getPlatformStats(days);
      setStats(response.data);
    } catch (error) {
      showToast.error(getErrorMessage(error));
    } finally {
      setIsLoadingStats(false);
    }
  }, [days]);

  const loadLeads = useCallback(async () => {
    try {
      setIsLoadingLeads(true);
      setHasError(false);
      const response = await leadService.getAllLeads(filters);
      setLeads(response.data);
      setPagination(response.pagination);
    } catch (error) {
      setHasError(true);
      showToast.error(getErrorMessage(error));
    } finally {
      setIsLoadingLeads(false);
    }
  }, [filters]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadLeads(); }, [loadLeads]);

  useEffect(() => {
    categoryService
      .getCategories({ limit: 20 })
      .then((response) => setCategories(response.data || []))
      .catch((error) => console.error('Failed to load categories:', error));
  }, []);

  const countOf = (rows: { _id: string; count: number }[] | undefined, key: string) =>
    rows?.find((row) => row._id === key)?.count ?? 0;

  const quoteRequests = countOf(stats?.byType, 'quote_request') + countOf(stats?.byType, 'inquiry');
  const converted = countOf(stats?.byStatus, 'converted');
  const newLeads = countOf(stats?.byStatus, 'new');
  // Of the leads that reached a decision, how many closed. Counting the whole
  // pipeline would make every agent look bad while leads are still open.
  const decided = converted + countOf(stats?.byStatus, 'closed_lost');
  const conversionRate = decided > 0 ? Math.round((converted / decided) * 100) : 0;

  const tiles = [
    { label: 'Total leads', value: stats?.total ?? 0, icon: 'fas fa-inbox', tone: 'primary' as const },
    { label: 'Named enquiries', value: quoteRequests, icon: 'fas fa-file-invoice', tone: 'info' as const },
    { label: 'Awaiting reply', value: newLeads, icon: 'fas fa-bell', tone: 'warning' as const },
    { label: 'Converted', value: converted, icon: 'fas fa-handshake', tone: 'success' as const },
    { label: 'Close rate', value: `${conversionRate}%`, icon: 'fas fa-percent', tone: 'muted' as const },
  ];

  const applySearch = () =>
    setFilters((current) => ({ ...current, search: searchDraft.trim() || undefined, page: 1 }));

  const maxCategoryCount = Math.max(1, ...(stats?.byCategory || []).map((row) => row.count));

  return (
    <>
      {/* Range */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 className="mb-0">Lead activity</h4>
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          aria-label="Date range"
        >
          {DAY_RANGES.map((range) => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>
      </div>

      <div className="row g-3 mb-4">
        {tiles.map((tile) => (
          <div className="col-xl col-lg-4 col-md-4 col-6" key={tile.label}>
            {isLoadingStats
              ? <div className="bma-skeleton" style={{ height: 80, borderRadius: 14 }} />
              : <StatTile label={tile.label} value={tile.value} icon={tile.icon} tone={tile.tone} />}
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        {/* Which categories customers actually want */}
        <div className="col-lg-6">
          <div className="dashboard-card h-100">
            <div className="card-header"><h4>Leads by category</h4></div>
            <div className="card-body">
              {stats?.byCategory?.length ? (
                stats.byCategory.map((row) => (
                  <div className="mb-3" key={row._id}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{row.name}</span>
                      <span className="text-muted">{row.count}</span>
                    </div>
                    <div className="bma-meter">
                      <span style={{ width: `${(row.count / maxCategoryCount) * 100}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0">No category activity in this period.</p>
              )}
            </div>
          </div>
        </div>

        {/* Which agents are answering it */}
        <div className="col-lg-6">
          <div className="dashboard-card h-100">
            <div className="card-header"><h4>Most active agents</h4></div>
            <div className="card-body">
              {stats?.topAgents?.length ? (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Agent</th>
                        <th className="text-end">Leads</th>
                        <th className="text-end">Converted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topAgents.map((agent) => (
                        <tr key={agent._id}>
                          <td>
                            <div className="fw-semibold">{agent.companyName || 'Unnamed agent'}</div>
                            <div className="small text-muted">{agent.city}</div>
                          </td>
                          <td className="text-end">{agent.leads}</td>
                          <td className="text-end">{agent.converted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">No agent activity in this period.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All leads */}
      <div className="dashboard-card mb-3">
        <div className="card-body">
          <div className="bma-filter-bar">
            <div className="bma-lead-tabs">
              <button
                type="button"
                className={`bma-lead-tab${!filters.status ? ' is-active' : ''}`}
                onClick={() => setFilters((current) => ({ ...current, status: undefined, page: 1 }))}
              >
                All
              </button>
              {STATUS_ORDER.map((status: LeadStatus) => (
                <button
                  key={status}
                  type="button"
                  className={`bma-lead-tab${filters.status === status ? ' is-active' : ''}`}
                  onClick={() => setFilters((current) => ({ ...current, status, page: 1 }))}
                >
                  {STATUS_META[status].label}
                </button>
              ))}
            </div>

            <div className="bma-filter-bar-end">
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={filters.categoryId || ''}
                onChange={(event) => setFilters((current) => ({
                  ...current, categoryId: event.target.value || undefined, page: 1,
                }))}
                aria-label="Category"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>

              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={filters.type || ''}
                onChange={(event) => setFilters((current) => ({
                  ...current, type: (event.target.value || undefined) as LeadType | undefined, page: 1,
                }))}
                aria-label="Activity type"
              >
                {TYPE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3" style={{ maxWidth: 420 }}>
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Search name, phone or email…"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') applySearch(); }}
            />
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={applySearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        {isLoadingLeads ? (
          <div className="card-body">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="d-flex align-items-center gap-3 py-3 border-bottom">
                <div className="bma-skeleton rounded-circle" style={{ width: 36, height: 36 }} />
                <div className="flex-grow-1">
                  <div className="bma-skeleton mb-2" style={{ width: '34%', height: 13 }} />
                  <div className="bma-skeleton" style={{ width: '20%', height: 11 }} />
                </div>
                <div className="bma-skeleton" style={{ width: 80, height: 22 }} />
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="card-body text-center py-5">
            <i className="fas fa-triangle-exclamation fa-2x text-muted mb-3"></i>
            <h4>We could not load leads</h4>
            <button type="button" className="btn btn-primary mt-2" onClick={loadLeads}>Try again</button>
          </div>
        ) : leads.length === 0 ? (
          <div className="card-body text-center py-5">
            <i className="fas fa-inbox fa-2x text-muted mb-3"></i>
            <h4>No leads found</h4>
            <p className="text-muted mb-0">
              {filters.status || filters.type || filters.categoryId || filters.search
                ? 'Try clearing the filters.'
                : 'Customer activity will appear here once agents are live.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle mb-0 bma-lead-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Activity</th>
                    <th>Agent</th>
                    <th>Interest</th>
                    <th>Status</th>
                    <th className="text-end">When</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const type = TYPE_META[lead.type];
                    const named = CONTACTABLE_TYPES.includes(lead.type);
                    return (
                      <tr key={lead._id}>
                        <td>
                          {named ? (
                            <>
                              <div className="fw-semibold">{lead.customerName}</div>
                              <div className="small text-muted">{lead.customerPhone}</div>
                            </>
                          ) : (
                            <span className="text-muted">Anonymous visitor</span>
                          )}
                        </td>
                        <td>
                          <span className={`bma-lead-icon bma-lead-icon--${lead.type} me-2`}>
                            <i className={type.icon} aria-hidden="true"></i>
                          </span>
                          <span className="small">{type.short}</span>
                        </td>
                        <td>
                          <div className="fw-semibold">{lead.agent?.companyName || '—'}</div>
                          <div className="small text-muted">{lead.agent?.city}</div>
                        </td>
                        <td className="small">
                          {lead.package?.title || lead.category?.name || 'Profile'}
                        </td>
                        <td>
                          <span className={`bma-lead-badge ${STATUS_META[lead.status].className}`}>
                            {STATUS_META[lead.status].label}
                          </span>
                        </td>
                        <td className="text-end small text-muted">{timeAgo(lead.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pager
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              noun="leads"
              onChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        )}
      </div>
    </>
  );
};

export default LeadsManagement;
