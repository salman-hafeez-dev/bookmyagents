export const LEAD_TYPES = ['whatsapp_click', 'phone_click', 'inquiry', 'quote_request'] as const;
export type LeadType = typeof LEAD_TYPES[number];

export const LEAD_STATUSES = [
  'new', 'contacted', 'quote_sent', 'followup', 'converted', 'closed_lost',
] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

// Only these two carry contact details — nobody identifies themselves to tap
// WhatsApp, so the UI must not imply every lead is a named prospect.
export const CONTACTABLE_TYPES: LeadType[] = ['inquiry', 'quote_request'];

export interface Lead {
  _id: string;
  type: LeadType;
  status: LeadStatus;

  package?: { _id: string; title: string } | null;
  category?: { _id: string; name: string; slug: string } | null;

  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;

  travellers?: number;
  preferredDate?: string;
  durationDays?: number;
  budget?: number;
  message?: string;

  agentNotes?: string;
  contactedAt?: string;
  closedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface LeadSummary {
  totalLeads: number;
  newLeads: number;
  converted: number;
  thisMonth: number;
  statusCounts: Partial<Record<LeadStatus, number>>;
  typeCounts: Partial<Record<LeadType, number>>;
  profileViews: number;
  packageViews: number;
  isPubliclyVisible: boolean;
}

export interface LeadListResponse {
  success: boolean;
  data: Lead[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: LeadSummary;
}

export interface LeadFilters {
  status?: LeadStatus;
  type?: LeadType;
  page?: number;
  limit?: number;
}

// What the quote form sends.
export interface QuoteRequestInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  travellers?: number;
  preferredDate?: string;
  durationDays?: number;
  budget?: number;
  message?: string;
}
