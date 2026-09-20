import SiteFooter from "../../components/common/SiteFooter";

/**
 * Kept as a named entry point so the pages already using this footer stay
 * untouched. All three footer variants now render the one settings-driven
 * SiteFooter — there is no hardcoded business information left in here.
 */
const FooterFive = () => <SiteFooter variant="five" />;

export default FooterFive;
