// Display formatting shared by the public marketplace pages.

// Money formatting lives in utils/currency.ts, which is aware of the
// admin-configured site currency. Re-exported here so the existing call sites
// keep working.
export { formatMoney } from './currency';

export const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// "per person" reads better than the stored `per_person` everywhere it shows.
export const formatPriceType = (priceType?: string) =>
  priceType === 'per_group' ? 'per group' : 'per person';

// Pakistani numbers are stored as typed (+923… or 03…). wa.me needs digits
// only with the country code, so local 03… form is expanded to 923….
export const toWhatsAppNumber = (raw?: string) => {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('0')) return `92${digits.slice(1)}`;
  return digits;
};
