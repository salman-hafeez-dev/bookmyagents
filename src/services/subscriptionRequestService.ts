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

  // Requesting a plan now goes through paymentService.submitPlanPayment():
  // the request and its manual payment are submitted together as multipart.
  // A JSON-only request endpoint no longer exists.

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
