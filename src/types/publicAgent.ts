import { type Category } from './category';
import { type TravelPackage } from './package';

export type CategoryRef = Pick<Category, '_id' | 'name' | 'slug' | 'icon'>;

// One tab on the public profile. Present for every category the agent's
// subscription covers, even when empty — the tab itself is the visible thing
// they paid for.
export interface AgentCategoryPackages {
  category: CategoryRef;
  packages: TravelPackage[];
}

// What GET /api/agents/:id returns. Only ever an approved agent: anything
// else answers 404, so this type never has to model an unverified state.
export interface PublicAgent {
  _id: string;
  userId: string;

  companyName?: string;
  ownerName?: string;
  logo?: string;
  coverImage?: string;
  avatar?: string;

  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;

  businessLocation?: string;
  city?: string;
  province?: string;
  officeAddress?: string;

  companyDescription?: string;
  yearsExperience?: number;
  servicesOffered?: string;
  areaServed?: string[];
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };

  categories: Category[];
  packagesByCategory: AgentCategoryPackages[];
  packageCount: number;
  startingPrice?: number;
  approvedAt?: string;
}

export interface PublicAgentResponse {
  success: boolean;
  data: PublicAgent;
}
