import React, { useCallback, useEffect, useState } from 'react';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';
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
      setCounts(response.filters || {});
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

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

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h4>Payments</h4>
      </div>
      <div className="card-body">
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
                  <span className="badge bg-light text-dark ms-2">{counts[tab.key]}</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="row g-2 mb-20">
          <div className="col-md-3">
            <label htmlFor="pm-agent" className="form-label small text-muted mb-1">Agent</label>
            <select
              id="pm-agent" className="form-select form-select-sm"
              value={filters.agentId || ''}
              onChange={(event) => setFilter({ agentId: event.target.value || undefined })}
            >
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>{agent.fullName}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label htmlFor="pm-plan" className="form-label small text-muted mb-1">Plan</label>
            <select
              id="pm-plan" className="form-select form-select-sm"
              value={filters.subscriptionId || ''}
              onChange={(event) => setFilter({ subscriptionId: event.target.value || undefined })}
            >
              <option value="">All plans</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>{plan.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label htmlFor="pm-from" className="form-label small text-muted mb-1">From</label>
            <input
              id="pm-from" type="date" className="form-control form-control-sm"
              value={filters.from || ''}
              onChange={(event) => setFilter({ from: event.target.value || undefined })}
            />
          </div>
          <div className="col-md-2">
            <label htmlFor="pm-to" className="form-label small text-muted mb-1">To</label>
            <input
              id="pm-to" type="date" className="form-control form-control-sm"
              value={filters.to || ''}
              onChange={(event) => setFilter({ to: event.target.value || undefined })}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="pm-search" className="form-label small text-muted mb-1">
              Transaction / sender
            </label>
            <form
              className="d-flex gap-2"
              onSubmit={(event) => { event.preventDefault(); setFilter({ search: searchInput.trim() || undefined }); }}
            >
              <input
                id="pm-search" type="search" className="form-control form-control-sm"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="TRX123…"
              />
              <button type="submit" className="btn btn-sm btn-outline-primary flex-shrink-0">Go</button>
            </form>
          </div>
        </div>

        {hasActiveFilters && (
          <button type="button" className="btn btn-sm btn-link px-0 mb-2" onClick={clearFilters}>
            Clear all filters
          </button>
        )}

        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-receipt" aria-hidden="true"></i>
            <h5 className="mt-3 mb-2">No payments found</h5>
            <p className="text-muted">
              {hasActiveFilters ? 'No payment matches these filters.' : 'No payments have been submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">Agent</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Transaction</th>
                    <th scope="col">Status</th>
                    <th scope="col">Paid On</th>
                    <th scope="col">Verified By</th>
                    <th scope="col">Invoice</th>
                    <th scope="col" className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>
                        {nameOf(payment.agent)}
                        {payment.agent?.email && (
                          <small className="d-block text-muted">{payment.agent.email}</small>
                        )}
                      </td>
                      <td>{payment.planNameSnapshot}</td>
                      <td>{formatAmount(payment.amount, payment.currency)}</td>
                      <td><code className="small">{payment.transactionNumber}</code></td>
                      <td>{<PaymentStatusBadge status={payment.status} />}</td>
                      <td className="text-muted">{new Date(payment.submittedAt).toLocaleDateString()}</td>
                      <td className="text-muted">
                        {nameOf(payment.reviewer)}
                        {payment.verifiedAt && (
                          <small className="d-block">{new Date(payment.verifiedAt).toLocaleDateString()}</small>
                        )}
                      </td>
                      <td>
                        {payment.invoice ? (
                          <button
                            type="button" className="btn btn-sm btn-link p-0"
                            onClick={() => setInvoiceFor(payment)}
                          >
                            {payment.invoice.invoiceNumber}
                          </button>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-end">
                        <button
                          type="button" className="btn btn-sm btn-outline-secondary"
                          onClick={() => setViewing(payment)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <nav className="d-flex justify-content-between align-items-center mt-3" aria-label="Payment pages">
                <button
                  type="button" className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                >
                  Previous
                </button>
                <span className="text-muted">Page {page} of {pages}</span>
                <button
                  type="button" className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
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
