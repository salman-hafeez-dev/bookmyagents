import { type Subscription } from '../services/subscriptionService';

export type SubscriptionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SubscriptionRequestAgent {
  _id: string;
  fullName: string;
  email: string;
  subscription?: string | Subscription;
}

export interface SubscriptionRequest {
  _id: string;
  agentId: SubscriptionRequestAgent | string;
  subscriptionId: Subscription | string;
  previousSubscriptionId?: Subscription | string;
  // Plan details frozen when the request was made — a later price edit must not
  // change what this request represents.
  planNameSnapshot?: string;
  amountSnapshot?: number;
  currencySnapshot?: string;
  categoryLimitSnapshot?: number;
  status: SubscriptionRequestStatus;
  reviewedBy?: { _id: string; fullName: string; email: string } | string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRequestListResponse {
  success: boolean;
  data: SubscriptionRequest[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SubscriptionRequestResponse {
  success: boolean;
  message: string;
  data: SubscriptionRequest;
}
