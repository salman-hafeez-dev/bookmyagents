import React, { useCallback, useEffect, useState } from 'react';
import PaymentDetailsModal from '../../common/PaymentDetailsModal';
import PaymentStatusBadge from '../../common/PaymentStatusBadge';
import InvoiceModal from '../../common/InvoiceModal';
import { paymentService } from '../../../services/paymentService';
import { extractApiError } from '../../../services/agentProfileService';
import { subscriptionService, type Subscription } from '../../../services/subscriptionService';
import { userService } from '../../../services/userService';
import { showToast } from '../../../utils/toast';
import {
  formatAmount,
  type Payment,
  type PaymentStatus,
  type AdminPaymentFilters,
} from '../../../types/payment';
import { Badge, Button, DataTable, IconButton, Input, Select, type DataTableColumn } from '../../ui';

const STATUS_TABS: { key: PaymentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

interface AgentOption { _id: string; fullName: string; email: string }

const nameOf = (value: unknown): string =>
  (value && typeof value === 'object' && 'fullName' in (value as Record<string, unknown>))
    ? (value as { fullName: string }).fullName
    : '—';

// Payment history across every agent, independent of the Subscription Requests
// queue. This is a read-only ledger: approving or rejecting still happens on the
// request, so there is exactly one place where money changes a subscription.
const PaymentsManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewing, setViewing] = useState<Payment | null>(null);
  // The payment whose invoice PDF is open in the viewer.
  const [invoiceFor, setInvoiceFor] = useState<Payment | null>(null);

  const [filters, setFilters] = useState<AdminPaymentFilters>({ status: 'all' });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    // Filter options. Failure here isn't fatal — the table still works, just
    // without the agent/plan dropdowns, so it's logged rather than surfaced.
    Promise.all([
      userService.getUsers({ role: 'agent', limit: 200 }),
      subscriptionService.getSubscriptions(),
    ])
      .then(([usersRes, plansRes]) => {
        setAgents((usersRes.data || []) as unknown as AgentOption[]);
        setPlans(plansRes.data || []);
      })
      .catch((error) => console.error('Could not load payment filter options:', error));
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await paymentService.getAdminPayments({ ...filters, page, limit: 20 });
      setPayments(response.data);
      setPages(response.pagination.pages);
      setTotal(response.pagination.total);
      setCounts(response.filters || {});
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // The search box is server-side, so it is debounced rather than firing a
  // request per keystroke. Same approach as the user search in DashboardArea.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim() || undefined;
      setFilters((previous) => (previous.search === next ? previous : { ...previous, search: next }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setFilter = (patch: Partial<AdminPaymentFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: 'all' });
    setSearchInput('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.agentId || filters.subscriptionId || filters.from || filters.to || filters.search
    || (filters.status && filters.status !== 'all')
  );

  const columns: DataTableColumn<Payment>[] = [
    {
      key: 'agent',
      header: 'Agent',
      render: (payment) => (
        <>
          <span className="fw-semibold">{nameOf(payment.agent)}</span>
          {payment.agent?.email && <small className="d-block text-muted">{payment.agent.email}</small>}
        </>
      ),
    },
    { key: 'plan', header: 'Plan', nowrap: true, render: (payment) => payment.planNameSnapshot },
    {
      key: 'amount',
      header: 'Amount',
      nowrap: true,
      render: (payment) => formatAmount(payment.amount, payment.currency),
    },
    {
      key: 'transaction',
      header: 'Transaction',
      hideBelow: 'lg',
      render: (payment) => <code className="small">{payment.transactionNumber}</code>,
    },
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (payment) => <PaymentStatusBadge status={payment.status} />,
    },
    {
      key: 'paidOn',
      header: 'Paid on',
      nowrap: true,
      hideBelow: 'md',
      render: (payment) => (
        <span className="text-muted">{new Date(payment.submittedAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'verifiedBy',
      header: 'Verified by',
      hideBelow: 'lg',
      render: (payment) => (
        <span className="text-muted">
          {nameOf(payment.reviewer)}
          {payment.verifiedAt && (
            <small className="d-block">{new Date(payment.verifiedAt).toLocaleDateString()}</small>
          )}
        </span>
      ),
    },
    {
      key: 'invoice',
      header: 'Invoice',
      hideBelow: 'lg',
      render: (payment) => (payment.invoice ? (
        <Button variant="link" onClick={() => setInvoiceFor(payment)}>
          {payment.invoice.invoiceNumber}
        </Button>
      ) : <span className="text-muted">—</span>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '64px',
      render: (payment) => (
        <div className="ui-actions">
          <IconButton
            icon="far fa-eye"
            label="View payment details"
            onClick={() => setViewing(payment)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-card">
      <div className="card-body">
        {/* Status stays a row of tabs rather than a dropdown: each carries a
            count, which is the reason an admin opens this screen at all. */}
        <ul className="nav nav-pills flex-wrap gap-2 mb-20" role="tablist">
          {STATUS_TABS.map((tab) => (
            <li className="nav-item" key={tab.key} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={filters.status === tab.key}
                className={`nav-link ${filters.status === tab.key ? 'active' : ''}`}
                onClick={() => setFilter({ status: tab.key })}
              >
                {tab.label}
                {counts[tab.key] !== undefined && (
                  <Badge tone="neutral" className="ms-2">{counts[tab.key]}</Badge>
                )}
              </button>
            </li>
          ))}
        </ul>

        <DataTable<Payment>
          columns={columns}
          rows={payments}
          rowKey={(payment) => payment._id}
          title="Payments"
          loading={loading}
          search={{
            placeholder: 'Transaction number or sender…',
            value: searchInput,
            onChange: setSearchInput,
          }}
          toolbar={(
            <>
              <Select
                options={[
                  { value: '', label: 'All agents' },
                  ...agents.map((agent) => ({ value: agent._id, label: agent.fullName })),
                ]}
                value={filters.agentId || ''}
                size="sm"
                aria-label="Filter by agent"
                onChange={(event) => setFilter({ agentId: event.target.value || undefined })}
              />
              <Select
                options={[
                  { value: '', label: 'All plans' },
                  ...plans.map((plan) => ({ value: plan._id, label: plan.name })),
                ]}
                value={filters.subscriptionId || ''}
                size="sm"
                aria-label="Filter by plan"
                onChange={(event) => setFilter({ subscriptionId: event.target.value || undefined })}
              />
              <Input
                type="date"
                size="sm"
                aria-label="Paid from"
                value={filters.from || ''}
                onChange={(event) => setFilter({ from: event.target.value || undefined })}
              />
              <Input
                type="date"
                size="sm"
                aria-label="Paid to"
                value={filters.to || ''}
                onChange={(event) => setFilter({ to: event.target.value || undefined })}
              />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" icon="fas fa-xmark" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </>
          )}
          pagination={{ page, pages, total, limit: 20, onChange: setPage, noun: 'payments' }}
          emptyState={{
            icon: 'fas fa-receipt',
            title: 'No payments found',
            description: hasActiveFilters
              ? 'No payment matches these filters.'
              : 'No payments have been submitted yet.',
            action: hasActiveFilters
              ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
              : undefined,
          }}
        />
      </div>

      {viewing && <PaymentDetailsModal payment={viewing} onClose={() => setViewing(null)} />}
      {invoiceFor && (
        <InvoiceModal
          paymentId={invoiceFor._id}
          invoiceNumber={invoiceFor.invoice?.invoiceNumber}
          onClose={() => setInvoiceFor(null)}
        />
      )}
    </div>
  );
};

export default PaymentsManagement;
