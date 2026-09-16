import React, { useCallback, useEffect, useState } from 'react';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';
import PaymentDetailsModal from '../../common/PaymentDetailsModal';
import PaymentStatusBadge from '../../common/PaymentStatusBadge';
import InvoiceModal from '../../common/InvoiceModal';
import { paymentService } from '../../../services/paymentService';
import { extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { formatAmount, type Payment, type PaymentStatus } from '../../../types/payment';

const FILTERS: { key: PaymentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

// The agent's own payment history. The endpoint scopes every query to the
// authenticated user, so there is no way to reach another agent's payments
// from here — no agent id is ever sent from the client.
const AgentPaymentsPanel: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState<PaymentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Payment | null>(null);
  // The payment whose invoice PDF is open in the viewer.
  const [invoiceFor, setInvoiceFor] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await paymentService.getMyPayments({ status, page, limit: 20 });
      setPayments(response.data);
      setPages(response.pagination.pages);
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h4>My Payments</h4>
      </div>
      <div className="card-body">
        <ul className="nav nav-pills flex-wrap gap-2 mb-20" role="tablist">
          {FILTERS.map((filter) => (
            <li className="nav-item" key={filter.key} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={status === filter.key}
                className={`nav-link ${status === filter.key ? 'active' : ''}`}
                onClick={() => { setStatus(filter.key); setPage(1); }}
              >
                {filter.label}
              </button>
            </li>
          ))}
        </ul>

        {loading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-receipt" aria-hidden="true"></i>
            <h5 className="mt-3 mb-2">No payments yet</h5>
            <p className="text-muted">
              Payments appear here once you request a plan and submit your transfer details.
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Transaction</th>
                    <th scope="col">Status</th>
                    <th scope="col">Invoice</th>
                    <th scope="col" className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="text-muted">{new Date(payment.submittedAt).toLocaleDateString()}</td>
                      <td>{payment.planNameSnapshot}</td>
                      <td>{formatAmount(payment.amount, payment.currency)}</td>
                      <td><code className="small">{payment.transactionNumber}</code></td>
                      <td>
                        {<PaymentStatusBadge status={payment.status} />}
                        {payment.status === 'rejected' && payment.rejectionReason && (
                          <small className="d-block text-danger">{payment.rejectionReason}</small>
                        )}
                      </td>
                      <td>
                        {payment.invoice ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0"
                            onClick={() => setInvoiceFor(payment)}
                          >
                            {payment.invoice.invoiceNumber}
                          </button>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
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

export default AgentPaymentsPanel;
