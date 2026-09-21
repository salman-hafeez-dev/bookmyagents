import React from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** The tooltip text. When empty, the child renders with no wrapper at all. */
  label: string;
  placement?: TooltipPlacement;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  className?: string;
}

/**
 * A small CSS-only tooltip.
 *
 * Replaces the 64 raw `title=""` attributes scattered through the app. Native
 * tooltips take about a second to appear, can't be styled, and never show on
 * touch — which made icon-only buttons effectively unlabelled on mobile.
 *
 * No dependency and no JavaScript positioning: the bubble is a pseudo-element
 * positioned against the wrapper, shown on hover and on keyboard focus. That
 * covers a table's row actions, which is what this exists for. Anything
 * needing collision detection or a portal should not be a tooltip.
 *
 * The label is also applied as `aria-label` on the child when the child has no
 * text of its own, so screen readers announce it rather than reading out an
 * empty button.
 */
const Tooltip: React.FC<TooltipProps> = ({ label, placement = 'top', children, className = '' }) => {
  if (!label) return children;

  return (
    <span
      className={`ui-tooltip ui-tooltip--${placement} ${className}`.trim()}
      data-ui-tooltip={label}
    >
      {React.cloneElement(children, {
        'aria-label': children.props['aria-label'] || label,
      })}
    </span>
  );
};

export default Tooltip;
