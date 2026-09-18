import { type LeadStatus, type LeadType } from '../../../../types/lead';

// Presentation for the two enums, kept in one place so a status looks and
// reads the same in the list, the filter tabs and the detail panel.

export const STATUS_META: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bma-lead-badge--new' },
  contacted: { label: 'Contacted', className: 'bma-lead-badge--contacted' },
  quote_sent: { label: 'Quote sent', className: 'bma-lead-badge--quote' },
  followup: { label: 'Follow-up', className: 'bma-lead-badge--followup' },
  converted: { label: 'Converted', className: 'bma-lead-badge--converted' },
  closed_lost: { label: 'Closed', className: 'bma-lead-badge--closed' },
};

// The order an agent works through, so the pipeline reads left to right.
export const STATUS_ORDER: LeadStatus[] = [
  'new', 'contacted', 'quote_sent', 'followup', 'converted', 'closed_lost',
];

export const TYPE_META: Record<LeadType, { label: string; icon: string; short: string }> = {
  quote_request: { label: 'Quote request', icon: 'fas fa-file-invoice', short: 'Quote' },
  inquiry: { label: 'Enquiry', icon: 'fas fa-comment-dots', short: 'Enquiry' },
  whatsapp_click: { label: 'WhatsApp tap', icon: 'fab fa-whatsapp', short: 'WhatsApp' },
  phone_click: { label: 'Phone tap', icon: 'fas fa-phone', short: 'Phone' },
};

// "2 hours ago" is easier to act on than a timestamp when triaging an inbox.
export const timeAgo = (value: string): string => {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};
