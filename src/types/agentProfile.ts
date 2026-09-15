import { type Category } from './category';

export type AgentProfileStatus = 'incomplete' | 'pending' | 'approved' | 'rejected';

export type ProfileStep =
  | 'basicInfo'
  | 'businessDetails'
  | 'categorySelected'
  | 'documentsUploaded'
  | 'adminApproved';

export type ProfileCompletion = Record<ProfileStep, boolean>;

export interface AgentDocument {
  _id: string;
  name: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  adminReviewedAt?: string;
  // Signed Cloudinary URL — only returned to the owning agent and to admins.
  fileUrl?: string;
}

export interface AgentBasicInfo {
  companyName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  businessLocation: string;
  city: string;
  province: string;
  officeAddress: string;
}

export interface AgentSocialMedia {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
}

export interface AgentBusinessDetails {
  companyDescription: string;
  yearsExperience: number | '';
  servicesOffered: string;
  areaServed: string[];
  socialMedia?: AgentSocialMedia;
  logo?: string;
  coverImage?: string;
}

export interface AgentProfile {
  _id: string;
  userId: string;
  status: AgentProfileStatus;
  profileCompletionPercentage: number;
  profileCompletion: ProfileCompletion;
  basicInfo: Partial<AgentBasicInfo>;
  businessDetails: Partial<AgentBusinessDetails>;
  // Sourced from User.categories, not stored on the profile itself.
  categories: Category[];
  documents: AgentDocument[];
  rejectionReason?: string;
  rejectionReasonDetails?: string;
  adminNotes?: string;
  submittedForReviewAt?: string;
  approvedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileProgress {
  profileCompletionPercentage: number;
  profileCompletion: ProfileCompletion;
  status: AgentProfileStatus;
}

// Every write endpoint answers with the refreshed progress, so the wizard can
// update its progress bar without refetching the whole profile.
export interface ProgressResponse {
  success: boolean;
  message: string;
  data: ProfileProgress;
}

export interface AgentProfileResponse {
  success: boolean;
  message: string;
  data: AgentProfile;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  data: ProfileProgress & { document: AgentDocument };
}

export interface SubmitForReviewResponse {
  success: boolean;
  message: string;
  data: ProfileProgress & {
    submittedForReviewAt: string;
    documentsUploaded: number;
  };
}

// Shape of a failed validation response from the profile endpoints.
export interface ApiValidationError {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string>;
  missingFields?: ProfileStep[];
}

// ----- Admin -----

export interface AdminAgentListItem {
  _id: string;
  userId: string;
  companyName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  city?: string;
  status: AgentProfileStatus;
  profileCompletionPercentage: number;
  documentsCount: number;
  categoriesCount: number;
  createdAt: string;
  submittedForReviewAt?: string;
  approvedAt?: string;
}

export interface AdminAgentListResponse {
  success: boolean;
  data: {
    agents: AdminAgentListItem[];
    pagination: { total: number; page: number; limit: number; pages: number };
    filters: Record<string, number>;
  };
}

export interface AdminAgentDetail extends AgentProfile {
  account: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    subscription?: { _id: string; name: string; price: number; categoryLimit?: number };
    createdAt: string;
  } | null;
}

export interface AdminAgentDetailResponse {
  success: boolean;
  data: { agent: AdminAgentDetail };
}

export interface AdminAgentFilters {
  status?: AgentProfileStatus | 'all';
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
