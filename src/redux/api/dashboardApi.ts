import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from './axiosBaseQuery';
import { type UserListResponse, type UserFilters } from '../../services/userService';
import { type SubscriptionListResponse, type SubscriptionFilters } from '../../services/subscriptionService';
import { type ServiceResponse, type ServiceFilters, type ServiceStats } from '../../types/service';
import { type BlogListResponse, type BlogFilters, type BlogStats } from '../../types/blog';

/**
 * Read-side cache for admin/agent dashboard listings. Mutations (create/
 * update/delete) keep using the existing service files/modals exactly as
 * before — this only adds a cache in front of the GET calls, invalidated
 * via tags right after each mutation succeeds. See DashboardArea.tsx /
 * AgentDashboard.tsx / BlogManagement.tsx for how it's wired up.
 */
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Users', 'Subscriptions', 'Services', 'ServiceStats', 'Blogs', 'BlogStats'],
  // Listing data can sit in cache for a while and still be trusted — a
  // mutation explicitly invalidates its tag, and refetchOnFocus (wired
  // in store.ts via setupListeners) catches anything changed elsewhere.
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: true,
  endpoints: (builder) => ({
    getUsers: builder.query<UserListResponse, UserFilters>({
      query: (filters) => ({ url: '/users', params: filters }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((u) => ({ type: 'Users' as const, id: u._id })), { type: 'Users' as const, id: 'LIST' }]
          : [{ type: 'Users' as const, id: 'LIST' }],
    }),

    getSubscriptions: builder.query<SubscriptionListResponse, SubscriptionFilters | void>({
      query: (filters) => ({ url: '/subscription', params: filters || {} }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((s) => ({ type: 'Subscriptions' as const, id: s._id })), { type: 'Subscriptions' as const, id: 'LIST' }]
          : [{ type: 'Subscriptions' as const, id: 'LIST' }],
    }),

    getAgentServices: builder.query<ServiceResponse, ServiceFilters>({
      query: (filters) => ({ url: '/services', params: filters }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((s) => ({ type: 'Services' as const, id: s._id ?? '' })), { type: 'Services' as const, id: 'LIST' }]
          : [{ type: 'Services' as const, id: 'LIST' }],
    }),

    getServiceStats: builder.query<ServiceStats, string | undefined>({
      query: (agentId) => ({ url: agentId ? `/services/stats/agent/${agentId}` : '/services/stats' }),
      providesTags: ['ServiceStats'],
    }),

    getAdminBlogs: builder.query<BlogListResponse, BlogFilters>({
      query: (filters) => ({ url: '/admin/blogs', params: filters }),
      providesTags: (result) =>
        result?.data?.blogs
          ? [...result.data.blogs.map((b) => ({ type: 'Blogs' as const, id: b._id })), { type: 'Blogs' as const, id: 'LIST' }]
          : [{ type: 'Blogs' as const, id: 'LIST' }],
    }),

    getAgentBlogs: builder.query<BlogListResponse, BlogFilters>({
      query: (filters) => ({ url: '/users/blogs', params: filters }),
      providesTags: (result) =>
        result?.data?.blogs
          ? [...result.data.blogs.map((b) => ({ type: 'Blogs' as const, id: b._id })), { type: 'Blogs' as const, id: 'LIST' }]
          : [{ type: 'Blogs' as const, id: 'LIST' }],
    }),

    getBlogStats: builder.query<BlogStats, void>({
      query: () => ({ url: '/admin/blogs/stats' }),
      providesTags: ['BlogStats'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetSubscriptionsQuery,
  useGetAgentServicesQuery,
  useGetServiceStatsQuery,
  useGetAdminBlogsQuery,
  useGetAgentBlogsQuery,
  useGetBlogStatsQuery,
} = dashboardApi;
