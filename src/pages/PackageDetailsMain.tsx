import PackageDetails from "../components/marketplace/PackageDetails"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"
import useAnalytics from "../utils/useAnalytics";
const GA_MEASUREMENT_ID = 'G-WS5ZX9PL4F';

const PackageDetailsMain = () => {
   useAnalytics(GA_MEASUREMENT_ID);
   return (
      <Wrapper>
         <SEO pageTitle={'Package Details'} />
         <PackageDetails />
      </Wrapper>
   )
}

export default PackageDetailsMain
