import React from 'react';
import Field, { type FieldProps } from './Field';
import { useFieldIds } from './useFieldIds';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'>, FieldProps {
  options: SelectOption[];
  /** Shown as a disabled first entry — "All statuses", "Choose a category". */
  placeholder?: string;
}

/**
 * Dropdown. Wraps the native <select> deliberately.
 *
 * The app had two systems: 21 raw <select> elements and 4 uses of the custom
 * NiceSelect. NiceSelect renders its own listbox, which means no native mobile
 * picker, no type-ahead and no form integration — worth it for a styled
 * marketing dropdown, wrong for a filter in a data table. This is the native
 * control with the chevron and sizing brought in line with Input, so the two
 * match when they sit side by side in a toolbar.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label, required, error, hint, size = 'md', fullWidth = true, className = '',
  options, placeholder, id: providedId, value, ...rest
}, ref) => {
  const { id, errorId, hintId } = useFieldIds(providedId);

  return (
    <Field
      label={label} required={required} error={error} hint={hint}
      fullWidth={fullWidth} className={className}
      id={id} errorId={errorId} hintId={hintId}
    >
      <div className={`ui-control ui-control--${size} ui-control--select`}>
        <select
          ref={ref}
          id={id}
          className="ui-control__input"
          required={required}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <i className="fas fa-chevron-down ui-control__chevron" aria-hidden="true" />
      </div>
    </Field>
  );
});

Select.displayName = 'Select';
export default Select;
