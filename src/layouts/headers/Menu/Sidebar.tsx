import { Link } from "react-router-dom";
import SocialLinks from "../../../components/common/SocialLinks";
import { useGetSiteSettingsQuery } from "../../../redux/api/siteApi";
import { addressLines, mailtoLink, telLink } from "../../../utils/contact";

interface SidebarProps {
   sidebar: boolean;
   setSidebar: (offCanvas: boolean) => void;
}

const Sidebar = ({ sidebar, setSidebar }: SidebarProps) => {
   // Same cached settings the footer and contact page read — opening the menu
   // costs no extra request, and there is no second copy of the business
   // details to fall out of date.
   const { data } = useGetSiteSettingsQuery();
   const settings = data?.data;

   const address = addressLines(settings?.address);
   const phones = settings?.phones || [];
   const emails = settings?.emails || [];

   return (
      <>
         <div className={`offCanvas__info ${sidebar ? "active" : ""}`}>
            <div className="offCanvas__close-icon menu-close">
               <button onClick={() => setSidebar(false)} aria-label="Close menu"><i className="fa-sharp fa-regular fa-xmark"></i></button>
            </div>
            <div className="offCanvas__logo mb-30">
               <Link to="/"><img src="/assets/img/logo/logo-green.png" alt={settings?.businessName || "Logo"} /></Link>
            </div>
            <div className="offCanvas__side-info mb-30">
               {address.length > 0 && (
                  <div className="contact-list mb-30">
                     <h4>Office Address</h4>
                     <p>
                        {address.map((line, index) => (
                           <span key={line}>{index > 0 && <br />}{line}</span>
                        ))}
                     </p>
                  </div>
               )}

               {phones.length > 0 && (
                  <div className="contact-list mb-30">
                     <h4>Phone Number</h4>
                     {phones.map((phone) => (
                        <p key={phone}><a href={telLink(phone) || undefined}>{phone}</a></p>
                     ))}
                  </div>
               )}

               {emails.length > 0 && (
                  <div className="contact-list mb-30">
                     <h4>Email Address</h4>
                     {emails.map((email) => (
                        <p key={email}><a href={mailtoLink(email) || undefined}>{email}</a></p>
                     ))}
                  </div>
               )}
            </div>
            <SocialLinks links={settings?.socialLinks} className="offCanvas__social-icon mt-30" />
         </div>
         <div onClick={() => setSidebar(false)} className={`offCanvas__overly ${sidebar ? "active" : ""}`}></div>
      </>
   )
}

export default Sidebar
