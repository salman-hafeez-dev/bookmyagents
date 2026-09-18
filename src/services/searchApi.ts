import api from './api';
import {
  type AgentResult,
  type PackageResult,
  type SearchParams,
  type SearchResponse,
} from '../types/search';

// Drops empty values so the URL only ever carries filters that are actually
// set — which keeps a shared search link readable and the browser history
// free of `?from=&to=&city=` noise.
export const toQueryString = (params: SearchParams): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  return search.toString();
};

export const fromQueryString = (search: string): SearchParams => {
  const params = new URLSearchParams(search);
  const num = (key: string) => {
    const raw = params.get(key);
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    type: params.get('type') === 'agents' ? 'agents' : 'packages',
    q: params.get('q') || undefined,
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    category: params.get('category') || undefined,
    city: params.get('city') || undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    minDuration: num('minDuration'),
    maxDuration: num('maxDuration'),
    minExperience: num('minExperience'),
    sort: params.get('sort') || undefined,
    page: num('page'),
  };
};

export const searchApi = {
  // One endpoint, two shapes. `type` decides which — see lib/search.ts.
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const response = await api.get(`/search?${toQueryString(params)}`);
    return response.data;
  },

  searchPackages: async (params: Omit<SearchParams, 'type'>): Promise<SearchResponse<PackageResult>> => {
    const response = await api.get(`/search?${toQueryString({ ...params, type: 'packages' })}`);
    return response.data;
  },

  searchAgents: async (params: Omit<SearchParams, 'type'>): Promise<SearchResponse<AgentResult>> => {
    const response = await api.get(`/search?${toQueryString({ ...params, type: 'agents' })}`);
    return response.data;
  },
};

export default searchApi;
