import Faq from "../components/pages/faq"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const FaqMain = () => {
   return (
      <Wrapper>
         <SEO
            pageTitle={'Frequently Asked Questions'}
            description="Answers to common questions about booking through Book My Travel Agents, how agents are verified, payments and cancellations."
            canonical="/faq"
         />
         <Faq />
      </Wrapper>
   )
}

export default FaqMain
