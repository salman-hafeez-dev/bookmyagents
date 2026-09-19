import QuoteView from "../components/marketplace/QuoteView"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const QuoteViewMain = () => {
   return (
      <Wrapper>
         <SEO pageTitle={'Your Quotation'} />
         <QuoteView />
      </Wrapper>
   )
}

export default QuoteViewMain
