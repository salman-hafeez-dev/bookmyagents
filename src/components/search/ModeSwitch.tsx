import React from 'react';
import { type SearchType } from '../../types/search';

interface ModeSwitchProps {
  value: SearchType;
  onChange: (type: SearchType) => void;
  className?: string;
}

const OPTIONS: { value: SearchType; label: string; icon: string }[] = [
  { value: 'packages', label: 'Packages', icon: 'fas fa-suitcase-rolling' },
  { value: 'agents', label: 'Agents', icon: 'fas fa-user-tie' },
];

// The one control that decides whether a customer gets offers or agencies.
//
// Deliberately a single shared component: there used to be one of these in the
// search bar and another above the results, which left two controls for one
// piece of state and no obvious winner if they disagreed.
const ModeSwitch: React.FC<ModeSwitchProps> = ({ value, onChange, className = '' }) => (
  <div className={`bma-switch ${className}`} role="radiogroup" aria-label="Search for">
    {OPTIONS.map((option) => {
      const isActive = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={isActive}
          className={`bma-switch-btn${isActive ? ' is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          <i className={option.icon} aria-hidden="true"></i>
          {option.label}
        </button>
      );
    })}
  </div>
);

export default ModeSwitch;
