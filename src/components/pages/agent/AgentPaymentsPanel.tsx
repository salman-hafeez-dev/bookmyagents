import React, { useCallback, useEffect, useState } from 'react';
import PaymentDetailsModal from '../../common/PaymentDetailsModal';
import PaymentStatusBadge from '../../common/PaymentStatusBadge';
import InvoiceModal from '../../common/InvoiceModal';
import { paymentService } from '../../../services/paymentService';
import { extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { formatAmount, type Payment, type PaymentStatus } from '../../../types/payment';
import { Button, DataTable, IconButton, Select, type DataTableColumn } from '../../ui';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 20;

// The agent's own payment history. The endpoint scopes every query to the
// authenticated user, so there is no way to reach another agent's payments
// from here — no agent id is ever sent from the client.
const AgentPaymentsPanel: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState<PaymentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Payment | null>(null);
  // The payment whose invoice PDF is open in the viewer.
  const [invoiceFor, setInvoiceFor] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await paymentService.getMyPayments({ status, page, limit: PAGE_SIZE });
      setPayments(response.data);
      setPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const columns: DataTableColumn<Payment>[] = [
    {
      key: 'date',
      header: 'Date',
      nowrap: true,
      render: (payment) => (
        <span className="text-muted">{new Date(payment.submittedAt).toLocaleDateString()}</span>
      ),
    },
    { key: 'plan', header: 'Plan', render: (payment) => payment.planNameSnapshot },
    {
      key: 'amount',
      header: 'Amount',
      nowrap: true,
      render: (payment) => formatAmount(payment.amount, payment.currency),
    },
    {
      key: 'transaction',
      header: 'Transaction',
      hideBelow: 'md',
      render: (payment) => <code className="small">{payment.transactionNumber}</code>,
    },
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (payment) => (
        <>
          <PaymentStatusBadge status={payment.status} />
          {payment.status === 'rejected' && payment.rejectionReason && (
            <small className="d-block text-danger">{payment.rejectionReason}</small>
          )}
        </>
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
        <DataTable<Payment>
          columns={columns}
          rows={payments}
          rowKey={(payment) => payment._id}
          title="My Payments"
          loading={loading}
          toolbar={(
            <Select
              options={STATUS_OPTIONS}
              value={status}
              size="sm"
              aria-label="Filter by status"
              onChange={(event) => {
                setStatus(event.target.value as PaymentStatus | 'all');
                setPage(1);
              }}
            />
          )}
          pagination={{
            page, pages, total, limit: PAGE_SIZE, onChange: setPage, noun: 'payments',
          }}
          emptyState={{
            icon: 'fas fa-receipt',
            title: 'No payments yet',
            description: 'Payments appear here once you request a plan and submit your transfer details.',
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

export default AgentPaymentsPanel;
