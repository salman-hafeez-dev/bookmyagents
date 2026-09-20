import { useParams } from "react-router-dom"
import LegalPage from "../components/legal"
import Wrapper from "../layouts/Wrapper"

interface LegalPageMainProps {
   /** Fixed slug for the /terms and /privacy shortcuts. */
   slug?: string;
   fallbackTitle?: string;
}

/**
 * /legal/:slug, plus the /terms and /privacy shortcuts that pass a slug
 * directly. SEO tags are set inside <LegalPage> from the loaded document.
 */
const LegalPageMain = ({ slug, fallbackTitle }: LegalPageMainProps) => {
   const params = useParams<{ slug: string }>()
   const resolvedSlug = slug || params.slug || ''

   return (
      <Wrapper>
         <LegalPage slug={resolvedSlug} fallbackTitle={fallbackTitle} />
      </Wrapper>
   )
}

export default LegalPageMain
