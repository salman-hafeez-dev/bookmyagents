import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from './axiosBaseQuery';
import { type SiteSettingsResponse } from '../../types/siteSettings';
import { type LegalPageListResponse, type LegalPageResponse } from '../../types/legalPage';

/**
 * The public site's content cache: business/contact details and legal pages.
 *
 * Separate from dashboardApi on purpose. Dashboard listings change constantly
 * and refetch on window focus; this data is edited a few times a year and is
 * read by the footer on *every* page, so it is cached hard and left alone:
 *
 *   first render  -> one request per resource
 *   every other component/page -> served from cache, no request
 *
 * An admin save invalidates the matching tag (see SiteSettingsManagement /
 * LegalPagesManagement), so the dashboard reflects the change immediately.
 * Public visitors pick it up on their next session — refetchOnReconnect is
 * left on so a returning tab is not stuck on a stale copy forever.
 */
export const siteApi = createApi({
  reducerPath: 'siteApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SiteSettings', 'LegalPages'],
  // An hour in cache, and no refetch just because a component remounted or
  // the window regained focus — the footer mounts on every route change.
  keepUnusedDataFor: 3600,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getSiteSettings: builder.query<SiteSettingsResponse, void>({
      query: () => ({ url: '/site-settings' }),
      providesTags: ['SiteSettings'],
    }),

    // Published pages without their bodies — what the footer links off.
    getLegalPages: builder.query<LegalPageListResponse, void>({
      query: () => ({ url: '/legal-pages' }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((page) => ({ type: 'LegalPages' as const, id: page.slug })), { type: 'LegalPages' as const, id: 'LIST' }]
          : [{ type: 'LegalPages' as const, id: 'LIST' }],
    }),

    getLegalPage: builder.query<LegalPageResponse, string>({
      query: (slug) => ({ url: `/legal-pages/${slug}` }),
      providesTags: (_result, _error, slug) => [{ type: 'LegalPages' as const, id: slug }],
    }),
  }),
});

export const {
  useGetSiteSettingsQuery,
  useGetLegalPagesQuery,
  useGetLegalPageQuery,
} = siteApi;
