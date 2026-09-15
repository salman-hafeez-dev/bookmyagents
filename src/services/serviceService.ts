import api from './api';
import { 
  type Service, 
  type CreateServiceData, 
  type UpdateServiceData, 
  type ServiceFilters, 
  type ServiceResponse,
  type ServiceStats 
} from '../types/service';

export const serviceService = {
  // Create a new service
  createService: async (serviceData: CreateServiceData): Promise<Service> => {
    try {
      const response = await api.post('/services', serviceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all services with filters
  getServices: async (filters: ServiceFilters = {}): Promise<ServiceResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

      const response = await api.get(`/services?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get services by agent
  getAgentServices: async (filters: ServiceFilters = {}): Promise<ServiceResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

      const response = await api.get(`/services?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a single service by ID
  getService: async (serviceId: string): Promise<Service> => {
    try {
      const response = await api.get(`/services/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a service
  updateService: async (serviceData: UpdateServiceData): Promise<Service> => {
    try {
      const { _id, ...updateData } = serviceData;
      const response = await api.put(`/services/${_id}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a service
  deleteService: async (serviceId: string): Promise<void> => {
    try {
      await api.delete(`/services/${serviceId}`);
    } catch (error) {
      throw error;
    }
  },

  // Get service statistics
  getServiceStats: async (agentId?: string): Promise<ServiceStats> => {
    try {
      const url = agentId ? `/services/stats/agent/${agentId}` : '/services/stats';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload service images
  uploadServiceImages: async (files: File[]): Promise<string[]> => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });

      const response = await api.post('/services/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data?.urls || response.data.urls || [];
    } catch (error) {
      throw error;
    }
  },

  // Delete service images
  deleteServiceImages: async (imageUrls: string[]): Promise<void> => {
    try {
      await api.delete('/services/delete-images', {
        data: { urls: imageUrls }
      });
    } catch (error) {
      throw error;
    }
  }
};
