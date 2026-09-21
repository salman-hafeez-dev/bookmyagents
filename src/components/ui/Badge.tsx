import React from 'react';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Adds a small leading dot — useful for status columns in a table. */
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Status pill. Replaces the ad-hoc `badge bg-success` / `badge bg-secondary`
 * spellings, which pulled Bootstrap's palette rather than the brand's.
 */
const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', dot = false, className = '', children }) => (
  <span className={`ui-badge ui-badge--${tone} ${className}`.trim()}>
    {dot && <span className="ui-badge__dot" aria-hidden="true" />}
    {children}
  </span>
);

export default Badge;
