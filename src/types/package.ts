import { type Category } from './category';

export type PriceType = 'per_person' | 'per_group';

export interface PackageImage {
  url: string;
  // Only returned to the owning agent — the public listing strips it.
  publicId?: string;
}

// The agent summary attached to a package by the public endpoints, so a search
// result can show who is selling without a second request.
export interface PackageAgentSummary {
  _id: string;
  userId: string;
  companyName?: string;
  city?: string;
  province?: string;
  logo?: string;
  yearsExperience?: number;
  isVerified: boolean;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
}

export interface TravelPackage {
  _id: string;
  userId: string;
  // Populated on read, an id string when writing.
  category: Category | string;

  title: string;
  description: string;

  destination: string;
  departureCity: string;
  durationDays: number;
  departureDate?: string;
  returnDate?: string;

  hotelInfo?: string;
  transportInfo?: string;
  inclusions: string[];
  exclusions: string[];

  price: number;
  currency: string;
  priceType: PriceType;
  maxTravelers?: number;

  images: PackageImage[];
  termsAndConditions?: string;

  isActive: boolean;
  viewCount?: number;

  agent?: PackageAgentSummary;
  createdAt: string;
  updatedAt: string;
}

// What the form sends. `category` is always an id here.
export interface PackageFormValues {
  category: string;
  title: string;
  description: string;
  destination: string;
  departureCity: string;
  durationDays: number;
  departureDate?: string;
  returnDate?: string;
  hotelInfo?: string;
  transportInfo?: string;
  inclusions: string[];
  exclusions: string[];
  price: number;
  currency: string;
  priceType: PriceType;
  maxTravelers?: number;
  termsAndConditions?: string;
  isActive: boolean;
  images: PackageImage[];
}

export interface PackageFilters {
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PackagePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Context the dashboard needs to explain why a package is or isn't live.
export interface AgentPackageMeta {
  totalPackages: number;
  activePackages: number;
  maxPackages: number;
  profileStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
  isPubliclyVisible: boolean;
}

export interface AgentPackageListResponse {
  success: boolean;
  data: TravelPackage[];
  pagination: PackagePagination;
  meta: AgentPackageMeta;
}

export interface PackageDetailResponse {
  success: boolean;
  data: TravelPackage;
  message?: string;
}

export interface PackageImageUploadResponse {
  success: boolean;
  message: string;
  data: { url: string; publicId: string }[];
  errors?: string[];
}
