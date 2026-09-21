import React, { useState, useEffect } from 'react';
import { subscriptionRequestService } from '../../../services/subscriptionRequestService';
import { type SubscriptionRequest } from '../../../types/subscriptionRequest';
import PaymentDetailsModal from '../../common/PaymentDetailsModal';
import PaymentStatusBadge from '../../common/PaymentStatusBadge';
import { Badge, DataTable, IconButton, Textarea, type DataTableColumn } from '../../ui';
import ConfirmationModal from '../../common/ConfirmationModal';
import { formatAmount, type Payment } from '../../../types/payment';
import { useConfirm } from '../../../contexts/ConfirmContext';

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
  const confirm = useConfirm();

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
    const ok = await confirm({
      title: 'Verify Payment & Approve',
      heading: 'Activate This Plan',
      description: 'The payment is marked verified, the plan is activated for the agent and an invoice is issued. This happens as one atomic action.',
      icon: 'success',
      actionColor: 'success',
      actionLabel: 'Verify & Approve',
    });
    if (!ok) return;

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

  type RequestRow = (typeof requests)[number];

  const columns: DataTableColumn<RequestRow>[] = [
    {
      key: 'agent',
      header: 'Agent',
      render: (req) => {
        const agent = typeof req.agentId === 'object' ? req.agentId : null;
        return agent ? (
          <>
            <div className="fw-semibold">{agent.fullName}</div>
            <small className="text-muted">{agent.email}</small>
          </>
        ) : 'Unknown agent';
      },
    },
    {
      key: 'currentPlan',
      header: 'Current plan',
      nowrap: true,
      hideBelow: 'lg',
      render: (req) => {
        const agent = typeof req.agentId === 'object' ? req.agentId : null;
        const currentPlan = agent?.subscription && typeof agent.subscription === 'object'
          ? agent.subscription : null;
        return currentPlan
          ? <Badge tone="neutral">{currentPlan.name}</Badge>
          : <span className="text-muted">None</span>;
      },
    },
    {
      key: 'requestedPlan',
      header: 'Requested plan',
      nowrap: true,
      render: (req) => {
        const requestedPlan = typeof req.subscriptionId === 'object' ? req.subscriptionId : null;
        return requestedPlan ? <Badge tone="primary">{requestedPlan.name}</Badge> : 'N/A';
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      nowrap: true,
      render: (req) => {
        const payment = (req as unknown as { payment?: Payment | null }).payment || null;
        // The snapshot, not the plan's current price — a later price edit must
        // not rewrite what was charged.
        return payment
          ? formatAmount(payment.amount, payment.currency)
          : req.amountSnapshot !== undefined
            ? formatAmount(req.amountSnapshot, req.currencySnapshot || 'PKR')
            : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'transaction',
      header: 'Transaction',
      hideBelow: 'lg',
      render: (req) => {
        const payment = (req as unknown as { payment?: Payment | null }).payment || null;
        return payment
          ? <code className="small">{payment.transactionNumber}</code>
          : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'sender',
      header: 'Sender',
      hideBelow: 'lg',
      render: (req) => {
        const payment = (req as unknown as { payment?: Payment | null }).payment || null;
        return payment ? payment.senderAccountName : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'payment',
      header: 'Payment',
      nowrap: true,
      render: (req) => {
        const payment = (req as unknown as { payment?: Payment | null }).payment || null;
        return payment
          ? <PaymentStatusBadge status={payment.status} />
          : <Badge tone="neutral">None</Badge>;
      },
    },
    {
      key: 'requestedOn',
      header: 'Requested on',
      nowrap: true,
      hideBelow: 'md',
      render: (req) => (
        <span className="text-muted">{new Date(req.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '132px',
      render: (req) => {
        const payment = (req as unknown as { payment?: Payment | null }).payment || null;
        return (
          <div className="ui-actions">
            <IconButton
              icon="far fa-receipt"
              label={payment ? 'View payment details' : 'No payment attached'}
              disabled={!payment}
              onClick={() => payment && setViewingPayment(payment)}
            />
            <IconButton
              icon="far fa-circle-check"
              label="Verify payment and approve"
              tone="success"
              disabled={actingId === req._id}
              onClick={() => handleApprove(req._id)}
            />
            <IconButton
              icon="far fa-circle-xmark"
              label="Reject"
              tone="danger"
              disabled={actingId === req._id}
              onClick={() => { setRejectingId(req._id); setRejectionReason(''); }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="dashboard-card mb-30">
      <div className="card-body">
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        <DataTable<RequestRow>
          columns={columns}
          rows={requests}
          rowKey={(req) => req._id}
          title={(
            <>
              Pending Subscription Requests
              {!loading && <Badge tone="neutral" className="ms-2">{requests.length}</Badge>}
            </>
          )}
          loading={loading}
          search={{
            placeholder: 'Search by agent, email or transaction…',
            // The searchable text is nested under agentId and the attached
            // payment, so this needs a matcher rather than a list of keys.
            match: (req, query) => {
              const agent = typeof req.agentId === 'object' ? req.agentId : null;
              const payment = (req as unknown as { payment?: Payment | null }).payment || null;
              return [agent?.fullName, agent?.email, payment?.transactionNumber, payment?.senderAccountName]
                .some((value) => String(value ?? '').toLowerCase().includes(query));
            },
          }}
          pagination={{ noun: 'requests' }}
          emptyState={{
            icon: 'fas fa-inbox',
            title: 'No pending requests',
            description: 'All subscription requests have been reviewed.',
          }}
        />
      </div>

      {viewingPayment && (
        <PaymentDetailsModal payment={viewingPayment} onClose={() => setViewingPayment(null)} />
      )}

      <ConfirmationModal
        isOpen={!!rejectingId}
        title="Reject Request"
        heading="Send Back To The Agent"
        description="The payment is marked rejected and the agent stays on their current plan. They can submit a corrected payment afterwards."
        icon="warning"
        actionColor="danger"
        actionLabel={actingId ? 'Rejecting…' : 'Reject Request'}
        size="md"
        loading={!!actingId}
        onConfirm={handleReject}
        onCancel={() => setRejectingId(null)}
      >
        <Textarea
          id="sub-rejection-reason"
          label="Reason"
          hint="Shown to the agent."
          rows={3}
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          placeholder="e.g. The transaction number doesn't match any transfer we received."
        />
      </ConfirmationModal>
    </div>
  );
};

export default SubscriptionRequestsPanel;
