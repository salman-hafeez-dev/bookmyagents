import api from './api';
import {
  type AdminReviewListResponse,
  type Review,
  type ReviewEligibility,
  type ReviewInput,
  type ReviewListResponse,
  type ReviewStatus,
} from '../types/review';

export const reviewService = {
  // --- Public ---------------------------------------------------------------

  getAgentReviews: async (agentId: string, page = 1, limit = 10): Promise<ReviewListResponse> => {
    const response = await api.get(`/agents/${agentId}/reviews?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Tells the profile page what to render before the customer types anything:
  // a form, their existing review, or why they cannot review yet.
  getEligibility: async (agentId: string): Promise<{ success: boolean; data: ReviewEligibility }> => {
    const response = await api.get(`/agents/${agentId}/reviews/eligibility`);
    return response.data;
  },

  submit: async (agentId: string, input: ReviewInput): Promise<{ success: boolean; message: string; data: Review }> => {
    const response = await api.post(`/agents/${agentId}/reviews`, input);
    return response.data;
  },

  update: async (reviewId: string, input: ReviewInput): Promise<{ success: boolean; message: string; data: Review }> => {
    const response = await api.put(`/reviews/${reviewId}`, input);
    return response.data;
  },

  remove: async (reviewId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // --- Agent ----------------------------------------------------------------

  // The calling agent's own reviews. Approved only — an agent who could see a
  // pending review could lean on the customer before it is ever published.
  getMyReviews: async (page = 1, limit = 10): Promise<ReviewListResponse> => {
    const response = await api.get(`/agent/reviews?page=${page}&limit=${limit}`);
    return response.data;
  },

  // --- Admin ----------------------------------------------------------------

  getQueue: async (
    filters: { status?: ReviewStatus | 'all'; agentId?: string; page?: number; limit?: number } = {}
  ): Promise<AdminReviewListResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/admin/reviews?${params.toString()}`);
    return response.data;
  },

  moderate: async (
    reviewId: string,
    payload: { status: Exclude<ReviewStatus, 'pending'>; rejectionReason?: string; adminNotes?: string }
  ) => {
    const response = await api.post(`/admin/reviews/${reviewId}/moderate`, payload);
    return response.data;
  },
};

export default reviewService;
