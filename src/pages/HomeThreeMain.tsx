import HomeThree from "../components/homes/home-three"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"
import useAnalytics from "../utils/useAnalytics";
const GA_MEASUREMENT_ID = 'G-WS5ZX9PL4F';

const HomeThreeMain = () => {
   useAnalytics(GA_MEASUREMENT_ID);
   return (
      <Wrapper>
         <SEO
            pageTitle={'Verified Travel Agents for Umrah, Visas & Holidays'}
            description="Compare verified travel agents across Pakistan. Umrah and Hajj packages, study and job visas, domestic tours and international holidays — book with an agent you can check."
            canonical="/"
         />
         <HomeThree />
      </Wrapper>
   )
}

export default HomeThreeMain
