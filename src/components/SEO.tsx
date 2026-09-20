import { Helmet } from "react-helmet-async";
import ErrorBoundary from "../ui/ErrorBoundary";

interface SEOProps {
  pageTitle: string;
  /** Meta description. Falls back to the site-wide blurb. */
  description?: string;
  /**
   * Canonical path or absolute URL, e.g. "/contact". Resolved against the
   * current origin so it works on localhost, preview and production alike.
   */
  canonical?: string;
  /**
   * The site has historically been noindex across the board while it was
   * being built, so that stays the default. The public content pages
   * (contact, terms, privacy) pass `noIndex={false}` to opt in to indexing.
   */
  noIndex?: boolean;
  /** Optional site name override, so admin-controlled branding can drive it. */
  siteName?: string;
}

const DEFAULT_SITE_NAME = "Book My Travel Agents";
const DEFAULT_DESCRIPTION = "Book My Travel Agents";

const SEO = ({
  pageTitle,
  description,
  canonical,
  noIndex = true,
  siteName = DEFAULT_SITE_NAME,
}: SEOProps) => {
  const title = `${pageTitle} ${siteName}`.trim();
  const metaDescription = description || DEFAULT_DESCRIPTION;

  const canonicalUrl = canonical
    ? (/^https?:\/\//i.test(canonical)
      ? canonical
      : `${typeof window !== "undefined" ? window.location.origin : ""}${canonical.startsWith("/") ? canonical : `/${canonical}`}`)
    : undefined;

  return (
    <ErrorBoundary>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <meta name="robots" content={noIndex ? "noindex, follow" : "index, follow"} />
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Social previews, driven by the same title/description so there is
            one place to change a page's metadata. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDescription} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDescription} />

        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      </Helmet>
    </ErrorBoundary>
  );
};

export default SEO;
