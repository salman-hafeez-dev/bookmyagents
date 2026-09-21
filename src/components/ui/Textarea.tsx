import React from 'react';
import Field, { type FieldProps } from './Field';
import { useFieldIds } from './useFieldIds';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, Omit<FieldProps, 'size'> {}

/** Multi-line input, sharing Input's label, error and hint treatment. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, required, error, hint, fullWidth = true, className = '',
  rows = 3, id: providedId, ...rest
}, ref) => {
  const { id, errorId, hintId } = useFieldIds(providedId);

  return (
    <Field
      label={label} required={required} error={error} hint={hint}
      fullWidth={fullWidth} className={className}
      id={id} errorId={errorId} hintId={hintId}
    >
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className="ui-control__input ui-control__input--textarea"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...rest}
      />
    </Field>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
