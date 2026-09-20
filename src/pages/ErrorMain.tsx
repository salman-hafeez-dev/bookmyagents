import NotFound from "../components/pages/error"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const ErrorMain = () => {
   return (
      <Wrapper>
         {/* 404 page — must not be indexed. */}
         <SEO pageTitle={'404 ||'} noIndex />
         <NotFound />
      </Wrapper>
   )
}

export default ErrorMain
