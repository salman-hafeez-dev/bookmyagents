import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders its children into document.body instead of wherever this
 * component sits in the tree.
 *
 * Why this exists: the dashboard shell (.admin-shell-frame) uses
 * `transform` + `overflow: hidden` for GPU-accelerated glass blur. Per
 * the CSS spec, a `transform` on an ancestor makes it the containing
 * block for any `position: fixed` descendant — so every modal rendered
 * from inside the dashboard tree was being sized/clipped relative to
 * that frame instead of the viewport, which is why modals appeared
 * trapped inside the dashboard content area instead of covering the
 * whole page. Portaling to <body> sidesteps this permanently, for every
 * current and future modal, regardless of how the shell's CSS changes.
 */
const ModalPortal: React.FC<{ children: ReactNode }> = ({ children }) => {
  return createPortal(children, document.body);
};

export default ModalPortal;
