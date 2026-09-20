import Pricing from "../components/pages/pricing"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const PricingMain = () => {
   return (
      <Wrapper>
         <SEO
            pageTitle={'Pricing for Travel Agents'}
            description="Subscription plans for travel agents on Book My Travel Agents. Compare what each plan includes, from marketplace listing to featured placement."
            canonical="/pricing"
         />
         <Pricing />
      </Wrapper>
   )
}

export default PricingMain
