export const REVIEW_STATUSES = ['pending', 'approved', 'rejected', 'hidden'] as const;
export type ReviewStatus = typeof REVIEW_STATUSES[number];

export type EligibilityReason =
  | 'eligible'
  | 'not_signed_in'
  | 'agents_cannot_review'
  | 'no_interaction'
  | 'already_reviewed';

export interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  status: ReviewStatus;
  // Every review is created against a qualifying lead, so this is always true
  // for published reviews — it is the promise the badge makes.
  isVerifiedCustomer: boolean;
  reviewer: { name: string; avatar?: string };
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  avgRating: number;
  reviewCount: number;
  distribution: Record<string, number>;
}

export interface ReviewListResponse {
  success: boolean;
  data: Review[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: RatingSummary;
}

export interface ReviewEligibility {
  canReview: boolean;
  reason: EligibilityReason;
  existingReview: Review | null;
}

export interface ReviewInput {
  rating: number;
  title?: string;
  comment: string;
}

// Admin view: adds the reviewer's identity and the moderation trail.
export interface AdminReview extends Review {
  adminNotes?: string;
  moderatedAt?: string;
  reviewer: { name: string; avatar?: string };
  agent?: { _id: string; companyName?: string; city?: string } | null;
}

export interface AdminReviewRow {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  status: ReviewStatus;
  rejectionReason?: string;
  adminNotes?: string;
  moderatedAt?: string;
  isVerifiedCustomer: boolean;
  reviewer?: { _id: string; fullName?: string; email?: string; avatar?: string } | null;
  agent?: { _id: string; companyName?: string; city?: string } | null;
  createdAt: string;
}

export interface AdminReviewListResponse {
  success: boolean;
  data: AdminReviewRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  statusCounts: Partial<Record<ReviewStatus, number>>;
}
