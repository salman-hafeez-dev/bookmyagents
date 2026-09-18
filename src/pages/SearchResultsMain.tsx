import SearchResults from "../components/search"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"
import useAnalytics from "../utils/useAnalytics";
const GA_MEASUREMENT_ID = 'G-WS5ZX9PL4F';

const SearchResultsMain = () => {
   useAnalytics(GA_MEASUREMENT_ID);
   return (
      <Wrapper>
         <SEO pageTitle={'Search'} />
         <SearchResults />
      </Wrapper>
   )
}

export default SearchResultsMain
