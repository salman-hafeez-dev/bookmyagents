import About from "./About"
import Banner from "./Banner"
import Blog from "./Blog"
import Choose from "./Choose"
import CtaThree from "./Cta"
import CtaTwo from "./CtaTwo"
import Location from "./Location"
import Testimonial from "./Testimonial"
// import Cta from "../home-one/Cta"
import HeaderThree from "../../../layouts/headers/HeaderThree"
import BannerFormThree from "../../common/banner-form/BannerFormThree"
import FooterThree from "../../../layouts/footers/FooterThree"
import Listing from "./Listing";

const HomeThree = () => {
   return (
      <>
         <HeaderThree />
         <main>
            <Banner />
            <BannerFormThree />
            <About />
            <Listing />
            {/* <Choose /> */}
            {/* <CtaThree /> */}
            <Location />
            {/* <CtaTwo /> */}
            {/* <Testimonial /> */}
            {/* <Blog /> */}
            {/* <Cta /> */}
         </main>
         <FooterThree />
      </>
   )
}

export default HomeThree
