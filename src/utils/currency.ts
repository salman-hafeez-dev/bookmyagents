/**
 * Money formatting, in one place.
 *
 * There used to be two: `formatAmount` in types/payment.ts rendered "Rs. 5,000"
 * and `formatMoney` in utils/format.ts rendered "PKR 5,000", so the same amount
 * read differently in the dashboard and on the marketplace. Both now delegate
 * here.
 *
 * The currency an amount is shown in comes from one of two places, and the
 * distinction matters:
 *
 *  - Records that store their own currency — payments, invoices, quotations,
 *    packages — are formatted in the currency they were created with. A past
 *    payment must keep saying what was actually charged, whatever the admin
 *    has changed the site to since.
 *  - Everything else — subscription plan prices, category base prices, form
 *    labels, filter hints — uses the site currency from the admin settings.
 *    Use the `useCurrency` hook for those.
 */

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
  locale: string;
}

// Mirrors constants/currencies.ts in the API. Kept in step by hand; the list
// changes about once a year, and sharing it would mean a build step across two
// separately deployed repos.
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'PKR', symbol: 'Rs.', label: 'Pakistani Rupee (PKR)', locale: 'en-PK' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)', locale: 'en-GB' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)', locale: 'en-IE' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)', locale: 'en-AE' },
  { code: 'SAR', symbol: 'SAR', label: 'Saudi Riyal (SAR)', locale: 'en-SA' },
];

export const DEFAULT_CURRENCY = 'PKR';

export const currencyOption = (code?: string): CurrencyOption =>
  SUPPORTED_CURRENCIES.find((entry) => entry.code === (code || '').toUpperCase())
  || SUPPORTED_CURRENCIES[0];

/** Just the symbol — "Rs.", "$" — for a form label or a compact cell. */
export const currencySymbol = (code?: string): string => currencyOption(code).symbol;

/**
 * "Rs. 385,000". Amounts are whole units throughout this app, so this groups
 * digits rather than doing any currency conversion.
 */
export const formatMoney = (amount: number, code?: string): string => {
  const option = currencyOption(code);
  const grouped = new Intl.NumberFormat(option.locale).format(amount ?? 0);
  return `${option.symbol} ${grouped}`;
};
