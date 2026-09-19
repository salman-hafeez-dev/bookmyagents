import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  // Omit to render a read-only rating.
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 13, md: 17, lg: 28 };

// Stars, read-only or interactive.
//
// The interactive form is a radio group rather than a row of buttons, so it is
// reachable and settable from the keyboard — a plain click target would leave
// the only required field on the review form unusable without a mouse.
const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 'md', className = '' }) => {
  const [hovered, setHovered] = useState(0);
  const fontSize = SIZES[size];
  const shown = hovered || value;

  if (!onChange) {
    return (
      <span
        className={`bma-stars ${className}`}
        style={{ fontSize }}
        role="img"
        aria-label={`${value} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star${star <= Math.round(value) ? ' is-filled' : ''}`}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  }

  return (
    <span
      className={`bma-stars is-interactive ${className}`}
      style={{ fontSize }}
      role="radiogroup"
      aria-label="Your rating"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          className="bma-star-btn"
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <i className={`fas fa-star${star <= shown ? ' is-filled' : ''}`} aria-hidden="true" />
        </button>
      ))}
    </span>
  );
};

export default StarRating;
