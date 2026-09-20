export type LegalPageStatus = 'draft' | 'published';

/** Summary row — what the admin table and the footer link list need. */
export interface LegalPageSummary {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  status?: LegalPageStatus;
  publishedAt?: string | null;
  displayOrder: number;
  showInFooter: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Full document, including the HTML body. */
export interface LegalPage extends LegalPageSummary {
  content: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface LegalPageListResponse {
  success: boolean;
  data: LegalPageSummary[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface LegalPageResponse {
  success: boolean;
  data: LegalPage;
  message?: string;
}

export interface LegalPageInput {
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  status: LegalPageStatus;
  displayOrder?: number;
  showInFooter?: boolean;
}
