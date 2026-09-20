import Login from "../components/pages/login"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const LogInMain = () => {
   return (
      <Wrapper>
         {/* Auth screen — no search value, and duplicate-thin content. */}
         <SEO pageTitle={'LogIn'} noIndex />
         <Login />
      </Wrapper>
   )
}

export default LogInMain
