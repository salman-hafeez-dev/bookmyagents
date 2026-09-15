export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
  basePrice: number;
  isActive?: boolean;
  verificationRequirements?: string[];
  categoryFields?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CategoryDetailResponse {
  success: boolean;
  data: Category;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
}

export interface CategoryStats {
  totalAgents: number;
  activeAgents: number;
  totalServices: number;
  totalLeads: number;
  avgRating: number;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
  verificationRequirements?: string[];
  categoryFields?: Record<string, unknown>;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;
