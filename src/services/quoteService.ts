import api from './api';
import {
  type Quote,
  type QuoteAction,
  type QuoteInput,
  type QuoteListResponse,
  type QuoteStatus,
  type SendQuoteResponse,
} from '../types/quote';

export const quoteService = {
  // --- Agent ----------------------------------------------------------------

  getMyQuotes: async (
    filters: { status?: QuoteStatus; leadId?: string; page?: number; limit?: number } = {}
  ): Promise<QuoteListResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.leadId) params.append('leadId', filters.leadId);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/agent/quotes?${params.toString()}`);
    return response.data;
  },

  create: async (input: QuoteInput): Promise<{ success: boolean; message: string; data: Quote }> => {
    const response = await api.post('/agent/quotes', input);
    return response.data;
  },

  update: async (quoteId: string, input: QuoteInput): Promise<{ success: boolean; message: string; data: Quote }> => {
    const response = await api.put(`/agent/quotes/${quoteId}`, input);
    return response.data;
  },

  // Issues the quotation and returns the link plus a ready-made WhatsApp
  // message. The platform never messages anyone — the agent sends it from
  // their own number.
  send: async (quoteId: string): Promise<SendQuoteResponse> => {
    const response = await api.post(`/agent/quotes/${quoteId}/send`);
    return response.data;
  },

  remove: async (quoteId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/agent/quotes/${quoteId}`);
    return response.data;
  },

  // --- Customer, via the link (no account) ----------------------------------

  getByToken: async (token: string): Promise<{ success: boolean; data: Quote }> => {
    const response = await api.get(`/quotes/${token}`);
    return response.data;
  },

  respond: async (
    token: string,
    action: QuoteAction,
    note?: string
  ): Promise<{ success: boolean; message: string; data: Quote }> => {
    const response = await api.post(`/quotes/${token}/respond`, { action, note });
    return response.data;
  },

  pdfUrl: (token: string) => {
    const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
    return `${base}/quotes/${token}/pdf`;
  },
};

export default quoteService;
