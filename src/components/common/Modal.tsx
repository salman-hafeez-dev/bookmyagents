import React, { useCallback, useEffect, useRef, type ReactNode } from 'react';
import ModalPortal from './ModalPortal';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Called for every dismissal route: close button, backdrop, Escape. */
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** sm 440 · md 620 (default) · lg 860 · xl 1040 · full 90vw×88vh */
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Footer actions. Omitted entirely when not provided, so no empty bar. */
  footer?: ReactNode;
  /**
   * When set, body + footer are wrapped in a <form>, so a submit button in the
   * footer still submits. Saves every form modal hand-rolling the wrapper.
   */
  onSubmit?: (event: React.FormEvent) => void;
  /**
   * While true, backdrop and Escape dismissal are suppressed and the close
   * button is disabled — a modal mid-save shouldn't vanish under the user.
   */
  busy?: boolean;
  /** Drops body padding, for edge-to-edge content such as an iframe. */
  flushBody?: boolean;
  /** Dark surface, for image/PDF lightboxes. */
  dark?: boolean;
  className?: string;
  bodyClassName?: string;
  /** Falls back to `title` when that is a plain string. */
  ariaLabel?: string;
  children: ReactNode;
}

// Modals can stack (a lightbox opened from a details modal), so the lock is
// reference-counted — the innermost closing must not restore scrolling while an
// outer modal is still open.
let openModalCount = 0;
let previousBodyOverflow = '';

function lockBodyScroll() {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  openModalCount += 1;
}

function releaseBodyScroll() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

/**
 * The project's single modal surface.
 *
 * Built on the existing ModalPortal (which escapes the dashboard shell's
 * `transform`, since that would otherwise make it the containing block for
 * `position: fixed` children and clip the modal to the content area).
 *
 * Presentation only — callers keep their own state, API calls and validation.
 */
const Modal: React.FC<ModalProps> = ({
  onClose,
  title,
  subtitle,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  onSubmit,
  busy = false,
  flushBody = false,
  dark = false,
  className = '',
  bodyClassName = '',
  ariaLabel,
  children,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const requestClose = useCallback(() => {
    if (busy) return;
    onClose();
  }, [busy, onClose]);

  useEffect(() => {
    lockBodyScroll();
    return releaseBodyScroll;
  }, []);

  useEffect(() => {
    if (!closeOnEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeOnEscape, requestClose]);

  const handleBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only a click that starts and ends on the backdrop itself dismisses —
    // a drag that began inside the modal must not close it.
    if (!closeOnBackdrop) return;
    if (event.target !== overlayRef.current) return;
    requestClose();
  };

  const header = (title || showCloseButton) ? (
    <div className="app-modal__header">
      <div className="app-modal__titles">
        {title && <h2 className="app-modal__title">{title}</h2>}
        {subtitle && <span className="app-modal__subtitle">{subtitle}</span>}
      </div>
      {showCloseButton && (
        <button
          type="button"
          className="app-modal__close"
          onClick={requestClose}
          disabled={busy}
          aria-label="Close"
        >
          <i className="fas fa-times" aria-hidden="true" />
        </button>
      )}
    </div>
  ) : null;

  const body = (
    <div className={`app-modal__body${flushBody ? ' app-modal__body--flush' : ''}${bodyClassName ? ` ${bodyClassName}` : ''}`}>
      {children}
    </div>
  );

  const footerNode = footer ? <div className="app-modal__footer">{footer}</div> : null;

  return (
    <ModalPortal>
      <div
        ref={overlayRef}
        className="app-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === 'string' ? title : undefined)}
        onMouseDown={handleBackdrop}
      >
        <div className={`app-modal app-modal--${size}${dark ? ' app-modal--dark' : ''}${className ? ` ${className}` : ''}`}>
          {header}
          {onSubmit ? (
            <form className="app-modal__form" onSubmit={onSubmit}>
              {body}
              {footerNode}
            </form>
          ) : (
            <>
              {body}
              {footerNode}
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default Modal;
