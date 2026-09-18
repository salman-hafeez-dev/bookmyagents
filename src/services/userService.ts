import api from './api';
import { type User } from './authService';

// Types for user operations
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  success: boolean;
  count: number;
  statistics: {
    totalUsers: number;
    activeUsers: number;
    newThisMonth: number;
  };
  data: User[];
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

// User CRUD API functions
export const userService = {
  // Get all users with pagination and filters
  getUsers: async (filters: UserFilters = {}): Promise<UserListResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);

      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new user
  createUser: async (userData: CreateUserData): Promise<User> => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user
  updateUser: async (id: string, userData: UpdateUserData): Promise<User> => {
    try {
      const response = await api.patch(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Admin: set a new password for another account. No current password — that
  // is what makes it an admin reset. The API refuses to target your own
  // account; use profileService.updatePassword for that.
  changePassword: async (
    id: string,
    passwordData: { newPassword: string; confirmPassword: string }
  ): Promise<void> => {
    try {
      await api.put(`/users/${id}/password`, passwordData);
    } catch (error) {
      throw error;
    }
  },

  // Assign subscription to user
  assignSubscription: async (userId: string, subscriptionId: string): Promise<User> => {
    try {
      const response = await api.post(`/users/${userId}/subscription`, { subscriptionId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's current subscription
  getUserSubscription: async (userId: string): Promise<any> => {
    try {
      const response = await api.get(`/users/${userId}/subscription`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cancel user's subscription
  cancelSubscription: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/users/${userId}/subscription`);
    } catch (error) {
      throw error;
    }
  }
};
