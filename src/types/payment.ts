import { formatMoney } from '../utils/currency';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type PaymentMethod = 'bank_transfer';

export interface InvoiceSummary {
  _id: string;
  invoiceNumber: string;
  issuedAt: string;
}

export interface PaymentAgent {
  _id: string;
  fullName: string;
  email: string;
}

export interface Payment {
  _id: string;
  userId: string | PaymentAgent;
  subscriptionRequestId: string;
  subscriptionId: string;
  planNameSnapshot: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionNumber: string;
  senderAccountName: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string | PaymentAgent;
  rejectionReason?: string;
  invoice: InvoiceSummary | null;
  // Signed Cloudinary URL — only returned to the owning agent and to admins.
  paymentProofUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Present on the admin listing only.
  agent?: PaymentAgent;
  reviewer?: PaymentAgent;
}

export interface PaymentAccount {
  _id?: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  instructions?: string;
  currency: string;
  isActive?: boolean;
  updatedBy?: PaymentAgent | string;
  updatedAt?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  paymentId: string;
  subscriptionRequestId: string;
  userId: string;
  subscriptionId: string;
  agentNameSnapshot: string;
  agentEmailSnapshot: string;
  planNameSnapshot: string;
  amount: number;
  currency: string;
  paymentMethodSnapshot: string;
  transactionNumberSnapshot: string;
  issuedAt: string;
  issuedBy: PaymentAgent | string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaymentListResponse {
  success: boolean;
  data: Payment[];
  pagination: Pagination;
  filters?: Record<string, number>;
}

export interface PaymentAccountResponse {
  success: boolean;
  message: string;
  data: PaymentAccount | null;
}

export interface InvoiceResponse {
  success: boolean;
  data: Invoice;
}

export interface AdminPaymentFilters {
  status?: PaymentStatus | 'all';
  agentId?: string;
  subscriptionId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * @deprecated Use `useCurrency().format` so the site currency is applied, or
 * `formatMoney` directly when you already hold the record's own currency.
 *
 * Kept as a thin alias because payments, invoices and quotations all carry
 * their own currency and pass it explicitly — those call sites were already
 * correct. It now delegates rather than holding a second formatting rule: it
 * used to render "Rs. 5,000" while the marketplace rendered "PKR 5,000" for
 * the same amount.
 */
export const formatAmount = (amount: number, currency?: string): string =>
  formatMoney(amount, currency);
