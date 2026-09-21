import React from 'react';

export type ControlSize = 'sm' | 'md' | 'lg';

export interface FieldProps {
  label?: string;
  /** Marks the control required and shows the asterisk. */
  required?: boolean;
  /** Validation message. Its presence is what puts the control in error state. */
  error?: string;
  /** Helper text below the control. Hidden while an error is showing. */
  hint?: string;
  size?: ControlSize;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Label + control + error/hint, laid out identically everywhere.
 *
 * Every form in this app used to hand-roll this — a <label>, a control with
 * `form-control${errors.x ? ' is-invalid' : ''}`, and a sibling div for the
 * message. Shared here so the spacing, the asterisk, the error colour and the
 * aria wiring are written once.
 */
interface FieldShellProps extends FieldProps {
  id: string;
  errorId: string;
  hintId: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldShellProps> = ({
  label, required, error, hint, fullWidth = true, className = '',
  id, errorId, hintId, children,
}) => (
  <div className={`ui-field ${fullWidth ? 'ui-field--block' : ''} ${error ? 'is-invalid' : ''} ${className}`.trim()}>
    {label && (
      <label className="ui-field__label" htmlFor={id}>
        {label}
        {required && <span className="ui-field__required" aria-hidden="true">*</span>}
      </label>
    )}
    {children}
    {error
      ? <p className="ui-field__error" id={errorId} role="alert">{error}</p>
      : hint ? <p className="ui-field__hint" id={hintId}>{hint}</p> : null}
  </div>
);

export default Field;
