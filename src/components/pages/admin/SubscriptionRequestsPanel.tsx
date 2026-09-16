import React, { useState, useEffect } from 'react';
import { subscriptionRequestService } from '../../../services/subscriptionRequestService';
import { type SubscriptionRequest } from '../../../types/subscriptionRequest';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';
import PaymentDetailsModal from '../../common/PaymentDetailsModal';
import PaymentStatusBadge from '../../common/PaymentStatusBadge';
import Modal from '../../common/Modal';
import { formatAmount, type Payment } from '../../../types/payment';

// Admin view of pending subscription requests. Approving here calls the
// same assignSubscriptionToUser path the existing direct-assign endpoint
// uses — this panel is the review gate in front of it, not a parallel
// mechanism.
const SubscriptionRequestsPanel: React.FC = () => {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Payment being viewed in the details modal.
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  // Request being rejected; the reason is collected before the call is made.
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await subscriptionRequestService.getAdminRequests('pending');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching subscription requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActingId(requestId);
      await subscriptionRequestService.approveRequest(requestId);
      setMessage({ type: 'success', text: 'Payment verified, plan activated and invoice issued.' });
      fetchRequests();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error approving request:', error);
      setMessage({ type: 'error', text: 'Failed to approve request' });
    } finally {
      setActingId(null);
    }
  };

  // Rejecting also marks the linked payment rejected server-side, so the reason
  // is worth collecting — it's what the agent sees explaining the refusal.
  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      setActingId(rejectingId);
      await subscriptionRequestService.rejectRequest(rejectingId, rejectionReason.trim() || undefined);
      setMessage({ type: 'success', text: 'Request and payment rejected. The agent keeps their current plan.' });
      setRejectingId(null);
      setRejectionReason('');
      fetchRequests();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setMessage({ type: 'error', text: 'Failed to reject request' });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="dashboard-card mb-30">
      <div className="card-header">
        <h4>
          Pending Subscription Requests
          {!loading && <span className="badge bg-secondary ms-2">{requests.length}</span>}
        </h4>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h5 className="mt-3 mb-2">No Pending Requests</h5>
            <p className="text-muted">All subscription requests have been reviewed.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Current Plan</th>
                  <th>Requested Plan</th>
                  <th>Amount</th>
                  <th>Transaction</th>
                  <th>Sender</th>
                  <th>Payment</th>
                  <th>Requested On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const agent = typeof req.agentId === 'object' ? req.agentId : null;
                  const requestedPlan = typeof req.subscriptionId === 'object' ? req.subscriptionId : null;
                  const currentPlan = agent?.subscription && typeof agent.subscription === 'object' ? agent.subscription : null;
                  // Attached by the admin list endpoint — the request references
                  // its payment rather than duplicating any of it.
                  const payment = (req as unknown as { payment?: Payment | null }).payment || null;
                  return (
                    <tr key={req._id}>
                      <td>
                        {agent ? (
                          <>
                            <div>{agent.fullName}</div>
                            <small className="text-muted">{agent.email}</small>
                          </>
                        ) : 'Unknown agent'}
                      </td>
                      <td>
                        {currentPlan ? (
                          <span className="badge bg-secondary">{currentPlan.name}</span>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td>
                        {requestedPlan ? (
                          <span className="badge bg-primary">{requestedPlan.name}</span>
                        ) : 'N/A'}
                      </td>
                      <td>
                        {/* The snapshot, not the plan's current price — a later
                            price edit must not rewrite what was charged. */}
                        {payment
                          ? formatAmount(payment.amount, payment.currency)
                          : req.amountSnapshot !== undefined
                            ? formatAmount(req.amountSnapshot, req.currencySnapshot || 'PKR')
                            : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {payment ? <code className="small">{payment.transactionNumber}</code> : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {payment ? payment.senderAccountName : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {payment ? <PaymentStatusBadge status={payment.status} /> : <span className="badge bg-secondary">none</span>}
                      </td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={!payment}
                            onClick={() => payment && setViewingPayment(payment)}
                            title={payment ? 'View payment details' : 'No payment attached'}
                          >
                            <i className="fas fa-receipt"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            disabled={actingId === req._id}
                            onClick={() => handleApprove(req._id)}
                            title="Verify payment & approve"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={actingId === req._id}
                            onClick={() => { setRejectingId(req._id); setRejectionReason(''); }}
                            title="Reject"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingPayment && (
        <PaymentDetailsModal payment={viewingPayment} onClose={() => setViewingPayment(null)} />
      )}

      {rejectingId && (
        <Modal
          onClose={() => setRejectingId(null)}
          title="Reject this request?"
          size="sm"
          busy={!!actingId}
          footer={(
            <>
              <button
                type="button" className="btn btn-outline-secondary"
                onClick={() => setRejectingId(null)} disabled={!!actingId}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleReject} disabled={!!actingId}>
                {actingId ? 'Rejecting…' : 'Reject request'}
              </button>
            </>
          )}
        >
          <p>
            The payment is marked rejected and the agent stays on their current plan. They can submit a
            corrected payment afterwards.
          </p>
          <label htmlFor="sub-rejection-reason" className="form-label fw-semibold">
            Reason <span className="text-muted fw-normal">(shown to the agent)</span>
          </label>
          <textarea
            id="sub-rejection-reason"
            className="form-control"
            rows={3}
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="e.g. The transaction number doesn't match any transfer we received."
          />
        </Modal>
      )}
    </div>
  );
};

export default SubscriptionRequestsPanel;
