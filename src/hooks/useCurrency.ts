import { useMemo } from 'react';
import { useGetSiteSettingsQuery } from '../redux/api/siteApi';
import {
  DEFAULT_CURRENCY,
  currencyOption,
  currencySymbol,
  formatMoney,
} from '../utils/currency';

/**
 * The site currency an admin configured, plus a formatter bound to it.
 *
 * Reads the shared, cached site-settings query, so using this costs no extra
 * request wherever it is called.
 *
 *   const { format, symbol } = useCurrency();
 *   format(plan.price)                  // site currency
 *   format(payment.amount, payment.currency)  // the record's own currency
 *
 * The optional second argument is the point: a payment, invoice, quotation or
 * package stores the currency it was created in, and must keep being shown in
 * it even after the admin switches the site to something else.
 */
export const useCurrency = () => {
  const { data } = useGetSiteSettingsQuery();
  const code = data?.data?.currency || DEFAULT_CURRENCY;

  return useMemo(() => ({
    code,
    symbol: currencySymbol(code),
    option: currencyOption(code),
    /** `override` wins, for records carrying their own currency. */
    format: (amount: number, override?: string) => formatMoney(amount, override || code),
  }), [code]);
};

export default useCurrency;
