import Register from "../components/pages/register"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const RegisterMain = () => {
   return (
      <Wrapper>
         {/* Auth screen — no search value, and duplicate-thin content. */}
         <SEO pageTitle={'Register'} noIndex />
         <Register />
      </Wrapper>
   )
}

export default RegisterMain
