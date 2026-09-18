/**
 * Mirrors the server-side policy in the API's lib/passwordPolicy.ts.
 *
 * Client-side checking is for immediate feedback only — the API re-validates
 * every password it is sent, and its answer is authoritative.
 */
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordCheck {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialChar: boolean;
}

export const PASSWORD_RULES: { key: keyof PasswordCheck; label: string }[] = [
  { key: 'minLength', label: `At least ${PASSWORD_MIN_LENGTH} characters` },
  { key: 'uppercase', label: 'One uppercase letter' },
  { key: 'lowercase', label: 'One lowercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'specialChar', label: 'One special character' },
];

export function checkPassword(password: string): PasswordCheck {
  const value = password || '';
  return {
    minLength: value.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    specialChar: /[^A-Za-z0-9\s]/.test(value),
  };
}

export function isPasswordValid(password: string): boolean {
  return Object.values(checkPassword(password)).every(Boolean);
}

/** 0-5, for the strength meter. */
export function passwordScore(password: string): number {
  return Object.values(checkPassword(password)).filter(Boolean).length;
}

export function passwordStrength(password: string): {
  score: number;
  label: string;
  variant: 'danger' | 'warning' | 'success';
} {
  const score = passwordScore(password);
  if (score <= 2) return { score, label: 'Weak', variant: 'danger' };
  if (score <= 4) return { score, label: 'Fair', variant: 'warning' };
  return { score, label: 'Strong', variant: 'success' };
}
