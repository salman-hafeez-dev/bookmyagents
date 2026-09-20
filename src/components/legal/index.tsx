import { useState } from "react";
import FooterFive from "../../layouts/footers/FooterFive";
import HeaderThree from "../../layouts/headers/HeaderThree";
import BreadCrumb from "../common/BreadCrumb";
import SEO from "../SEO";
import LegalPageArea from "./LegalPageArea";
import { useGetLegalPagesQuery } from "../../redux/api/siteApi";

interface LegalPageProps {
   slug: string;
   /** Shown in the breadcrumb before the document itself has loaded. */
   fallbackTitle?: string;
}

/**
 * Shell for every legal document. One component serves /terms, /privacy and
 * /legal/:slug — adding a policy is an admin action, not a code change.
 *
 * SEO lives here rather than in the route file because the title, description
 * and canonical all come from the document the admin wrote.
 */
const LegalPage = ({ slug, fallbackTitle }: LegalPageProps) => {
   const [meta, setMeta] = useState<{ title: string; metaTitle?: string; metaDescription?: string; excerpt?: string } | null>(null);

   // The footer already loaded the published page list, so the real title is
   // usually in cache before this document's own request finishes — use it to
   // avoid a placeholder flashing in the breadcrumb and the tab title.
   const { data: listResponse } = useGetLegalPagesQuery();
   const cachedTitle = listResponse?.data?.find((entry) => entry.slug === slug)?.title;

   const title = meta?.metaTitle || meta?.title || cachedTitle || fallbackTitle || 'Legal';

   return (
      <>
         <SEO
            pageTitle={`${title} ||`}
            description={meta?.metaDescription || meta?.excerpt || `Read the ${title.toLowerCase()} for Book My Travel Agents.`}
            canonical={`/legal/${slug}`}
            noIndex={false}
         />
         <HeaderThree />
         <main>
            <BreadCrumb title={title} sub_title={title} />
            <LegalPageArea slug={slug} onLoaded={setMeta} />
         </main>
         <FooterFive />
      </>
   );
};

export default LegalPage;
