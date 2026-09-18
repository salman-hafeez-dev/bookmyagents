import api from './api';
import { getVisitorId } from '../utils/visitor';
import {
  type AdminLeadFilters,
  type AdminLeadListResponse,
  type Lead,
  type LeadFilters,
  type LeadListResponse,
  type LeadStatus,
  type LeadType,
  type QuoteRequestInput,
} from '../types/lead';

interface RecordLeadTarget {
  agentId?: string;
  packageId?: string;
}

export const leadService = {
  /**
   * Records a contact action.
   *
   * Never throws. A tap on WhatsApp must open WhatsApp whether or not our
   * analytics call succeeded — losing a lead record costs a number on a
   * dashboard, losing the customer costs the agent a sale.
   */
  record: async (type: LeadType, target: RecordLeadTarget): Promise<void> => {
    try {
      await api.post('/leads', {
        type,
        ...target,
        visitorId: getVisitorId(),
      });
    } catch (error) {
      console.error('Failed to record lead:', error);
    }
  },

  // The quote form, by contrast, must report failure: the customer is waiting
  // to hear that their request went through.
  submitQuoteRequest: async (
    target: RecordLeadTarget,
    input: QuoteRequestInput
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/leads', {
      type: 'quote_request',
      ...target,
      ...input,
      visitorId: getVisitorId(),
    });
    return response.data;
  },

  // --- Agent side ---------------------------------------------------------

  getMyLeads: async (filters: LeadFilters = {}): Promise<LeadListResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/agent/leads?${params.toString()}`);
    return response.data;
  },

  updateLead: async (
    leadId: string,
    changes: { status?: LeadStatus; agentNotes?: string }
  ): Promise<{ success: boolean; message: string; data: Lead }> => {
    const response = await api.patch(`/agent/leads/${leadId}`, changes);
    return response.data;
  },

  // --- Admin --------------------------------------------------------------

  getPlatformStats: async (days = 30) => {
    const response = await api.get(`/admin/leads/stats?days=${days}`);
    return response.data;
  },

  getAllLeads: async (filters: AdminLeadFilters = {}): Promise<AdminLeadListResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/admin/leads?${params.toString()}`);
    return response.data;
  },
};

export default leadService;
