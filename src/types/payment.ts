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

// Amounts are stored in minor-unit-free integers (PKR has no subunit in
// practice here), so this is a plain grouped format rather than a currency
// conversion.
export const formatAmount = (amount: number, currency = 'PKR'): string =>
  `${currency === 'PKR' ? 'Rs.' : currency} ${amount.toLocaleString('en-PK')}`;
