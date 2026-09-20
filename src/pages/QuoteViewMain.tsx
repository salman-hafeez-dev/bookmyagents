import QuoteView from "../components/marketplace/QuoteView"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const QuoteViewMain = () => {
   return (
      <Wrapper>
         {/* Reached only by an unguessable link sent over WhatsApp. It shows a
             real customer’s name, phone number and prices, so it must never be indexed. */}
         <SEO pageTitle={'Your Quotation'} noIndex />
         <QuoteView />
      </Wrapper>
   )
}

export default QuoteViewMain
