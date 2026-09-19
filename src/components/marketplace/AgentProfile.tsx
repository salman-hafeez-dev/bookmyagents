import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import HeaderThree from '../../layouts/headers/HeaderThree';
import FooterThree from '../../layouts/footers/FooterThree';
import ContactActions from './ContactActions';
import RequestQuoteModal from './RequestQuoteModal';
import { DetailSkeleton, NotFoundState, ErrorState } from './DetailStates';
import AgentPackageCard from './AgentPackageCard';
import ReviewsTab from './ReviewsTab';
import StarRating from './StarRating';
import { type PublicAgent } from '../../types/publicAgent';
import { agentProfileService } from '../../services/agentProfileService';
import { formatMoney } from '../../utils/format';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const SOCIAL_LINKS = [
  { key: 'facebook', icon: 'fab fa-facebook-f', label: 'Facebook' },
  { key: 'instagram', icon: 'fab fa-instagram', label: 'Instagram' },
  { key: 'linkedin', icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
  { key: 'twitter', icon: 'fab fa-twitter', label: 'Twitter' },
] as const;

// The agency's public shopfront — what the subscription actually buys.
//
// Tabs come from the agent's own categories, never a hardcoded five. An agent
// who upgrades gains a tab automatically, which makes the thing they paid for
// visible on the page itself.
const AgentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [activeTab, setActiveTab] = useState('about');
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [rating, setRating] = useState<{ avgRating: number; reviewCount: number } | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setState('not-found');
      return;
    }

    try {
      setState('loading');
      const response = await agentProfileService.getPublicAgent(id);
      setAgent(response.data);
      setRating({
        avgRating: response.data.avgRating || 0,
        reviewCount: response.data.reviewCount || 0,
      });
      setState('ready');
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      setState(status === 404 ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const tabs = useMemo(() => {
    if (!agent) return [];
    return [
      { key: 'about', label: 'About', count: undefined as number | undefined },
      ...agent.packagesByCategory.map((group) => ({
        key: group.category.slug,
        label: group.category.name,
        count: group.packages.length,
      })),
      { key: 'reviews', label: 'Reviews', count: agent.reviewCount || undefined },
      { key: 'contact', label: 'Contact', count: undefined },
    ];
  }, [agent]);

  // Land on the agent's largest category rather than on About: a customer who
  // arrived from a search wants to see what is for sale.
  useEffect(() => {
    if (!agent) return;
    const busiest = [...agent.packagesByCategory]
      .sort((a, b) => b.packages.length - a.packages.length)[0];
    setActiveTab(busiest && busiest.packages.length > 0 ? busiest.category.slug : 'about');
  }, [agent]);

  const renderBody = () => {
    if (state === 'loading') return <DetailSkeleton variant="agent" />;
    if (state === 'not-found') return <NotFoundState kind="agent" />;
    if (state === 'error' || !agent) return <ErrorState onRetry={load} />;

    const location = [agent.city, agent.province].filter(Boolean).join(', ');
    const enquiry = `Hello${agent.companyName ? ` ${agent.companyName}` : ''}, I found you on Book My Travel Agents and would like to know more about your services.`;
    const activeGroup = agent.packagesByCategory.find((group) => group.category.slug === activeTab);

    return (
      <div className="container">
        <nav aria-label="Breadcrumb" className="small mb-3">
          <Link to="/search?type=agents" className="text-decoration-none">Agents</Link>
          <span className="mx-2 text-muted">/</span>
          <span className="text-muted">{agent.companyName}</span>
        </nav>

        {/* Header */}
        <div className="bma-card overflow-hidden mb-4">
          <div
            className="bma-agent-cover"
            style={agent.coverImage ? { backgroundImage: `url(${agent.coverImage})` } : undefined}
          />

          <div className="bma-agent-head">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
              <div className="bma-agent-identity d-flex align-items-end gap-3">
                {agent.logo ? (
                  <img className="bma-agent-logo" src={agent.logo} alt={agent.companyName} />
                ) : (
                  <div className="bma-agent-logo bma-agent-logo-fallback">
                    <i className="fas fa-building fa-2x" aria-hidden="true"></i>
                  </div>
                )}

                <div className="pb-1">
                  <h1 className="h3 mb-2" style={{ color: 'var(--bma-ink)' }}>
                    {agent.companyName || 'Travel agent'}
                  </h1>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="bma-verified">
                      <i className="fas fa-circle-check" aria-hidden="true"></i>Verified agent
                    </span>
                    {location && <span className="bma-chip"><i className="fas fa-location-dot"></i>{location}</span>}
                    {typeof agent.yearsExperience === 'number' && agent.yearsExperience > 0 && (
                      <span className="bma-chip"><i className="fas fa-award"></i>{agent.yearsExperience} years</span>
                    )}
                    <span className="bma-chip">
                      <i className="fas fa-suitcase-rolling"></i>
                      {agent.packageCount} package{agent.packageCount === 1 ? '' : 's'}
                    </span>
                    {rating && rating.reviewCount > 0 && (
                      <button
                        type="button"
                        className="bma-chip"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActiveTab('reviews')}
                      >
                        <StarRating value={rating.avgRating} size="sm" />
                        {rating.avgRating.toFixed(1)} ({rating.reviewCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bma-agent-actions pb-1">
                {typeof agent.startingPrice === 'number' && (
                  <div className="text-lg-end mb-2">
                    <div className="small text-muted">Packages from</div>
                    <div className="bma-price-lg">{formatMoney(agent.startingPrice)}</div>
                  </div>
                )}
                <ContactActions
                  whatsapp={agent.whatsapp}
                  phone={agent.phone}
                  message={enquiry}
                  agentId={agent._id}
                  onRequestQuote={() => setQuoteOpen(true)}
                  size="compact"
                />
              </div>
            </div>
          </div>

          <div className="px-3 px-md-4">
            <div className="bma-tabs" role="tablist" aria-label="Agent sections">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`bma-tab${activeTab === tab.key ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {tab.count !== undefined && <span className="bma-tab-count">{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab panels */}
        {activeTab === 'about' && (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="bma-card bma-card-pad mb-4">
                <h2 className="bma-section-heading">About {agent.companyName}</h2>
                <p className="mb-0" style={{ whiteSpace: 'pre-line', color: 'var(--bma-muted)' }}>
                  {agent.companyDescription || 'This agent has not added a description yet.'}
                </p>
              </div>

              {agent.servicesOffered && (
                <div className="bma-card bma-card-pad mb-4">
                  <h2 className="bma-section-heading">Services offered</h2>
                  <p className="mb-0" style={{ color: 'var(--bma-muted)' }}>{agent.servicesOffered}</p>
                </div>
              )}

              {agent.areaServed && agent.areaServed.length > 0 && (
                <div className="bma-card bma-card-pad">
                  <h2 className="bma-section-heading">Areas served</h2>
                  <div className="d-flex flex-wrap gap-2">
                    {agent.areaServed.map((area) => (
                      <span key={area} className="bma-chip">{area}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="col-lg-4">
              <div className="bma-card bma-card-pad">
                <h2 className="bma-section-heading">Services on offer</h2>
                <div className="d-flex flex-column gap-2">
                  {agent.packagesByCategory.map((group) => (
                    <button
                      key={group.category._id}
                      type="button"
                      className="bma-chip justify-content-between w-100"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveTab(group.category.slug)}
                    >
                      <span>{group.category.name}</span>
                      <span className="text-muted">{group.packages.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeGroup && (
          activeGroup.packages.length > 0 ? (
            <div className="row g-3">
              {activeGroup.packages.map((item) => (
                <div className="col-xl-4 col-md-6 col-12" key={item._id}>
                  <AgentPackageCard
                    travelPackage={item}
                    categoryName={activeGroup.category.name}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bma-card bma-empty">
              <i className="fas fa-suitcase-rolling fa-2x d-block" aria-hidden="true"></i>
              <h2 className="h5 mb-2" style={{ color: 'var(--bma-ink)' }}>
                No {activeGroup.category.name.toLowerCase()} packages yet
              </h2>
              <p className="mb-0">
                This agent offers {activeGroup.category.name.toLowerCase()} services but has not
                published a package yet. Message them for a tailored quote.
              </p>
            </div>
          )
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab
            agentId={agent._id}
            agentName={agent.companyName}
            onSummaryChange={(summary) => setRating({
              avgRating: summary.avgRating,
              reviewCount: summary.reviewCount,
            })}
          />
        )}

        {activeTab === 'contact' && (
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="bma-card bma-card-pad">
                <h2 className="bma-section-heading">Get in touch</h2>
                <dl className="bma-facts mb-4">
                  {agent.phone && <div><dt>Phone</dt><dd><a href={`tel:${agent.phone}`}>{agent.phone}</a></dd></div>}
                  {agent.whatsapp && <div><dt>WhatsApp</dt><dd>{agent.whatsapp}</dd></div>}
                  {agent.email && <div><dt>Email</dt><dd><a href={`mailto:${agent.email}`}>{agent.email}</a></dd></div>}
                  {agent.website && (
                    <div>
                      <dt>Website</dt>
                      <dd>
                        <a href={agent.website} target="_blank" rel="noopener noreferrer">
                          {agent.website.replace(/^https?:\/\//, '')}
                        </a>
                      </dd>
                    </div>
                  )}
                  {agent.officeAddress && <div><dt>Office</dt><dd>{agent.officeAddress}</dd></div>}
                </dl>

                <ContactActions
                  whatsapp={agent.whatsapp}
                  phone={agent.phone}
                  message={enquiry}
                  agentId={agent._id}
                  onRequestQuote={() => setQuoteOpen(true)}
                />
              </div>
            </div>

            <div className="col-lg-5">
              {agent.socialMedia && Object.values(agent.socialMedia).some(Boolean) && (
                <div className="bma-card bma-card-pad">
                  <h2 className="bma-section-heading">Follow</h2>
                  <div className="d-flex gap-2">
                    {SOCIAL_LINKS.map(({ key, icon, label }) => {
                      const href = agent.socialMedia?.[key];
                      if (!href) return null;
                      return (
                        <a
                          key={key}
                          className="bma-social"
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                        >
                          <i className={icon} aria-hidden="true"></i>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <RequestQuoteModal
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          agentId={agent._id}
          agentName={agent.companyName}
        />
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

export default AgentProfile;
