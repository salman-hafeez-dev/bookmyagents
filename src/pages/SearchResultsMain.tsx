import SearchResults from "../components/search"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"
import useAnalytics from "../utils/useAnalytics";
const GA_MEASUREMENT_ID = 'G-WS5ZX9PL4F';

const SearchResultsMain = () => {
   useAnalytics(GA_MEASUREMENT_ID);
   return (
      <Wrapper>
         <SEO
            pageTitle={'Find a Travel Agent'}
            description="Search verified travel agents and packages by destination, departure city and service. Compare prices, ratings and itineraries in one place."
            canonical="/search"
         />
         <SearchResults />
      </Wrapper>
   )
}

export default SearchResultsMain
