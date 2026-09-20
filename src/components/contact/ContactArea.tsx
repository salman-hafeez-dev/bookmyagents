import React from 'react';
import ContactForm from "../forms/ContactForm";
import SocialLinks from "../common/SocialLinks";
import { useGetSiteSettingsQuery } from "../../redux/api/siteApi";
import { CardSkeleton } from "../dashboard-admin/Skeleton";
import {
   addressLines,
   groupBusinessHours,
   mailtoLink,
   telLink,
   whatsAppLink,
} from "../../utils/contact";

/**
 * The public contact page.
 *
 * Nothing here is hardcoded: the phone numbers, WhatsApp, emails, address,
 * opening hours, map and social links all come from the admin-controlled site
 * settings, over the same cached query the footer uses — so opening this page
 * costs no extra request. Every block is conditional, so a business that has
 * not configured (say) WhatsApp simply doesn't get a WhatsApp button.
 */
const ContactArea = () => {
   const { data, isLoading, isError, refetch } = useGetSiteSettingsQuery();
   const settings = data?.data;

   const phones = settings?.phones || [];
   const emails = settings?.emails || [];
   const address = addressLines(settings?.address);
   const hours = groupBusinessHours(settings?.businessHours);
   const waLink = whatsAppLink(
      settings?.whatsapp,
      `Hello ${settings?.businessName || ''}, I would like to know more about your services.`.trim(),
   );
   const primaryPhone = phones[0];
   const contactPage = settings?.contactPage;

   if (isLoading && !settings) {
      return (
         <div className="tg-contact-area pt-130 pb-100 p-relative z-index-1">
            <div className="container">
               <CardSkeleton count={2} />
            </div>
         </div>
      );
   }

   if (isError && !settings) {
      return (
         <div className="tg-contact-area pt-130 pb-100 p-relative z-index-1">
            <div className="container text-center">
               <h1 className="tg-contact-title mb-15">Contact Us</h1>
               <p className="mb-25">
                  We couldn&apos;t load our contact details just now. Please try again in a moment.
               </p>
               <button type="button" className="tg-btn" onClick={() => refetch()}>Try again</button>
            </div>
         </div>
      );
   }

   const hasInfo = address.length > 0 || phones.length > 0 || emails.length > 0 || Boolean(waLink) || hours.length > 0;

   return (
      <div className="tg-contact-area pt-130 p-relative z-index-1 pb-100">
         <img className="tg-team-shape-2 d-none d-md-block" src="/assets/img/banner/banner-2/shape.png" alt="" />
         <div className="container">
            <div className="row align-items-start">
               {/* Contact information */}
               <div className="col-lg-5">
                  <section className="tg-team-details-contant tg-contact-info-wrap mb-30" aria-labelledby="contact-info-heading">
                     <h6 className="mb-15" id="contact-info-heading">
                        {contactPage?.infoHeading || 'Information'}
                     </h6>
                     {(contactPage?.infoText || settings?.description) && (
                        <p className="mb-25">{contactPage?.infoText || settings?.description}</p>
                     )}

                     {hasInfo && (
                        <div className="tg-team-details-contact-info mb-35">
                           <address className="tg-team-details-contact mb-0">
                              {phones.map((phone) => (
                                 <div className="item" key={phone}>
                                    <span>Phone :</span>
                                    <a href={telLink(phone) || undefined}>{phone}</a>
                                 </div>
                              ))}
                              {settings?.whatsapp && waLink && (
                                 <div className="item">
                                    <span>WhatsApp :</span>
                                    <a href={waLink} target="_blank" rel="noopener noreferrer">{settings.whatsapp}</a>
                                 </div>
                              )}
                              {emails.map((email) => (
                                 <div className="item" key={email}>
                                    <span>E-mail :</span>
                                    <a href={mailtoLink(email) || undefined}>{email}</a>
                                 </div>
                              ))}
                              {address.length > 0 && (
                                 <div className="item">
                                    <span>Address :</span>
                                    {settings?.mapLink ? (
                                       <a href={settings.mapLink} target="_blank" rel="noopener noreferrer">
                                          {address.join(', ')}
                                       </a>
                                    ) : (
                                       <span>{address.join(', ')}</span>
                                    )}
                                 </div>
                              )}
                           </address>
                        </div>
                     )}

                     {/* Business hours */}
                     {hours.length > 0 && (
                        <div className="tg-team-details-contact-info mb-35">
                           <h6 className="mb-15">Business Hours</h6>
                           <dl className="row mb-0">
                              {hours.map((entry) => (
                                 <React.Fragment key={entry.label}>
                                    <dt className="col-6 fw-normal">{entry.label}</dt>
                                    <dd className="col-6 mb-1">{entry.value}</dd>
                                 </React.Fragment>
                              ))}
                           </dl>
                        </div>
                     )}

                     {/* Quick actions — same buttons the marketplace uses */}
                     {(waLink || primaryPhone || emails[0]) && (
                        <div className="d-flex flex-wrap gap-2 mb-35">
                           {waLink && (
                              <a className="bma-action bma-action--whatsapp" href={waLink} target="_blank" rel="noopener noreferrer">
                                 <i className="fab fa-whatsapp" aria-hidden="true"></i>
                                 WhatsApp us
                              </a>
                           )}
                           {primaryPhone && (
                              <a className="bma-action bma-action--call" href={telLink(primaryPhone) || undefined}>
                                 <i className="fas fa-phone" aria-hidden="true"></i>
                                 Call us
                              </a>
                           )}
                           {emails[0] && (
                              <a className="bma-action" href={mailtoLink(emails[0]) || undefined}>
                                 <i className="fas fa-envelope" aria-hidden="true"></i>
                                 Email us
                              </a>
                           )}
                        </div>
                     )}

                     {(settings?.socialLinks?.length ?? 0) > 0 && (
                        <div className="mb-35">
                           <h6 className="mb-15">Follow us</h6>
                           <SocialLinks links={settings?.socialLinks} className="tg-contact-social d-flex gap-3" />
                        </div>
                     )}

                     {settings?.mapEmbedUrl && (
                        <div className="tg-contact-map h-100">
                           <iframe
                              src={settings.mapEmbedUrl}
                              title={`${settings.businessName} location`}
                              width="600"
                              height="450"
                              style={{ border: "0", maxWidth: "100%" }}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                           ></iframe>
                        </div>
                     )}
                  </section>
               </div>

               {/* Message form */}
               <div className="col-lg-7">
                  <div className="tg-contact-content-wrap ml-40 mb-30">
                     <h1 className="tg-contact-title mb-15">
                        {contactPage?.heading || `Contact ${settings?.businessName || 'us'}`}
                     </h1>
                     {(contactPage?.subheading || settings?.tagline) && (
                        <p className="mb-30">{contactPage?.subheading || settings?.tagline}</p>
                     )}

                     {contactPage?.formEnabled === false ? (
                        // The admin has switched the form off — point people at
                        // the channels that are configured instead of showing
                        // a dead form.
                        <p className="mb-0">
                           {contactPage?.formNote
                              || 'Please reach us using the contact details on this page and we will get back to you.'}
                        </p>
                     ) : (
                        <div className="tg-contact-form tg-tour-about-review-form">
                           {contactPage?.formNote && <p className="mb-25">{contactPage.formNote}</p>}
                           <ContactForm />
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ContactArea;
