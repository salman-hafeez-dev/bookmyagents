import React, { useCallback, useEffect, useState } from 'react';
import AgentReviewDetail from './AgentReviewDetail';
import { adminAgentService, extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { Badge, DataTable, IconButton, type BadgeTone, type DataTableColumn } from '../../ui';
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
  const tones: Record<AgentProfileStatus, BadgeTone> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
    incomplete: 'neutral',
  };
  return <Badge tone={tones[status]} dot>{status}</Badge>;
};

const AgentApprovalManagement: React.FC = () => {
  const [agents, setAgents] = useState<AdminAgentListItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAgentService.getAgents({ status, search, page, limit: 20 });
      setAgents(response.data.agents);
      setCounts(response.data.filters);
      setPages(response.data.pagination.pages);
      setTotal(response.data.pagination.total);
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // Server-side search, debounced rather than fired per keystroke — which is
  // what the old "Search" button was working around.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch((current) => (current === searchInput.trim() ? current : searchInput.trim()));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const changeStatus = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const columns: DataTableColumn<AdminAgentListItem>[] = [
    {
      key: 'company',
      header: 'Company',
      render: (agent) => (agent.companyName
        ? <span className="fw-semibold">{agent.companyName}</span>
        : <span className="text-muted fst-italic">Not set</span>),
    },
    { key: 'owner', header: 'Owner', hideBelow: 'md', render: (agent) => agent.ownerName || '—' },
    {
      key: 'email',
      header: 'Email',
      hideBelow: 'lg',
      render: (agent) => <span className="text-muted">{agent.email || '—'}</span>,
    },
    { key: 'status', header: 'Status', nowrap: true, render: (agent) => statusBadge(agent.status) },
    {
      key: 'progress',
      header: 'Progress',
      width: '150px',
      render: (agent) => (
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
      ),
    },
    {
      key: 'docs',
      header: 'Docs',
      align: 'center',
      hideBelow: 'lg',
      render: (agent) => <span className="text-muted">{agent.documentsCount}</span>,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      nowrap: true,
      hideBelow: 'md',
      render: (agent) => (
        <span className="text-muted">
          {agent.submittedForReviewAt
            ? new Date(agent.submittedForReviewAt).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '64px',
      render: (agent) => (
        <div className="ui-actions">
          <IconButton
            icon="far fa-folder-open"
            label="Review this registration"
            onClick={() => setSelectedAgentId(agent._id)}
          />
        </div>
      ),
    },
  ];

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
                    <Badge tone="neutral" className="ms-2">{counts[filter.key]}</Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>

        </div>

        <DataTable<AdminAgentListItem>
          columns={columns}
          rows={agents}
          rowKey={(agent) => agent._id}
          title="Agent Registrations"
          loading={loading}
          search={{
            placeholder: 'Company, owner or email…',
            value: searchInput,
            onChange: setSearchInput,
          }}
          pagination={{ page, pages, total, limit: 20, onChange: setPage, noun: 'agents' }}
          emptyState={{
            icon: 'fas fa-user-check',
            title: 'No agents found',
            description: search ? 'No agent matches that search.' : `No agents with "${status}" status.`,
          }}
        />
      </div>
    </div>
  );
};

export default AgentApprovalManagement;
