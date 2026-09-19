import React, { useCallback, useEffect, useState } from 'react';
import {
  type Quote,
  type QuoteStatus,
  type SendQuoteResponse,
  EDITABLE_STATUSES,
} from '../../../../types/quote';
import { quoteService } from '../../../../services/quoteService';
import { showToast, getErrorMessage } from '../../../../utils/toast';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import { formatMoney, formatDate } from '../../../../utils/format';
import StatTile from '../../../dashboard-admin/StatTile';
import Pager from '../../../dashboard-admin/Pager';
import QuoteBuilder from './QuoteBuilder';
import { QUOTE_STATUS_META } from './quoteMeta';
import SendQuoteModal from './SendQuoteModal';

const TABS: (QuoteStatus | 'all')[] = [
  'all', 'draft', 'sent', 'viewed', 'changes_requested', 'accepted', 'declined', 'expired',
];

// The agent's quotations: what has been sent, what the customer did with it,
// and what it was worth.
const AgentQuotesPanel: React.FC = () => {
  const confirm = useConfirm();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [summary, setSummary] = useState<{ totalQuotes: number; accepted: number; acceptanceRate: number; acceptedValue: number; statusCounts: Partial<Record<QuoteStatus, number>> } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [status, setStatus] = useState<QuoteStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [editing, setEditing] = useState<Quote | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [sendResult, setSendResult] = useState<SendQuoteResponse['data'] | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const response = await quoteService.getMyQuotes({
        status: status === 'all' ? undefined : status,
        page,
        limit: 20,
      });
      setQuotes(response.data);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (error) {
      setHasError(true);
      showToast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (quote: Quote) => {
    try {
      const response = await quoteService.send(quote._id);
      setSendResult(response.data);
      load();
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (quote: Quote) => {
    const confirmed = await confirm({
      title: 'Delete draft',
      description: `Draft ${quote.reference} for ${quote.customerName} will be permanently removed.`,
      icon: 'warning',
      actionLabel: 'Delete',
      actionColor: 'danger',
      dangerZone: true,
    });
    if (!confirmed) return;

    try {
      await quoteService.remove(quote._id);
      showToast.success('Draft deleted');
      load();
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  const tiles = [
    { label: 'Quotations', value: summary?.totalQuotes ?? 0, icon: 'fas fa-file-invoice', tone: 'primary' as const },
    { label: 'Accepted', value: summary?.accepted ?? 0, icon: 'fas fa-handshake', tone: 'success' as const },
    { label: 'Acceptance', value: `${summary?.acceptanceRate ?? 0}%`, icon: 'fas fa-percent', tone: 'info' as const },
    { label: 'Accepted value', value: formatMoney(summary?.acceptedValue ?? 0), icon: 'fas fa-sack-dollar', tone: 'warning' as const },
  ];

  return (
    <>
      <div className="row g-3 mb-4">
        {tiles.map((tile) => (
          <div className="col-xl-3 col-lg-6 col-md-6 col-6" key={tile.label}>
            <StatTile label={tile.label} value={tile.value} icon={tile.icon} tone={tile.tone} />
          </div>
        ))}
      </div>

      <div className="dashboard-card mb-3">
        <div className="card-body">
          <div className="bma-lead-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`bma-lead-tab${status === tab ? ' is-active' : ''}`}
                onClick={() => { setStatus(tab); setPage(1); }}
              >
                {tab === 'all' ? 'All' : QUOTE_STATUS_META[tab].label}
                {tab !== 'all' && (
                  <span className="bma-tab-count">{summary?.statusCounts?.[tab] ?? 0}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        {isLoading ? (
          <div className="card-body">
            {[0, 1, 2].map((index) => (
              <div key={index} className="py-3 border-bottom">
                <div className="bma-skeleton mb-2" style={{ width: '30%', height: 14 }} />
                <div className="bma-skeleton" style={{ width: '20%', height: 12 }} />
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="card-body text-center py-5">
            <i className="fas fa-triangle-exclamation fa-2x text-muted mb-3"></i>
            <h4>We could not load your quotations</h4>
            <button type="button" className="btn btn-primary mt-2" onClick={load}>Try again</button>
          </div>
        ) : quotes.length === 0 ? (
          <div className="card-body text-center py-5">
            <i className="fas fa-file-invoice fa-2x text-muted mb-3"></i>
            <h4>{status === 'all' ? 'No quotations yet' : 'Nothing here'}</h4>
            <p className="text-muted mb-0">
              {status === 'all'
                ? 'Open a quote request in your Leads inbox and choose "Create quotation" to build one.'
                : 'Try another tab.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle mb-0 bma-lead-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Customer</th>
                    <th>Trip</th>
                    <th className="text-end">Total</th>
                    <th>Status</th>
                    <th>Valid until</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote._id}>
                      <td className="small fw-semibold">{quote.reference}</td>
                      <td>
                        <div className="fw-semibold">{quote.customerName}</div>
                        <div className="small text-muted">{quote.customerWhatsapp}</div>
                      </td>
                      <td className="small">
                        {quote.destination || '—'}
                        {quote.travellers ? ` · ${quote.travellers} pax` : ''}
                      </td>
                      <td className="text-end fw-semibold">{formatMoney(quote.totalAmount, quote.currency)}</td>
                      <td>
                        <span className={`bma-lead-badge ${QUOTE_STATUS_META[quote.status].className}`}>
                          {QUOTE_STATUS_META[quote.status].label}
                        </span>
                        {quote.customerResponseNote && (
                          <div className="small text-muted mt-1" style={{ maxWidth: 220 }}>
                            “{quote.customerResponseNote}”
                          </div>
                        )}
                      </td>
                      <td className="small text-muted">{formatDate(quote.validUntil)}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          {EDITABLE_STATUSES.includes(quote.status) && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => { setEditing(quote); setBuilderOpen(true); }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() => handleSend(quote)}
                              >
                                Send
                              </button>
                            </>
                          )}
                          {quote.publicToken && quote.status !== 'draft' && (
                            <a
                              className="btn btn-sm btn-outline-secondary"
                              href={`/quote/${quote.publicToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          )}
                          {quote.status === 'draft' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(quote)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pager
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              noun="quotations"
              onChange={setPage}
            />
          </>
        )}
      </div>

      <QuoteBuilder
        open={builderOpen}
        quote={editing}
        onClose={() => { setBuilderOpen(false); setEditing(null); }}
        onSaved={() => load()}
      />

      <SendQuoteModal result={sendResult} onClose={() => setSendResult(null)} />
    </>
  );
};

export default AgentQuotesPanel;
