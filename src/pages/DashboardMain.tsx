import Dashboard from "../components/pages/dashboard"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const DashboardMain = () => {
   return (
      <Wrapper>
         {/* Admin dashboard — private. */}
         <SEO pageTitle={'Dashboard'} noIndex />
         <Dashboard />
      </Wrapper>
   )
}

export default DashboardMain
