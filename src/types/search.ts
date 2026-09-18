import { type Category } from './category';

export type SearchType = 'packages' | 'agents';

export interface SearchAgentSummary {
  _id: string;
  userId: string;
  companyName?: string;
  city?: string;
  province?: string;
  logo?: string;
  yearsExperience?: number;
  isVerified: boolean;
}

// A package result: the offer, with the agent selling it attached.
export interface PackageResult {
  _id: string;
  title: string;
  description: string;
  destination: string;
  departureCity: string;
  durationDays: number;
  departureDate?: string;
  returnDate?: string;
  price: number;
  currency: string;
  priceType: 'per_person' | 'per_group';
  images: { url: string }[];
  category: Pick<Category, '_id' | 'name' | 'slug' | 'icon'>;
  agent: SearchAgentSummary;
  createdAt: string;
}

// An agent result: the agency, with what they sell rolled up.
export interface AgentResult {
  _id: string;
  userId: string;
  companyName?: string;
  city?: string;
  province?: string;
  logo?: string;
  coverImage?: string;
  yearsExperience?: number;
  companyDescription?: string;
  areaServed?: string[];
  profileCompletionPercentage: number;
  isVerified: boolean;
  packageCount: number;
  startingPrice?: number;
  topPackages: {
    _id: string;
    title: string;
    price: number;
    currency: string;
    durationDays: number;
    destination: string;
    departureCity: string;
  }[];
  categories: Pick<Category, '_id' | 'name' | 'slug' | 'icon'>[];
}

export type SearchResult = PackageResult | AgentResult;

// Everything the search bar and filter sidebar can set. Kept flat so it maps
// straight onto the URL query string.
export interface SearchParams {
  type?: SearchType;
  q?: string;
  from?: string;
  to?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  minExperience?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface SearchResponse<T = SearchResult> {
  success: boolean;
  type: SearchType;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  query: SearchParams & { type: SearchType };
}

export const isAgentResult = (result: SearchResult): result is AgentResult =>
  'packageCount' in result;
