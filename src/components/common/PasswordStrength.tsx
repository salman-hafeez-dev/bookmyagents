import React from 'react';
import { checkPassword, passwordStrength, PASSWORD_RULES } from '../../utils/passwordValidator';

interface PasswordStrengthProps {
  password: string;
  /** Hide the per-rule checklist once it's no longer useful. */
  showRules?: boolean;
}

/** Strength meter plus a live checklist of the policy rules. */
const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, showRules = true }) => {
  const checks = checkPassword(password);
  const { score, label, variant } = passwordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-1">
      <div className="app-password-meter" role="img" aria-label={`Password strength: ${label}`}>
        {PASSWORD_RULES.map((rule, index) => (
          <span
            key={rule.key}
            className={`app-password-meter__segment${index < score ? ` app-password-meter__segment--${variant}` : ''}`}
          />
        ))}
      </div>
      <small className={`text-${variant}`}>{label} password</small>

      {showRules && (
        <ul className="app-password-rules">
          {PASSWORD_RULES.map((rule) => (
            <li key={rule.key} className={checks[rule.key] ? 'is-met' : ''}>
              <i
                className={checks[rule.key] ? 'fas fa-circle-check' : 'far fa-circle'}
                aria-hidden="true"
              />
              {rule.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrength;
