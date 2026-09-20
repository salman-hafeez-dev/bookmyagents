import { type BusinessHour, type SiteAddress, type SiteSettings } from '../types/siteSettings';

/**
 * Presentation helpers for the admin-controlled contact details.
 *
 * Shared by the footer, the contact page and anywhere else that shows a phone
 * number, so formatting (and the "hide it when it isn't configured" rule) is
 * written once.
 */

/** Digits only, the shape wa.me expects. Empty string when unusable. */
export const toWhatsAppNumber = (value?: string): string =>
  (value || '').replace(/\D/g, '');

export const whatsAppLink = (value?: string, message?: string): string | null => {
  const number = toWhatsAppNumber(value);
  if (!number) return null;
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
};

/** tel: href with the spaces and punctuation browsers dislike removed. */
export const telLink = (value?: string): string | null => {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  return `tel:${trimmed.replace(/[^\d+]/g, '')}`;
};

export const mailtoLink = (value?: string): string | null => {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  return `mailto:${trimmed}`;
};

/** Address as display lines, skipping every part the admin left blank. */
export const addressLines = (address?: SiteAddress): string[] => {
  if (!address) return [];
  const cityLine = [address.city, address.state, address.postalCode]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(', ');
  return [address.line1, address.line2, cityLine, address.country]
    .map((part) => (part || '').trim())
    .filter(Boolean);
};

export const addressText = (address?: SiteAddress): string =>
  addressLines(address).join(', ');

/** "09:00" -> "9:00 am". Left as-is if it isn't a 24-hour time. */
export const formatTime = (value?: string): string => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec((value || '').trim());
  if (!match) return (value || '').trim();
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${match[2]} ${suffix}`;
};

export const formatHours = (hour: BusinessHour): string =>
  hour.closed ? 'Closed' : `${formatTime(hour.opens)} – ${formatTime(hour.closes)}`;

/**
 * Collapses consecutive days that share the same hours, so a full week reads
 * "Mon – Sat: 9:00 am – 6:00 pm / Sunday: Closed" instead of seven rows.
 */
export const groupBusinessHours = (
  hours: BusinessHour[] = [],
): { label: string; value: string }[] => {
  const groups: { days: string[]; value: string }[] = [];

  hours.forEach((hour) => {
    const value = formatHours(hour);
    const last = groups[groups.length - 1];
    if (last && last.value === value) last.days.push(hour.day);
    else groups.push({ days: [hour.day], value });
  });

  return groups.map(({ days, value }) => ({
    label: days.length === 1
      ? days[0]
      : `${days[0].slice(0, 3)} – ${days[days.length - 1].slice(0, 3)}`,
    value,
  }));
};

/** True when there is nothing worth rendering a contact block for. */
export const hasContactDetails = (settings?: SiteSettings | null): boolean =>
  Boolean(
    settings && (
      settings.phones?.length
      || settings.emails?.length
      || settings.whatsapp
      || addressLines(settings.address).length
    ),
  );
