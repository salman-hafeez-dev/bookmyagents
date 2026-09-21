import React from 'react';
import Field, { type FieldProps } from './Field';
import { useFieldIds } from './useFieldIds';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, FieldProps {
  /** Font Awesome class rendered inside the control, before the text. */
  icon?: string;
  /** Rendered at the trailing edge — a unit, a clear button, a spinner. */
  addonRight?: React.ReactNode;
}

/**
 * Text input. Sizing comes from the shared control scale, so an Input, a
 * Select and a Button of the same `size` line up in a toolbar.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label, required, error, hint, size = 'md', fullWidth = true, className = '',
  icon, addonRight, id: providedId, ...rest
}, ref) => {
  const { id, errorId, hintId } = useFieldIds(providedId);

  return (
    <Field
      label={label} required={required} error={error} hint={hint}
      fullWidth={fullWidth} className={className}
      id={id} errorId={errorId} hintId={hintId}
    >
      <div className={`ui-control ui-control--${size} ${icon ? 'has-icon' : ''} ${addonRight ? 'has-addon' : ''}`.trim()}>
        {icon && <i className={`${icon} ui-control__icon`} aria-hidden="true" />}
        <input
          ref={ref}
          id={id}
          className="ui-control__input"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...rest}
        />
        {addonRight && <span className="ui-control__addon">{addonRight}</span>}
      </div>
    </Field>
  );
});

Input.displayName = 'Input';
export default Input;
