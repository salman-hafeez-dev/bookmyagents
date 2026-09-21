export interface SocialLink {
  platform: string;
  url: string;
}

export interface BusinessHour {
  day: string;
  opens?: string;
  closes?: string;
  closed: boolean;
}

export interface QuickLink {
  label: string;
  url: string;
}

export interface SiteAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ContactPageSettings {
  heading?: string;
  subheading?: string;
  infoHeading?: string;
  infoText?: string;
  formEnabled: boolean;
  formNote?: string;
}

export interface FooterSettings {
  description?: string;
  quickLinks: QuickLink[];
  copyrightText?: string;
}

/**
 * The business details every public surface reads — footer, contact page,
 * header. One shape, one cached request; see redux/api/siteApi.ts.
 */
export interface SiteSettings {
  _id?: string;
  businessName: string;
  /** ISO code the admin picked. Every price without its own currency uses it. */
  currency: string;
  tagline?: string;
  description?: string;
  phones: string[];
  whatsapp?: string;
  emails: string[];
  address: SiteAddress;
  mapEmbedUrl?: string;
  mapLink?: string;
  businessHours: BusinessHour[];
  socialLinks: SocialLink[];
  contactPage: ContactPageSettings;
  footer: FooterSettings;
  updatedAt?: string;
}

export interface SiteSettingsResponse {
  success: boolean;
  data: SiteSettings | null;
  message?: string;
}

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

// Icon + label per platform, so the footer and contact page render social
// links identically without either of them holding a list of their own.
export const SOCIAL_PLATFORMS: { value: string; label: string; icon: string }[] = [
  { value: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook-f' },
  { value: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram' },
  { value: 'twitter', label: 'X (Twitter)', icon: 'fa-brands fa-x-twitter' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in' },
  { value: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'fa-brands fa-tiktok' },
  { value: 'pinterest', label: 'Pinterest', icon: 'fa-brands fa-pinterest-p' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
];

export const socialIcon = (platform: string): string =>
  SOCIAL_PLATFORMS.find((entry) => entry.value === platform.toLowerCase())?.icon
  || 'fa-solid fa-link';
