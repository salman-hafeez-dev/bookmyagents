import PricingArea from "./PricingArea"
// import Cta from "./Cta"
import HeaderThree from "../../../layouts/headers/HeaderThree"
import BreadCrumb from "../../common/BreadCrumb"
import FooterThree from "../../../layouts/footers/FooterThree"

const Pricing = () => {
  return (
    <>
      <HeaderThree />
      <main>
        <BreadCrumb title="Pricing Plan" sub_title="Pricing Plan" />
        <PricingArea />
        {/* <Cta /> */}
      </main>
      <FooterThree />
    </>
  )
}

export default Pricing
