import AgentProfile from "../components/marketplace/AgentProfile"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"
import useAnalytics from "../utils/useAnalytics";
const GA_MEASUREMENT_ID = 'G-WS5ZX9PL4F';

const AgentProfileMain = () => {
   useAnalytics(GA_MEASUREMENT_ID);
   return (
      <Wrapper>
         <SEO pageTitle={'Agent Profile'} />
         <AgentProfile />
      </Wrapper>
   )
}

export default AgentProfileMain
