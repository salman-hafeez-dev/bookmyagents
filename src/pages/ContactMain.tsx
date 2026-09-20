import Contact from "../components/contact"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"
import { useGetSiteSettingsQuery } from "../redux/api/siteApi"

const ContactMain = () => {
   // Reuses the same cached settings query the page and footer already read,
   // so the meta description reflects whatever the admin configured without
   // costing an extra request.
   const { data } = useGetSiteSettingsQuery()
   const settings = data?.data

   return (
      <Wrapper>
         <SEO
            pageTitle={'Contact ||'}
            description={
               settings?.contactPage?.subheading
               || settings?.description
               || `Get in touch with ${settings?.businessName || 'Book My Travel Agents'} by phone, WhatsApp or email.`
            }
            canonical="/contact"
            noIndex={false}
            siteName={settings?.businessName}
         />
         <Contact />
      </Wrapper>
   )
}

export default ContactMain
