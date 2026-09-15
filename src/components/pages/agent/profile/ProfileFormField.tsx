import React from 'react';

type FieldType = 'text' | 'email' | 'tel' | 'url' | 'number' | 'select' | 'textarea';

interface ProfileFormFieldProps {
  label: string;
  name: string;
  type?: FieldType;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
}

const ProfileFormField: React.FC<ProfileFormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required,
  error,
  hint,
  placeholder,
  readOnly,
  disabled,
  options,
  rows = 4,
  maxLength,
  minLength,
  min,
  max,
}) => {
  const controlId = `agent-profile-${name}`;
  const describedBy = [
    hint ? `${controlId}-hint` : null,
    error ? `${controlId}-error` : null,
  ].filter(Boolean).join(' ') || undefined;

  const className = `form-control${error ? ' is-invalid' : ''}`;
  const length = typeof value === 'string' ? value.length : 0;

  const shared = {
    id: controlId,
    name,
    onChange,
    disabled,
    readOnly,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
  };

  return (
    <div className="mb-20">
      <label htmlFor={controlId} className="form-label fw-semibold">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          {...shared}
          className={className}
          value={value}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      ) : type === 'select' ? (
        <select {...shared} className={`form-select${error ? ' is-invalid' : ''}`} value={value}>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          {...shared}
          type={type}
          className={className}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          min={min}
          max={max}
        />
      )}

      <div className="d-flex justify-content-between gap-3 mt-1">
        <div>
          {hint && !error && (
            <small id={`${controlId}-hint`} className="text-muted">{hint}</small>
          )}
          {error && (
            <small id={`${controlId}-error`} className="text-danger">{error}</small>
          )}
        </div>
        {/* Live counter for the fields that have a length rule the agent has to hit. */}
        {(maxLength || minLength) && typeof value === 'string' && (
          <small className={minLength && length < minLength ? 'text-danger flex-shrink-0' : 'text-muted flex-shrink-0'}>
            {length}{maxLength ? `/${maxLength}` : ''}
            {minLength && length < minLength ? ` (min ${minLength})` : ''}
          </small>
        )}
      </div>
    </div>
  );
};

export default ProfileFormField;
