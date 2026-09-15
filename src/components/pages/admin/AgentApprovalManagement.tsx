import React, { useCallback, useEffect, useState } from 'react';
import AgentReviewDetail from './AgentReviewDetail';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';
import { adminAgentService, extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import {
  type AdminAgentListItem,
  type AgentProfileStatus,
} from '../../../types/agentProfile';

type StatusFilter = AgentProfileStatus | 'all';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'incomplete', label: 'Incomplete' },
  { key: 'all', label: 'All' },
];

const statusBadge = (status: AgentProfileStatus) => {
  const variants: Record<AgentProfileStatus, string> = {
    approved: 'bg-success',
    pending: 'bg-warning text-dark',
    rejected: 'bg-danger',
    incomplete: 'bg-secondary',
  };
  return <span className={`badge ${variants[status]}`}>{status}</span>;
};

const AgentApprovalManagement: React.FC = () => {
  const [agents, setAgents] = useState<AdminAgentListItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAgentService.getAgents({ status, search, page, limit: 20 });
      setAgents(response.data.agents);
      setCounts(response.data.filters);
      setPages(response.data.pagination.pages);
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeStatus = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  if (selectedAgentId) {
    return (
      <AgentReviewDetail
        agentId={selectedAgentId}
        onBack={() => setSelectedAgentId(null)}
        // Refresh the list in the background so the counts and the row's status
        // are already correct when the admin navigates back.
        onDecision={fetchAgents}
      />
    );
  }

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h4>Agent Registrations</h4>
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-20">
          <ul className="nav nav-pills flex-wrap gap-2 mb-0" role="tablist">
            {FILTERS.map((filter) => (
              <li className="nav-item" key={filter.key} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={status === filter.key}
                  className={`nav-link ${status === filter.key ? 'active' : ''}`}
                  onClick={() => changeStatus(filter.key)}
                >
                  {filter.label}
                  {counts[filter.key] !== undefined && (
                    <span className="badge bg-light text-dark ms-2">{counts[filter.key]}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <form className="d-flex gap-2" onSubmit={handleSearch} role="search">
            <input
              type="search"
              className="form-control"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Company, owner or email"
              aria-label="Search agents"
            />
            <button type="submit" className="btn btn-outline-primary flex-shrink-0">Search</button>
          </form>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : agents.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-user-check" aria-hidden="true"></i>
            <h5 className="mt-3 mb-2">No agents found</h5>
            <p className="text-muted">
              {search ? 'No agent matches that search.' : `No agents with "${status}" status.`}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">Company</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Email</th>
                    <th scope="col">Status</th>
                    <th scope="col">Progress</th>
                    <th scope="col">Docs</th>
                    <th scope="col">Submitted</th>
                    <th scope="col" className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent._id}>
                      <td>{agent.companyName || <span className="text-muted fst-italic">Not set</span>}</td>
                      <td>{agent.ownerName || '—'}</td>
                      <td className="text-muted">{agent.email || '—'}</td>
                      <td>{statusBadge(agent.status)}</td>
                      <td style={{ minWidth: 130 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="progress flex-grow-1" style={{ height: 6 }} role="progressbar"
                            aria-label={`${agent.companyName || 'Agent'} completion`}
                            aria-valuenow={agent.profileCompletionPercentage}
                            aria-valuemin={0} aria-valuemax={100}
                          >
                            <div className="progress-bar" style={{ width: `${agent.profileCompletionPercentage}%` }} />
                          </div>
                          <small className="text-muted flex-shrink-0">{agent.profileCompletionPercentage}%</small>
                        </div>
                      </td>
                      <td className="text-muted">{agent.documentsCount}</td>
                      <td className="text-muted">
                        {agent.submittedForReviewAt
                          ? new Date(agent.submittedForReviewAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedAgentId(agent._id)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <nav className="d-flex justify-content-between align-items-center mt-3" aria-label="Agent list pages">
                <button
                  type="button" className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <span className="text-muted">Page {page} of {pages}</span>
                <button
                  type="button" className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage((current) => Math.min(pages, current + 1))}
                  disabled={page >= pages}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AgentApprovalManagement;
