import api from './api';
import {
  type Category,
  type CategoryListResponse,
  type CategoryDetailResponse,
  type CategoryFilters,
  type CategoryStats,
  type CreateCategoryData,
  type UpdateCategoryData,
} from '../types/category';

export const categoryService = {
  // Get active categories (public)
  getCategories: async (filters: CategoryFilters = {}): Promise<CategoryListResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/categories?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a single category by id or slug (public)
  getCategoryById: async (idOrSlug: string): Promise<CategoryDetailResponse> => {
    try {
      const response = await api.get(`/categories/${idOrSlug}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all categories, including inactive (admin)
  getAdminCategories: async (filters: CategoryFilters = {}): Promise<CategoryListResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/admin/categories?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new category (admin)
  createCategory: async (data: CreateCategoryData): Promise<{ success: boolean; data: Category }> => {
    try {
      const response = await api.post('/admin/categories', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a category (admin)
  updateCategory: async (id: string, data: UpdateCategoryData): Promise<{ success: boolean; data: Category }> => {
    try {
      const response = await api.put(`/admin/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get category statistics (admin)
  getCategoryStats: async (id: string): Promise<{ success: boolean; data: CategoryStats }> => {
    try {
      const response = await api.get(`/admin/categories/${id}/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
