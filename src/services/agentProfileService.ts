import { AxiosError } from 'axios';
import api from './api';
import {
  type AgentProfileResponse,
  type ProgressResponse,
  type DocumentUploadResponse,
  type SubmitForReviewResponse,
  type ApiValidationError,
  type AgentBasicInfo,
  type AgentBusinessDetails,
  type AdminAgentListResponse,
  type AdminAgentDetailResponse,
  type AdminAgentFilters,
} from '../types/agentProfile';

// The profile endpoints answer validation failures with a per-field `errors`
// map. This pulls that out of an axios error so callers can render errors
// beside the offending input instead of as one opaque toast.
export function extractApiError(error: unknown): ApiValidationError {
  const axiosError = error as AxiosError<ApiValidationError>;
  const payload = axiosError?.response?.data;
  if (payload && typeof payload === 'object') {
    return {
      success: false,
      message: payload.message || 'Something went wrong. Please try again.',
      error: payload.error,
      errors: payload.errors,
      missingFields: payload.missingFields,
    };
  }
  return { success: false, message: 'Network error. Please check your connection and try again.' };
}

export const agentProfileService = {
  // Current agent's profile plus completion state. Creates an empty profile
  // server-side on first call.
  getStatus: async (): Promise<AgentProfileResponse> => {
    const response = await api.get('/agent/profile/status');
    return response.data;
  },

  saveBasicInfo: async (data: AgentBasicInfo): Promise<ProgressResponse> => {
    const response = await api.post('/agent/profile/basic-info', data);
    return response.data;
  },

  saveBusinessDetails: async (data: AgentBusinessDetails): Promise<ProgressResponse> => {
    const response = await api.post('/agent/profile/business-details', {
      ...data,
      yearsExperience: Number(data.yearsExperience),
    });
    return response.data;
  },

  uploadDocument: async (
    file: File,
    documentName: string,
    onProgress?: (percent: number) => void
  ): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentName', documentName);

    const response = await api.post('/agent/profile/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Uploads can take a while on a slow connection; the shared 10s default
      // is too tight for a 10MB document.
      timeout: 120000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded * 100) / event.total));
      },
    });
    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<ProgressResponse> => {
    const response = await api.delete(`/agent/profile/documents/${documentId}`);
    return response.data;
  },

  submitForReview: async (): Promise<SubmitForReviewResponse> => {
    const response = await api.post('/agent/profile/submit-for-review');
    return response.data;
  },
};

export const adminAgentService = {
  getAgents: async (filters: AdminAgentFilters = {}): Promise<AdminAgentListResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.order) params.append('order', filters.order);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/admin/agents?${params.toString()}`);
    return response.data;
  },

  getAgentById: async (agentId: string): Promise<AdminAgentDetailResponse> => {
    const response = await api.get(`/admin/agents/${agentId}`);
    return response.data;
  },

  approveAgent: async (agentId: string, adminNotes?: string) => {
    const response = await api.post(`/admin/agents/${agentId}/approve`, { adminNotes });
    return response.data;
  },

  rejectAgent: async (
    agentId: string,
    payload: { rejectionReason: string; rejectionReasonDetails?: string; adminNotes?: string }
  ) => {
    const response = await api.post(`/admin/agents/${agentId}/reject`, payload);
    return response.data;
  },
};
