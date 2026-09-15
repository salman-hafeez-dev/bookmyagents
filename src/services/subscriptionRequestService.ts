import api from './api';
import {
  type SubscriptionRequestListResponse,
  type SubscriptionRequestResponse,
} from '../types/subscriptionRequest';

export const subscriptionRequestService = {
  // Agent: view own request history (most recent first)
  getMyRequests: async (): Promise<SubscriptionRequestListResponse> => {
    try {
      const response = await api.get('/agent/subscription-requests');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Agent: request a new plan, or change the pending request to a different plan
  requestSubscription: async (subscriptionId: string): Promise<SubscriptionRequestResponse> => {
    try {
      const response = await api.post('/agent/subscription-requests', { subscriptionId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: list requests, defaults to pending only
  getAdminRequests: async (status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'): Promise<SubscriptionRequestListResponse> => {
    try {
      const response = await api.get(`/admin/subscription-requests?status=${status}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: approve — activates the requested subscription for the agent
  approveRequest: async (requestId: string): Promise<SubscriptionRequestResponse> => {
    try {
      const response = await api.post(`/admin/subscription-requests/${requestId}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: reject — agent keeps whatever subscription they already had
  rejectRequest: async (requestId: string, rejectionReason?: string): Promise<SubscriptionRequestResponse> => {
    try {
      const response = await api.post(`/admin/subscription-requests/${requestId}/reject`, { rejectionReason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
