import FooterSix from "../../../layouts/footers/FooterSix"
import HeaderThree from "../../../layouts/headers/HeaderThree"
import BreadCrumb from "../../common/BreadCrumb"
import AboutArea from "./AboutArea"
import Choose from "./Choose"
// import Cta from "./Cta"

const About = () => {
   return (
      <>
         <HeaderThree />
         <main>
            <BreadCrumb title="About Us" sub_title="About Us" />
            <AboutArea />
            <Choose />
            {/* <Cta /> */}
         </main>
         <FooterSix />
      </>
   )
}

export default About
