import api from './api';
import {
  type AgentPackageListResponse,
  type PackageDetailResponse,
  type PackageFilters,
  type PackageFormValues,
  type PackageImageUploadResponse,
} from '../types/package';

export const packageService = {
  // --- Agent-owned packages -------------------------------------------------

  // The agent's own packages, including the ones they have switched off.
  getMyPackages: async (filters: PackageFilters = {}): Promise<AgentPackageListResponse> => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/agent/packages?${params.toString()}`);
    return response.data;
  },

  getMyPackageById: async (packageId: string): Promise<PackageDetailResponse> => {
    const response = await api.get(`/agent/packages/${packageId}`);
    return response.data;
  },

  createPackage: async (data: PackageFormValues): Promise<PackageDetailResponse> => {
    const response = await api.post('/agent/packages', data);
    return response.data;
  },

  // Partial update: send only the fields that changed.
  updatePackage: async (
    packageId: string,
    data: Partial<PackageFormValues>
  ): Promise<PackageDetailResponse> => {
    const response = await api.put(`/agent/packages/${packageId}`, data);
    return response.data;
  },

  deletePackage: async (packageId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/agent/packages/${packageId}`);
    return response.data;
  },

  // Convenience wrapper for the list's on/off toggle.
  setPackageActive: async (packageId: string, isActive: boolean): Promise<PackageDetailResponse> => {
    const response = await api.put(`/agent/packages/${packageId}`, { isActive });
    return response.data;
  },

  // Images upload ahead of the package itself, so a slow upload never costs
  // the agent the rest of the form. Returns { url, publicId } per image.
  uploadImages: async (files: File[]): Promise<PackageImageUploadResponse> => {
    const formData = new FormData();
    files.forEach((file, index) => formData.append(`image-${index}`, file));

    const response = await api.post('/agent/packages/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Image uploads routinely outrun the client's 10s default.
      timeout: 60000,
    });
    return response.data;
  },

  // --- Public ---------------------------------------------------------------

  getPublicPackages: async (params: Record<string, string | number> = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.append(key, String(value));
    });

    const response = await api.get(`/packages?${search.toString()}`);
    return response.data;
  },

  getPublicPackageById: async (packageId: string): Promise<PackageDetailResponse> => {
    const response = await api.get(`/packages/${packageId}`);
    return response.data;
  },
};

export default packageService;
