import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import HeaderThree from '../../layouts/headers/HeaderThree';
import FooterThree from '../../layouts/footers/FooterThree';
import ContactActions from './ContactActions';
import RequestQuoteModal from './RequestQuoteModal';
import { DetailSkeleton, NotFoundState, ErrorState } from './DetailStates';
import { type TravelPackage } from '../../types/package';
import { packageService } from '../../services/packageService';
import { formatDate, formatMoney, formatPriceType } from '../../utils/format';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

// A package page's job is to answer "is this the trip for me, and who is
// selling it" — then get the customer to the agent in one tap.
const PackageDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [travelPackage, setTravelPackage] = useState<TravelPackage | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [activeImage, setActiveImage] = useState(0);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setState('not-found');
      return;
    }

    try {
      setState('loading');
      const response = await packageService.getPublicPackageById(id);
      setTravelPackage(response.data);
      setActiveImage(0);
      setState('ready');
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      setState(status === 404 ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const renderBody = () => {
    if (state === 'loading') return <DetailSkeleton variant="package" />;
    if (state === 'not-found') return <NotFoundState kind="package" />;
    if (state === 'error' || !travelPackage) return <ErrorState onRetry={load} />;

    const pkg = travelPackage;
    const agent = pkg.agent;
    const category = typeof pkg.category === 'string' ? undefined : pkg.category;
    const images = pkg.images || [];
    const departure = formatDate(pkg.departureDate);
    const returning = formatDate(pkg.returnDate);

    const enquiry = `Hello${agent?.companyName ? ` ${agent.companyName}` : ''}, I am interested in "${pkg.title}" (${formatMoney(pkg.price, pkg.currency)} ${formatPriceType(pkg.priceType)}). Could you share more details?`;

    return (
      <div className="container">
        <nav aria-label="Breadcrumb" className="small mb-3">
          <Link to="/search" className="text-decoration-none">Search</Link>
          <span className="mx-2 text-muted">/</span>
          {category && (
            <>
              <Link
                to={`/search?type=packages&category=${category.slug}`}
                className="text-decoration-none"
              >
                {category.name}
              </Link>
              <span className="mx-2 text-muted">/</span>
            </>
          )}
          <span className="text-muted">{pkg.title}</span>
        </nav>

        {/* Gallery */}
        <div className="mb-4">
          {images.length > 0 ? (
            <>
              <img
                className="bma-gallery-main"
                src={images[activeImage]?.url}
                alt={pkg.title}
              />
              {images.length > 1 && (
                <div className="bma-thumbs" role="tablist" aria-label="Package photos">
                  {images.map((image, index) => (
                    <button
                      key={image.url}
                      type="button"
                      role="tab"
                      aria-selected={index === activeImage}
                      aria-label={`Photo ${index + 1}`}
                      className={`bma-thumb${index === activeImage ? ' is-active' : ''}`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img src={image.url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bma-gallery-empty">
              <i className="fas fa-image fa-2x" aria-hidden="true"></i>
            </div>
          )}
        </div>

        <div className="row g-4">
          {/* Main column */}
          <div className="col-lg-8">
            <div className="bma-card bma-card-pad mb-4">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                {category && <span className="bma-chip">{category.name}</span>}
                {agent?.isVerified && (
                  <span className="bma-verified">
                    <i className="fas fa-circle-check" aria-hidden="true"></i>Verified agent
                  </span>
                )}
              </div>

              <h1 className="h3 mb-3" style={{ color: 'var(--bma-ink)' }}>{pkg.title}</h1>

              <div className="bma-meta">
                <span><i className="fas fa-location-dot"></i>{pkg.departureCity} → {pkg.destination}</span>
                <span><i className="fas fa-clock"></i>{pkg.durationDays} days</span>
                <span><i className="fas fa-plane-departure"></i>{departure || 'On request'}</span>
                {pkg.maxTravelers && (
                  <span><i className="fas fa-users"></i>Up to {pkg.maxTravelers} travellers</span>
                )}
              </div>
            </div>

            <div className="bma-card bma-card-pad mb-4">
              <h2 className="bma-section-heading">About this package</h2>
              <p className="mb-0" style={{ whiteSpace: 'pre-line', color: 'var(--bma-muted)' }}>
                {pkg.description}
              </p>
            </div>

            {(pkg.hotelInfo || pkg.transportInfo) && (
              <div className="bma-card bma-card-pad mb-4">
                <h2 className="bma-section-heading">Accommodation &amp; travel</h2>
                <div className="row g-3">
                  {pkg.hotelInfo && (
                    <div className="col-md-6">
                      <div className="bma-meta mb-1"><span><i className="fas fa-hotel"></i>Hotel</span></div>
                      <p className="mb-0">{pkg.hotelInfo}</p>
                    </div>
                  )}
                  {pkg.transportInfo && (
                    <div className="col-md-6">
                      <div className="bma-meta mb-1"><span><i className="fas fa-bus"></i>Transport</span></div>
                      <p className="mb-0">{pkg.transportInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0) && (
              <div className="bma-card bma-card-pad mb-4">
                <h2 className="bma-section-heading">What&apos;s included</h2>
                <div className="row g-4">
                  {pkg.inclusions?.length > 0 && (
                    <div className="col-md-6">
                      <ul className="bma-list bma-list--include">
                        {pkg.inclusions.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {pkg.exclusions?.length > 0 && (
                    <div className="col-md-6">
                      <div className="small text-muted mb-1">Not included</div>
                      <ul className="bma-list bma-list--exclude">
                        {pkg.exclusions.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {pkg.termsAndConditions && (
              <div className="bma-card bma-card-pad mb-4">
                <h2 className="bma-section-heading">Terms &amp; conditions</h2>
                <p className="mb-0" style={{ whiteSpace: 'pre-line', color: 'var(--bma-muted)' }}>
                  {pkg.termsAndConditions}
                </p>
              </div>
            )}
          </div>

          {/* Booking rail */}
          <div className="col-lg-4">
            <div className="bma-rail">
              <div className="bma-card bma-card-pad mb-3">
                <div className="bma-price-lg">{formatMoney(pkg.price, pkg.currency)}</div>
                <div className="text-muted mb-3">{formatPriceType(pkg.priceType)}</div>

                <dl className="bma-facts mb-4">
                  <div><dt>Departs from</dt><dd>{pkg.departureCity}</dd></div>
                  <div><dt>Destination</dt><dd>{pkg.destination}</dd></div>
                  <div><dt>Duration</dt><dd>{pkg.durationDays} days</dd></div>
                  {departure && <div><dt>Departure</dt><dd>{departure}</dd></div>}
                  {returning && <div><dt>Return</dt><dd>{returning}</dd></div>}
                </dl>

                <ContactActions
                  whatsapp={agent?.whatsapp}
                  phone={agent?.phone}
                  message={enquiry}
                  agentId={agent?._id}
                  packageId={pkg._id}
                  onRequestQuote={() => setQuoteOpen(true)}
                  className="flex-column"
                />
                <p className="small text-muted mt-3 mb-0">
                  You deal directly with the agent. We verify every agent listed here.
                </p>
              </div>

              {agent && (
                <div className="bma-card bma-card-pad">
                  <h2 className="bma-section-heading">Offered by</h2>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    {agent.logo ? (
                      <img
                        src={agent.logo}
                        alt=""
                        style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }}
                      />
                    ) : (
                      <span
                        className="d-inline-flex align-items-center justify-content-center bg-light rounded"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="fas fa-building text-muted"></i>
                      </span>
                    )}
                    <div>
                      <div className="fw-semibold" style={{ color: 'var(--bma-ink)' }}>
                        {agent.companyName || 'Travel agent'}
                      </div>
                      <div className="small text-muted">
                        {agent.city}
                        {typeof agent.yearsExperience === 'number' && agent.yearsExperience > 0
                          && ` · ${agent.yearsExperience} years experience`}
                      </div>
                    </div>
                  </div>
                  <Link to={`/agents/${agent._id}`} className="btn btn-outline-secondary w-100">
                    View agent profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile action bar */}
        <div className="bma-mobile-bar">
          <div className="flex-shrink-0">
            <div className="fw-bold" style={{ color: 'var(--bma-primary)' }}>
              {formatMoney(pkg.price, pkg.currency)}
            </div>
            <div className="small text-muted">{formatPriceType(pkg.priceType)}</div>
          </div>
          <ContactActions
            whatsapp={agent?.whatsapp}
            phone={agent?.phone}
            message={enquiry}
            agentId={agent?._id}
            packageId={pkg._id}
            className="flex-grow-1"
            size="compact"
          />
        </div>

        <RequestQuoteModal
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          packageId={pkg._id}
          agentId={agent?._id}
          agentName={agent?.companyName}
          packageTitle={pkg.title}
        />
      </div>
    );
  };

  return (
    <>
      <HeaderThree />
      <main className={`bma-detail bma-page pb-80${state === 'ready' ? ' bma-detail--has-bar' : ''}`}>
        {/* HeaderThree sits transparently over the page, so inner pages need a
            band of their own to sit below it. */}
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

export default PackageDetails;
