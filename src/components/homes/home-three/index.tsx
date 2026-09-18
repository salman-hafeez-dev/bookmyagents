import About from "./About"
import Banner from "./Banner"
import Location from "./Location"
import HeaderThree from "../../../layouts/headers/HeaderThree"
import FooterThree from "../../../layouts/footers/FooterThree"
import SearchBar from "../../search/SearchBar"
import CategoryCards from "../../search/CategoryCards"
import FeaturedPackages from "./FeaturedPackages"

const HomeThree = () => {
   return (
      <>
         <HeaderThree />
         <main>
            <Banner />
            {/* The plan's homepage question — "what travel service are you
                looking for?" — answered by one search bar and the five
                categories, rather than the template's hotel booking widget. */}
            <SearchBar className="tg-booking-form-space pb-60" />
            <CategoryCards />
            <About />
            <FeaturedPackages />
            <Location />
         </main>
         <FooterThree />
      </>
   )
}

export default HomeThree
