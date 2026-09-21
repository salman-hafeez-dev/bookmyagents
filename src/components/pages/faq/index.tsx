import FaqArea from "./FaqArea"
// import Cta from "../pricing/Cta"
import HeaderThree from "../../../layouts/headers/HeaderThree"
import BreadCrumb from "../../common/BreadCrumb"
import FooterThree from "../../../layouts/footers/FooterThree"

const Faq = () => {
   return (
      <>
         <HeaderThree />
         <main>
            <BreadCrumb title="Frequently Asked Question" sub_title="Faq’s" />
            <FaqArea />
            {/* <Cta /> */}
         </main>
         <FooterThree />
      </>
   )
}

export default Faq
