import React from 'react';
import Tooltip, { type TooltipPlacement } from './Tooltip';

export type IconButtonTone = 'default' | 'primary' | 'danger' | 'success' | 'warning';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Font Awesome class. Prefer the regular (outline) weight — `far fa-*`. */
  icon: string;
  /** Required: this is the accessible name and the tooltip text. */
  label: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  tooltipPlacement?: TooltipPlacement;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * The action button used in table rows.
 *
 * Table actions used to be text buttons — 51 of them across five Bootstrap
 * colour variants, so an actions column could be four differently coloured
 * pills that pushed the table wider than the screen on mobile.
 *
 * These are outline icons, dark by default, with colour reserved for the
 * actions where colour carries meaning (destructive, approve). Every one
 * carries a label, which is both the tooltip and the accessible name — an
 * icon-only control with no name is invisible to a screen reader.
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  tone = 'default',
  size = 'md',
  tooltipPlacement = 'top',
  loading = false,
  type = 'button',
  disabled,
  className = '',
  ...rest
}) => {
  const button = (
    <button
      type={type}
      className={`ui-icon-btn ui-icon-btn--${tone} ui-icon-btn--${size} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading
        ? <span className="ui-btn__spinner" aria-hidden="true" />
        : <i className={icon} aria-hidden="true" />}
    </button>
  );

  // A disabled button fires no pointer events, so the tooltip would never
  // appear — the wrapper carries the hover in that case.
  return <Tooltip label={label} placement={tooltipPlacement}>{button}</Tooltip>;
};

export default IconButton;
