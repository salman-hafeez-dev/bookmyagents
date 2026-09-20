import api from './api';
import {
  type LegalPageInput,
  type LegalPageListResponse,
  type LegalPageResponse,
} from '../types/legalPage';

/**
 * Legal page CRUD for the admin dashboard. The public reads (the footer link
 * list and the page bodies) go through redux/api/siteApi.ts so they share one
 * cache across the site.
 */
export const legalPageService = {
  listAdmin: async (params: { status?: string; page?: number; limit?: number } = {}): Promise<LegalPageListResponse> => {
    const response = await api.get('/admin/legal-pages', { params });
    return response.data;
  },

  getAdmin: async (id: string): Promise<LegalPageResponse> => {
    const response = await api.get(`/admin/legal-pages/${id}`);
    return response.data;
  },

  create: async (data: LegalPageInput): Promise<LegalPageResponse> => {
    const response = await api.post('/admin/legal-pages', data);
    return response.data;
  },

  update: async (id: string, data: Partial<LegalPageInput>): Promise<LegalPageResponse> => {
    const response = await api.put(`/admin/legal-pages/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete(`/admin/legal-pages/${id}`);
    return response.data;
  },
};
