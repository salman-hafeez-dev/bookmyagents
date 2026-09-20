import AgentDashboard from "../components/pages/agent/AgentDashboard"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const AgentDashboardMain = () => {
   return (
      <Wrapper>
         {/* Agent dashboard — private. */}
         <SEO pageTitle={'Agent Dashboard'} noIndex />
         <AgentDashboard />
      </Wrapper>
   )
}

export default AgentDashboardMain
