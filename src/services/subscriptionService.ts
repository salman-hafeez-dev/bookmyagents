import api from './api';

// Types for subscription
export interface Subscription {
  _id: string;
  name: string;
  price: number;
  features: string[];
  description?: string;
  duration?: string;
  isPopular?: boolean;
  categoryLimit?: number; // how many service Categories an agent on this plan may select
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionListResponse {
  data: Subscription[];
  total: number;
  page: number;
  limit: number;
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Subscription API functions
export const subscriptionService = {
  // Get all subscriptions with pagination and filters
  getSubscriptions: async (filters: SubscriptionFilters = {}): Promise<SubscriptionListResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

      const response = await api.get(`/subscription?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get subscription by ID
  getSubscriptionById: async (id: string): Promise<Subscription> => {
    try {
      const response = await api.get(`/subscription/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new subscription
  createSubscription: async (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> => {
    try {
      const response = await api.post('/subscription', subscriptionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update subscription
  updateSubscription: async (subscriptionData: Partial<Omit<Subscription, 'createdAt' | 'updatedAt'>>): Promise<Subscription> => {
    try {
      const response = await api.patch(`/subscription`, subscriptionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete subscription
  deleteSubscription: async (id: string): Promise<void> => {
    try {
      await api.delete(`/subscription/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Get subscription statistics
  getSubscriptionStats: async (): Promise<{ totalSubscriptions: number; averagePrice: number; mostPopular: string }> => {
    try {
      const response = await api.get('/subscription/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
