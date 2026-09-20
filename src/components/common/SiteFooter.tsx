import React from 'react';
import { Link } from 'react-router-dom';
import { useGetSiteSettingsQuery, useGetLegalPagesQuery } from '../../redux/api/siteApi';
import SocialLinks from './SocialLinks';
import {
  addressLines,
  groupBusinessHours,
  mailtoLink,
  telLink,
  whatsAppLink,
} from '../../utils/contact';

interface SiteFooterProps {
  /** Which of the theme's three footer treatments to render. */
  variant?: 'three' | 'five' | 'six';
}

const BACKGROUNDS: Record<string, string> = {
  three: '/assets/img/footer/footer.jpg',
  five: '/assets/img/footer/footer.jpg',
  six: '/assets/img/footer/footer-2.jpg',
};

const LocationIcon = () => (
  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M19.0013 10.0608C19.0013 16.8486 10.3346 22.6668 10.3346 22.6668C10.3346 22.6668 1.66797 16.8486 1.66797 10.0608C1.66797 7.74615 2.58106 5.52634 4.20638 3.88965C5.83169 2.25297 8.03609 1.3335 10.3346 1.3335C12.6332 1.3335 14.8376 2.25297 16.4629 3.88965C18.0882 5.52634 19.0013 7.74615 19.0013 10.0608Z" stroke="white" strokeWidth="1.73333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.3346 12.9699C11.9301 12.9699 13.2235 11.6674 13.2235 10.0608C13.2235 8.45412 11.9301 7.15168 10.3346 7.15168C8.73915 7.15168 7.44575 8.45412 7.44575 10.0608C7.44575 11.6674 8.73915 12.9699 10.3346 12.9699Z" stroke="white" strokeWidth="1.73333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M11.9987 5.60006V12.0001L16.2654 14.1334M22.6654 12.0002C22.6654 17.8912 17.8897 22.6668 11.9987 22.6668C6.10766 22.6668 1.33203 17.8912 1.33203 12.0002C1.33203 6.10912 6.10766 1.3335 11.9987 1.3335C17.8897 1.3335 22.6654 6.10912 22.6654 12.0002Z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// An internal path goes through the router; anything absolute is a real link.
const FooterLink: React.FC<{ to: string; children: React.ReactNode; className?: string }> = ({ to, children, className }) => (
  /^https?:\/\//i.test(to)
    ? <a className={className} href={to} target="_blank" rel="noopener noreferrer">{children}</a>
    : <Link className={className} to={to}>{children}</Link>
);

/**
 * The site's one footer.
 *
 * Every business detail here comes from the admin-controlled site settings and
 * the published legal pages, through the shared siteApi cache — the three
 * FooterThree/Five/Six wrappers all render this, so there is nowhere left for
 * a hardcoded phone number or address to live. Each block is conditional: an
 * unconfigured field renders nothing rather than an empty row.
 */
const SiteFooter: React.FC<SiteFooterProps> = ({ variant = 'three' }) => {
  const { data: settingsResponse, isLoading } = useGetSiteSettingsQuery();
  const { data: legalResponse } = useGetLegalPagesQuery();

  const settings = settingsResponse?.data;
  const legalPages = (legalResponse?.data || []).filter((page) => page.showInFooter);

  const phones = settings?.phones || [];
  const emails = settings?.emails || [];
  const address = addressLines(settings?.address);
  const hours = groupBusinessHours(settings?.businessHours);
  const quickLinks = settings?.footer?.quickLinks || [];
  const waLink = whatsAppLink(settings?.whatsapp);

  const businessName = settings?.businessName || 'Book My Travel Agents';
  const copyright = settings?.footer?.copyrightText
    || `Copyright © ${new Date().getFullYear()} ${businessName} | All Rights Reserved`;

  const hasInfo = address.length > 0 || phones.length > 0 || Boolean(waLink) || emails.length > 0 || hours.length > 0;

  return (
    <footer>
      <div
        className={`tg-footer-area include-bg ${variant === 'three' ? 'tg-footer-space' : 'pt-130'}`}
        style={{ backgroundImage: `url(${BACKGROUNDS[variant] || BACKGROUNDS.three})` }}
      >
        <div className="container">
          <div className={`tg-footer-top ${variant === 'three' ? 'mb-40' : 'pb-40'}`}>
            <div className="row">
              {/* Brand */}
              <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                <div className="tg-footer-widget mb-40">
                  <div className="tg-footer-logo mb-20">
                    <Link to="/">
                      <img src="/assets/img/logo/logo-white.png" alt={businessName} />
                    </Link>
                  </div>
                  {/* While the first request is in flight, a couple of muted
                      placeholder bars keep the footer from jumping. */}
                  {isLoading && !settings ? (
                    <>
                      <p className="mb-10 placeholder-glow"><span className="placeholder col-10"></span></p>
                      <p className="mb-20 placeholder-glow"><span className="placeholder col-7"></span></p>
                    </>
                  ) : (
                    (settings?.footer?.description || settings?.description) && (
                      <p className="mb-20">{settings.footer?.description || settings.description}</p>
                    )
                  )}
                  <SocialLinks links={settings?.socialLinks} />
                </div>
              </div>

              {/* Quick links */}
              {quickLinks.length > 0 && (
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                  <div className={`tg-footer-widget tg-footer-link mb-40${variant === 'three' ? ' ml-80' : ' ml-80'}`}>
                    <h3 className="tg-footer-widget-title mb-25">Quick Links</h3>
                    <ul>
                      {quickLinks.map((link) => (
                        <li key={`${link.label}-${link.url}`}>
                          <FooterLink to={link.url}>{link.label}</FooterLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Contact details */}
              {hasInfo && (
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                  <div className="tg-footer-widget tg-footer-info mb-40">
                    <h3 className="tg-footer-widget-title mb-25">Information</h3>
                    <address className="mb-0">
                      <ul>
                        {address.length > 0 && (
                          <li>
                            {settings?.mapLink ? (
                              <a className="d-flex" href={settings.mapLink} target="_blank" rel="noopener noreferrer">
                                <span className="mr-15"><LocationIcon /></span>
                                <span>{address.map((line, index) => (
                                  <React.Fragment key={line}>{index > 0 && <br />}{line}</React.Fragment>
                                ))}</span>
                              </a>
                            ) : (
                              <span className="d-flex">
                                <span className="mr-15"><LocationIcon /></span>
                                <span>{address.map((line, index) => (
                                  <React.Fragment key={line}>{index > 0 && <br />}{line}</React.Fragment>
                                ))}</span>
                              </span>
                            )}
                          </li>
                        )}

                        {phones.map((phone) => (
                          <li key={phone}>
                            <a className="d-flex" href={telLink(phone) || undefined}>
                              <span className="mr-15">
                                <i className="fa-sharp text-white fa-solid fa-phone" aria-hidden="true"></i>
                              </span>
                              {phone}
                            </a>
                          </li>
                        ))}

                        {waLink && (
                          <li>
                            <a className="d-flex" href={waLink} target="_blank" rel="noopener noreferrer">
                              <span className="mr-15">
                                <i className="fa-brands fa-whatsapp text-white" aria-hidden="true"></i>
                              </span>
                              {settings?.whatsapp}
                            </a>
                          </li>
                        )}

                        {emails.map((email) => (
                          <li key={email}>
                            <a className="d-flex" href={mailtoLink(email) || undefined}>
                              <span className="mr-15">
                                <i className="fa-solid fa-envelope text-white" aria-hidden="true"></i>
                              </span>
                              {email}
                            </a>
                          </li>
                        ))}

                        {hours.length > 0 && (
                          <li className="d-flex">
                            <span className="mr-15"><ClockIcon /></span>
                            <p className="mb-0">
                              {hours.map((entry) => (
                                <React.Fragment key={entry.label}>
                                  {entry.label}: <span className="text-white d-inline-block">{entry.value}</span><br />
                                </React.Fragment>
                              ))}
                            </p>
                          </li>
                        )}
                      </ul>
                    </address>
                  </div>
                </div>
              )}

              {/* Legal pages — published documents only, admin-ordered */}
              <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                <div className="tg-footer-widget tg-footer-link mb-40">
                  <h3 className="tg-footer-widget-title mb-25">Company</h3>
                  <ul>
                    <li><Link to="/contact">Contact Us</Link></li>
                    {legalPages.map((page) => (
                      <li key={page.slug}>
                        <Link to={`/legal/${page.slug}`}>{page.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tg-footer-copyright text-center">
          <span>{copyright}</span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
