import api from './api';
import {
  type PaymentListResponse,
  type PaymentAccountResponse,
  type PaymentAccount,
  type InvoiceResponse,
  type AdminPaymentFilters,
} from '../types/payment';

export const paymentService = {
  // Platform bank details shown in the payment modal. Authenticated only.
  getPaymentAccount: async (): Promise<PaymentAccountResponse> => {
    const response = await api.get('/payment-account');
    return response.data;
  },

  // Agent: own payment history.
  getMyPayments: async (params: { page?: number; limit?: number; status?: string } = {}): Promise<PaymentListResponse> => {
    const search = new URLSearchParams();
    if (params.page) search.append('page', String(params.page));
    if (params.limit) search.append('limit', String(params.limit));
    if (params.status && params.status !== 'all') search.append('status', params.status);
    const response = await api.get(`/agent/payments?${search.toString()}`);
    return response.data;
  },

  // Agent: submit the payment and request the plan in one call. The proof is
  // uploaded server-side to a private Cloudinary folder.
  submitPlanPayment: async (
    payload: {
      subscriptionId: string;
      transactionNumber: string;
      senderAccountName: string;
      paymentProof: File;
    },
    onProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    formData.append('subscriptionId', payload.subscriptionId);
    formData.append('transactionNumber', payload.transactionNumber);
    formData.append('senderAccountName', payload.senderAccountName);
    formData.append('paymentProof', payload.paymentProof);

    const response = await api.post('/agent/subscription-requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // The shared 10s default is too tight for a screenshot upload.
      timeout: 120000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded * 100) / event.total));
      },
    });
    return response.data;
  },

  // Admin: all payments, with filters.
  getAdminPayments: async (filters: AdminPaymentFilters = {}): Promise<PaymentListResponse> => {
    const search = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) search.append(key, String(value));
    });
    const response = await api.get(`/admin/payments?${search.toString()}`);
    return response.data;
  },

  // Invoice metadata (JSON). Readable by the owning agent or an admin.
  getInvoice: async (invoiceId: string): Promise<InvoiceResponse> => {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response.data;
  },

  // The platform invoice as a PDF, for a verified payment.
  //
  // Fetched through axios rather than pointed at by an <iframe src> because the
  // endpoint needs the Authorization header, which an iframe cannot send. The
  // response becomes an object URL that both the viewer and the download link
  // use, so the PDF is fetched once.
  getInvoicePdfBlob: async (paymentId: string): Promise<Blob> => {
    const response = await api.get(`/payments/${paymentId}/invoice`, {
      responseType: 'blob',
      timeout: 60000,
    });
    return response.data as Blob;
  },
};

export const paymentAccountService = {
  list: async (): Promise<{ success: boolean; data: PaymentAccount[] }> => {
    const response = await api.get('/admin/payment-accounts');
    return response.data;
  },

  create: async (data: PaymentAccount) => {
    const response = await api.post('/admin/payment-accounts', data);
    return response.data;
  },

  update: async (id: string, data: PaymentAccount) => {
    const response = await api.put(`/admin/payment-accounts/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/admin/payment-accounts/${id}`);
    return response.data;
  },
};
