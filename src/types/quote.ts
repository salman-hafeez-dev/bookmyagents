export const QUOTE_STATUSES = [
  'draft', 'sent', 'viewed', 'accepted', 'declined', 'changes_requested', 'expired',
] as const;
export type QuoteStatus = typeof QUOTE_STATUSES[number];

// A quotation stops being the agent's to edit once it reaches the customer.
export const EDITABLE_STATUSES: QuoteStatus[] = ['draft', 'changes_requested'];

export interface QuoteLineItem {
  description: string;
  detail?: string;
  amount: number;
}

export interface QuoteAgent {
  companyName?: string;
  city?: string;
  province?: string;
  officeAddress?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  logo?: string;
}

export interface Quote {
  _id: string;
  reference: string;
  status: QuoteStatus;

  customerName: string;
  customerWhatsapp: string;
  customerEmail?: string;

  destination?: string;
  travellers?: number;
  travelStartDate?: string;
  travelEndDate?: string;

  lineItems: QuoteLineItem[];
  currency: string;
  totalAmount: number;

  inclusions: string[];
  exclusions: string[];
  notes?: string;
  termsAndConditions?: string;
  validUntil: string;

  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  customerResponseNote?: string;
  createdAt: string;
  updatedAt: string;

  agent?: QuoteAgent | null;
  // Agent-side only.
  publicToken?: string;
  leadId?: string;
}

// What the form sends. The total is never sent — the API sums the line items,
// so the figure the customer sees always matches the lines above it.
export interface QuoteInput {
  leadId?: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail?: string;
  destination?: string;
  travellers?: number;
  travelStartDate?: string;
  travelEndDate?: string;
  lineItems: QuoteLineItem[];
  inclusions: string[];
  exclusions: string[];
  notes?: string;
  termsAndConditions?: string;
  validUntil: string;
}

export interface QuoteSummary {
  statusCounts: Partial<Record<QuoteStatus, number>>;
  totalQuotes: number;
  accepted: number;
  acceptanceRate: number;
  acceptedValue: number;
}

export interface QuoteListResponse {
  success: boolean;
  data: Quote[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: QuoteSummary;
}

export interface SendQuoteResponse {
  success: boolean;
  message: string;
  data: Quote & { shareLink: string; whatsappUrl: string; whatsappMessage: string };
}

export type QuoteAction = 'accept' | 'decline' | 'request_changes';
