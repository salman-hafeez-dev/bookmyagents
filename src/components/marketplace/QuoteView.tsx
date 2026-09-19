import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HeaderThree from '../../layouts/headers/HeaderThree';
import FooterThree from '../../layouts/footers/FooterThree';
import { DetailMessage } from './DetailStates';
import { type Quote, type QuoteAction } from '../../types/quote';
import { quoteService } from '../../services/quoteService';
import { showToast } from '../../utils/toast';
import { formatMoney, formatDate, toWhatsAppNumber } from '../../utils/format';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const STATUS_NOTE: Partial<Record<Quote['status'], { tone: string; icon: string; text: string }>> = {
  accepted: { tone: 'success', icon: 'fa-circle-check', text: 'You accepted this quotation. The agent will be in touch to arrange the details.' },
  declined: { tone: 'secondary', icon: 'fa-circle-xmark', text: 'You declined this quotation.' },
  changes_requested: { tone: 'warning', icon: 'fa-pen', text: 'You asked for changes. The agent will send an updated quotation.' },
  expired: { tone: 'secondary', icon: 'fa-clock', text: 'This quotation has expired. Ask the agent for an updated one.' },
};

// The customer's view of a quotation, reached by link with no account.
//
// Most people asking for a quote are first-time visitors. Making them register
// before they can see a price would lose far more deals than the tidier data
// is worth, so the unguessable link is the whole access control.
const QuoteView: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [changeNote, setChangeNote] = useState('');
  const [showChanges, setShowChanges] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    if (!token) { setState('not-found'); return; }
    try {
      setState('loading');
      const response = await quoteService.getByToken(token);
      setQuote(response.data);
      setState('ready');
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      setState(status === 404 ? 'not-found' : 'error');
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const send = async (action: QuoteAction) => {
    if (!token) return;
    try {
      setIsSending(true);
      const response = await quoteService.respond(
        token,
        action,
        action === 'request_changes' ? changeNote : undefined
      );
      setQuote(response.data);
      setShowChanges(false);
      showToast.success(response.message);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast.error(message || 'We could not record your response. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const renderBody = () => {
    if (state === 'loading') {
      return (
        <div className="container py-4">
          <div className="bma-skeleton mb-3" style={{ height: 120, borderRadius: 14 }} />
          <div className="bma-skeleton mb-3" style={{ height: 260, borderRadius: 14 }} />
          <div className="bma-skeleton" style={{ height: 160, borderRadius: 14 }} />
        </div>
      );
    }

    if (state === 'not-found') {
      return (
        <DetailMessage
          icon="fas fa-link-slash"
          title="This quotation link is not valid"
          description="The link may be incomplete, or the quotation may have been withdrawn. Please ask your agent to send it again."
          exitTo="/search"
          exitLabel="Browse packages"
        />
      );
    }

    if (state === 'error' || !quote) {
      return (
        <DetailMessage
          icon="fas fa-triangle-exclamation"
          title="Something went wrong"
          description="We could not load this quotation just now. Please check your connection and try again."
          onRetry={load}
        />
      );
    }

    const agent = quote.agent;
    const note = STATUS_NOTE[quote.status];
    const canRespond = ['sent', 'viewed'].includes(quote.status);
    const waNumber = toWhatsAppNumber(agent?.whatsapp);

    return (
      <div className="container">
        {/* Agent + reference */}
        <div className="bma-card bma-card-pad mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div className="d-flex align-items-center gap-3">
              {agent?.logo
                ? <img src={agent.logo} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
                : (
                  <span className="d-inline-flex align-items-center justify-content-center bg-light rounded" style={{ width: 56, height: 56 }}>
                    <i className="fas fa-building text-muted"></i>
                  </span>
                )}
              <div>
                <h1 className="h5 mb-1">{agent?.companyName || 'Your travel agent'}</h1>
                <div className="small text-muted">
                  {[agent?.city, agent?.province].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
            <div className="text-md-end">
              <div className="small text-muted">Quotation</div>
              <div className="fw-bold" style={{ color: 'var(--bma-ink)' }}>{quote.reference}</div>
              <div className="small text-muted">Valid until {formatDate(quote.validUntil)}</div>
            </div>
          </div>
        </div>

        {note && (
          <div className={`alert alert-${note.tone} d-flex align-items-start gap-2`}>
            <i className={`fas ${note.icon} mt-1`} aria-hidden="true"></i>
            <div>{note.text}</div>
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8">
            {/* Trip */}
            <div className="bma-card bma-card-pad mb-4">
              <h2 className="bma-section-heading">Your trip</h2>
              <dl className="bma-facts mb-0">
                <div><dt>Prepared for</dt><dd>{quote.customerName}</dd></div>
                {quote.destination && <div><dt>Destination</dt><dd>{quote.destination}</dd></div>}
                {quote.travellers && <div><dt>Travellers</dt><dd>{quote.travellers}</dd></div>}
                {quote.travelStartDate && (
                  <div>
                    <dt>Travel dates</dt>
                    <dd>
                      {formatDate(quote.travelStartDate)}
                      {quote.travelEndDate ? ` – ${formatDate(quote.travelEndDate)}` : ''}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Prices */}
            <div className="bma-card bma-card-pad mb-4">
              <h2 className="bma-section-heading">Services &amp; prices</h2>
              <ul className="bma-quote-lines">
                {quote.lineItems.map((item, index) => (
                  <li key={`${item.description}-${index}`}>
                    <div>
                      <div className="fw-semibold" style={{ color: 'var(--bma-ink)' }}>{item.description}</div>
                      {item.detail && <div className="small text-muted">{item.detail}</div>}
                    </div>
                    <div className="fw-semibold">{formatMoney(item.amount, quote.currency)}</div>
                  </li>
                ))}
              </ul>
              <div className="bma-quote-total mt-3">
                <span>Total</span>
                <strong>{formatMoney(quote.totalAmount, quote.currency)}</strong>
              </div>
            </div>

            {(quote.inclusions?.length > 0 || quote.exclusions?.length > 0) && (
              <div className="bma-card bma-card-pad mb-4">
                <h2 className="bma-section-heading">What&apos;s included</h2>
                <div className="row g-4">
                  {quote.inclusions?.length > 0 && (
                    <div className="col-md-6">
                      <ul className="bma-list bma-list--include">
                        {quote.inclusions.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {quote.exclusions?.length > 0 && (
                    <div className="col-md-6">
                      <div className="small text-muted mb-1">Not included</div>
                      <ul className="bma-list bma-list--exclude">
                        {quote.exclusions.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {quote.notes && (
              <div className="bma-card bma-card-pad mb-4">
                <h2 className="bma-section-heading">Notes</h2>
                <p className="mb-0" style={{ whiteSpace: 'pre-line', color: 'var(--bma-muted)' }}>{quote.notes}</p>
              </div>
            )}

            {quote.termsAndConditions && (
              <div className="bma-card bma-card-pad mb-4">
                <h2 className="bma-section-heading">Terms &amp; conditions</h2>
                <p className="mb-0" style={{ whiteSpace: 'pre-line', color: 'var(--bma-muted)' }}>
                  {quote.termsAndConditions}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="col-lg-4">
            <div className="bma-rail">
              <div className="bma-card bma-card-pad mb-3">
                <div className="small text-muted">Total quotation</div>
                <div className="bma-price-lg mb-3">{formatMoney(quote.totalAmount, quote.currency)}</div>

                {canRespond ? (
                  <>
                    <button
                      type="button"
                      className="bma-action bma-action--whatsapp w-100 mb-2"
                      disabled={isSending}
                      onClick={() => send('accept')}
                    >
                      <i className="fas fa-check" aria-hidden="true"></i>Accept quotation
                    </button>
                    <button
                      type="button"
                      className="bma-action bma-action--quote w-100 mb-2"
                      disabled={isSending}
                      onClick={() => setShowChanges((current) => !current)}
                    >
                      <i className="fas fa-pen" aria-hidden="true"></i>Request changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-link text-muted w-100 p-0"
                      disabled={isSending}
                      onClick={() => send('decline')}
                    >
                      Decline
                    </button>

                    {showChanges && (
                      <div className="mt-3">
                        <label className="form-label" htmlFor="quote-changes">What would you like changed?</label>
                        <textarea
                          id="quote-changes"
                          rows={3}
                          className="form-control mb-2"
                          placeholder="A cheaper hotel, different dates…"
                          value={changeNote}
                          onChange={(event) => setChangeNote(event.target.value)}
                        />
                        <button
                          type="button"
                          className="bma-search-submit w-100"
                          disabled={isSending || !changeNote.trim()}
                          onClick={() => send('request_changes')}
                        >
                          Send request
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="small text-muted mb-0">
                    This quotation is no longer open for a response. Message the agent if you need
                    an updated one.
                  </p>
                )}

                <a
                  className="btn btn-outline-secondary w-100 mt-3"
                  href={quoteService.pdfUrl(token!)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-download me-2"></i>Download PDF
                </a>
              </div>

              <div className="bma-card bma-card-pad">
                <h2 className="bma-section-heading">Questions?</h2>
                <dl className="bma-facts mb-3">
                  {agent?.phone && <div><dt>Phone</dt><dd><a href={`tel:${agent.phone}`}>{agent.phone}</a></dd></div>}
                  {agent?.email && <div><dt>Email</dt><dd><a href={`mailto:${agent.email}`}>{agent.email}</a></dd></div>}
                  {agent?.officeAddress && <div><dt>Office</dt><dd>{agent.officeAddress}</dd></div>}
                </dl>
                {waNumber && (
                  <a
                    className="bma-action bma-action--whatsapp w-100"
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello, I have a question about quotation ${quote.reference}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-whatsapp" aria-hidden="true"></i>Message the agent
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="small text-muted text-center mt-4 mb-0">
          This is a quotation, not an invoice. Prices are held until {formatDate(quote.validUntil)}.
        </p>
      </div>
    );
  };

  return (
    <>
      <HeaderThree />
      <main className="bma-detail bma-page pb-80">
        <div
          className="tg-breadcrumb-spacing-3 include-bg p-relative fix mb-4"
          style={{ backgroundImage: 'url(/assets/img/breadcrumb/breadcrumb-2.jpg)' }}
        >
          <div className="tg-hero-top-shadow"></div>
        </div>
        {renderBody()}
      </main>
      <FooterThree />
    </>
  );
};

export default QuoteView;
