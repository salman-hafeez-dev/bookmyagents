import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks input. The label stays, so width doesn't jump. */
  loading?: boolean;
  /** Font Awesome class, e.g. "fas fa-plus". Rendered before the label. */
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children?: React.ReactNode;
}

/**
 * The application's button.
 *
 * Before this there were 292 raw <button> elements across 28 different class
 * combinations — including `btn btn-sm btn-primary` and `btn btn-primary
 * btn-sm`, which are the same button written two ways. Sizing came from
 * whichever Bootstrap class the author happened to use, so buttons sitting
 * next to an input rarely lined up with it.
 *
 * Heights come from the shared control scale (--ui-control-height-*), which
 * Input and Select use as well, so a toolbar row aligns by construction.
 *
 * `type` defaults to "button": a bare <button> inside a <form> submits it,
 * which has been a recurring source of accidental submissions here.
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...rest
}) => {
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    fullWidth ? 'ui-btn--block' : '',
    loading ? 'is-loading' : '',
    !children ? 'ui-btn--icon-only' : '',
    className,
  ].filter(Boolean).join(' ');

  const iconEl = icon ? <i className={`${icon} ui-btn__icon`} aria-hidden="true" /> : null;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="ui-btn__spinner" aria-hidden="true" />}
      {!loading && iconPosition === 'left' && iconEl}
      {children && <span className="ui-btn__label">{children}</span>}
      {!loading && iconPosition === 'right' && iconEl}
    </button>
  );
};

export default Button;
