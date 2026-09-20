import React from 'react';
import { Link } from 'react-router-dom';
import { useGetLegalPageQuery, useGetLegalPagesQuery } from '../../redux/api/siteApi';
import { Skeleton } from '../dashboard-admin/Skeleton';

interface LegalPageAreaProps {
  slug: string;
  /** Lifted to the page shell so <SEO> can use the real title/description. */
  onLoaded?: (page: { title: string; metaTitle?: string; metaDescription?: string; excerpt?: string }) => void;
}

/**
 * Renders any published legal document by slug — terms, privacy, refunds,
 * cookies, whatever an admin adds next. There is no per-document code: the
 * content is admin-authored HTML (sanitised server-side on save) and the page
 * only supplies the document layout around it.
 */
const LegalPageArea: React.FC<LegalPageAreaProps> = ({ slug, onLoaded }) => {
  const { data, isLoading, isError, error, refetch } = useGetLegalPageQuery(slug);
  const { data: listResponse } = useGetLegalPagesQuery();

  const page = data?.data;
  const otherPages = (listResponse?.data || []).filter((entry) => entry.slug !== slug);
  const notFound = (error as { status?: number } | undefined)?.status === 404;

  React.useEffect(() => {
    if (page) onLoaded?.(page);
  }, [page, onLoaded]);

  if (isLoading && !page) {
    return (
      <div className="tg-legal-area pt-100 pb-100">
        <div className="container">
          <div className="tg-legal-document">
            <Skeleton height={28} width="45%" />
            <div className="mt-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="mb-3">
                  <Skeleton height={12} width={index % 3 === 2 ? '70%' : '100%'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="tg-legal-area pt-100 pb-100">
        <div className="container">
          <div className="tg-legal-document text-center">
            <h1 className="mb-15">{notFound ? 'Page not available' : 'Something went wrong'}</h1>
            <p className="mb-25">
              {notFound
                ? 'This page hasn’t been published yet. Please check back soon, or get in touch if you need this information now.'
                : 'We couldn’t load this page just now. Please try again in a moment.'}
            </p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              {!notFound && (
                <button type="button" className="tg-btn" onClick={() => refetch()}>Try again</button>
              )}
              <Link className="tg-btn" to="/contact">Contact us</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const updated = page.updatedAt || page.publishedAt;

  return (
    <div className="tg-legal-area pt-100 pb-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <article className="tg-legal-document">
              <header className="tg-legal-header mb-30">
                <h1 className="mb-10">{page.title}</h1>
                {page.excerpt && <p className="tg-legal-excerpt mb-10">{page.excerpt}</p>}
                {updated && (
                  <p className="tg-legal-meta mb-0">
                    Last updated{' '}
                    <time dateTime={new Date(updated).toISOString()}>
                      {new Date(updated).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </time>
                  </p>
                )}
              </header>

              {/* Admin-authored content. Scrubbed of scripts and inline
                  handlers on the way into the database — see
                  lib/sanitizeHtml.ts in the API. */}
              <div
                className="tg-legal-content"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />

              {otherPages.length > 0 && (
                <nav className="tg-legal-related mt-50" aria-label="Other policies">
                  <h2 className="h5 mb-15">Related pages</h2>
                  <ul className="list-unstyled mb-0 d-flex flex-wrap gap-3">
                    {otherPages.map((entry) => (
                      <li key={entry.slug}>
                        <Link to={`/legal/${entry.slug}`}>{entry.title}</Link>
                      </li>
                    ))}
                    <li><Link to="/contact">Contact Us</Link></li>
                  </ul>
                </nav>
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPageArea;
