import { type QuoteStatus } from '../../../../types/quote';

// Presentation for the quotation lifecycle, kept beside the panel but in
// its own file so the component module only exports a component.
export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bma-lead-badge--closed' },
  sent: { label: 'Sent', className: 'bma-lead-badge--new' },
  viewed: { label: 'Viewed', className: 'bma-lead-badge--contacted' },
  changes_requested: { label: 'Changes requested', className: 'bma-lead-badge--followup' },
  accepted: { label: 'Accepted', className: 'bma-lead-badge--converted' },
  declined: { label: 'Declined', className: 'bma-lead-badge--closed' },
  expired: { label: 'Expired', className: 'bma-lead-badge--closed' },
};

