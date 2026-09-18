import React, { useCallback, useEffect, useState } from 'react';
import {
  type Lead,
  type LeadFilters,
  type LeadStatus,
  type LeadSummary,
  type LeadType,
  CONTACTABLE_TYPES,
} from '../../../../types/lead';
import { leadService } from '../../../../services/leadService';
import { showToast, getErrorMessage } from '../../../../utils/toast';
import LeadDetail from './LeadDetail';
import StatTile from '../../../dashboard-admin/StatTile';
import Pager from '../../../dashboard-admin/Pager';
import { STATUS_META, STATUS_ORDER, TYPE_META, timeAgo } from './leadMeta';

const TYPE_FILTERS: { value: LeadType | ''; label: string }[] = [
  { value: '', label: 'All activity' },
  { value: 'quote_request', label: 'Quote requests' },
  { value: 'inquiry', label: 'Enquiries' },
  { value: 'whatsapp_click', label: 'WhatsApp taps' },
  { value: 'phone_click', label: 'Phone taps' },
];

// The agent's inbox — the screen that answers "what did my subscription do for
// me this month".
const AgentLeadsPanel: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [filters, setFilters] = useState<LeadFilters>({ page: 1, limit: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const response = await leadService.getMyLeads(filters);
      setLeads(response.data);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (error) {
      setHasError(true);
      showToast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Patch in place rather than refetching: the agent is looking at the row
  // they just changed, and a reload would scroll it out from under them.
  const handleUpdated = (updated: Lead) => {
    setLeads((current) => current.map((lead) => (lead._id === updated._id ? updated : lead)));
    setSelected(updated);
    setSummary((current) => current && ({
      ...current,
      newLeads: updated.status === 'new' ? current.newLeads : Math.max(0, current.newLeads - 1),
    }));
  };

  const statusFilter = (status?: LeadStatus) =>
    setFilters((current) => ({ ...current, status, page: 1 }));

  const tiles = [
    { label: 'Total leads', value: summary?.totalLeads ?? 0, icon: 'fas fa-inbox', tone: 'primary' as const },
    { label: 'New', value: summary?.newLeads ?? 0, icon: 'fas fa-bell', tone: 'warning' as const },
    { label: 'This month', value: summary?.thisMonth ?? 0, icon: 'fas fa-calendar-day', tone: 'info' as const },
    { label: 'Converted', value: summary?.converted ?? 0, icon: 'fas fa-handshake', tone: 'success' as const },
    { label: 'Profile views', value: summary?.profileViews ?? 0, icon: 'fas fa-eye', tone: 'muted' as const },
    { label: 'Package views', value: summary?.packageViews ?? 0, icon: 'fas fa-images', tone: 'muted' as const },
  ];

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="dashboard-card">
          <div className="card-body">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="d-flex align-items-center gap-3 py-3 border-bottom">
                <div className="bma-skeleton rounded-circle" style={{ width: 40, height: 40 }} />
                <div className="flex-grow-1">
                  <div className="bma-skeleton mb-2" style={{ width: '38%', height: 14 }} />
                  <div className="bma-skeleton" style={{ width: '22%', height: 12 }} />
                </div>
                <div className="bma-skeleton" style={{ width: 84, height: 24 }} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="dashboard-card">
          <div className="card-body text-center py-5">
            <i className="fas fa-triangle-exclamation fa-2x text-muted mb-3"></i>
            <h4>We could not load your leads</h4>
            <p className="text-muted">Please check your connection and try again.</p>
            <button type="button" className="btn btn-primary" onClick={load}>Try again</button>
          </div>
        </div>
      );
    }

    if (leads.length === 0) {
      // An empty inbox means two very different things, and telling an agent
      // "no leads yet" while they are invisible to customers would be useless.
      const invisible = summary && !summary.isPubliclyVisible;
      const filtered = Boolean(filters.status || filters.type);

      return (
        <div className="dashboard-card">
          <div className="card-body text-center py-5">
            <i className="fas fa-inbox fa-2x text-muted mb-3"></i>
            {filtered ? (
              <>
                <h4>No leads match this filter</h4>
                <p className="text-muted mb-3">Try clearing the filter to see everything.</p>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setFilters({ page: 1, limit: 20 })}
                >
                  Clear filters
                </button>
              </>
            ) : invisible ? (
              <>
                <h4>Your profile is not live yet</h4>
                <p className="text-muted mb-0">
                  Customers cannot find you until an admin approves your profile. Leads will
                  start appearing here as soon as they can.
                </p>
              </>
            ) : (
              <>
                <h4>No leads yet</h4>
                <p className="text-muted mb-0">
                  When a customer taps WhatsApp, calls you or asks for a quote from your
                  listings, it appears here.
                </p>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-card">
        <ul className="bma-lead-list">
          {leads.map((lead) => {
            const type = TYPE_META[lead.type];
            const named = CONTACTABLE_TYPES.includes(lead.type);
            return (
              <li key={lead._id}>
                <button type="button" className="bma-lead-row" onClick={() => setSelected(lead)}>
                  <span className={`bma-lead-icon bma-lead-icon--${lead.type}`}>
                    <i className={type.icon} aria-hidden="true"></i>
                  </span>

                  <span className="bma-lead-main">
                    <span className="bma-lead-title">
                      {lead.customerName || type.label}
                      {lead.status === 'new' && <span className="bma-lead-dot" aria-label="Unread" />}
                    </span>
                    <span className="bma-lead-sub">
                      {named && lead.customerPhone ? `${lead.customerPhone} · ` : ''}
                      {lead.package?.title || lead.category?.name || 'Profile'}
                    </span>
                  </span>

                  <span className="bma-lead-meta">
                    <span className={`bma-lead-badge ${STATUS_META[lead.status].className}`}>
                      {STATUS_META[lead.status].label}
                    </span>
                    <span className="bma-lead-time">{timeAgo(lead.createdAt)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <Pager
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          limit={pagination.limit}
          noun="leads"
          onChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      </div>
    );
  };

  return (
    <>
      <div className="row g-3 mb-4">
        {tiles.map((tile) => (
          <div className="col-xl-2 col-lg-4 col-md-4 col-6" key={tile.label}>
            <StatTile label={tile.label} value={tile.value} icon={tile.icon} tone={tile.tone} />
          </div>
        ))}
      </div>

      <div className="dashboard-card mb-3">
        <div className="card-body">
          <div className="bma-filter-bar">
            <div className="bma-lead-tabs">
              <button
                type="button"
                className={`bma-lead-tab${!filters.status ? ' is-active' : ''}`}
                onClick={() => statusFilter(undefined)}
              >
                All
                <span className="bma-tab-count">{summary?.totalLeads ?? 0}</span>
              </button>
              {STATUS_ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`bma-lead-tab${filters.status === status ? ' is-active' : ''}`}
                  onClick={() => statusFilter(status)}
                >
                  {STATUS_META[status].label}
                  <span className="bma-tab-count">{summary?.statusCounts?.[status] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="bma-filter-bar-end">
              {/* <label className="small text-muted mb-0" htmlFor="lead-type">Show</label> */}
              <select
                id="lead-type"
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={filters.type || ''}
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  type: (event.target.value || undefined) as LeadType | undefined,
                  page: 1,
                }))}
              >
                {TYPE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {renderList()}

      <LeadDetail
        lead={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    </>
  );
};

export default AgentLeadsPanel;
