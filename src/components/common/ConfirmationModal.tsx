import React, { useEffect, type ReactNode } from 'react';
import Modal, { type ModalSize } from './Modal';

export type ConfirmationTone = 'danger' | 'primary' | 'success';
export type ConfirmationIcon = 'warning' | 'error' | 'success' | 'password' | 'security' | 'info';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  /** Section heading, shown under the icon with a coloured underline. */
  heading?: string;
  description?: string;
  icon?: ConfirmationIcon;
  actionLabel?: string;
  cancelLabel?: string;
  /** Drives the icon circle, heading underline and confirm button colour. */
  actionColor?: ConfirmationTone;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** Extra content (a form, a list of consequences) below the description. */
  children?: ReactNode;
  /** Adds the irreversible-action warning above the buttons. */
  dangerZone?: boolean;
  /** Set false to require an explicit button press (e.g. destructive actions). */
  confirmOnEnter?: boolean;
  /** Blocks confirming while a nested form is invalid. */
  confirmDisabled?: boolean;
  /** Defaults to 'sm'; dialogs carrying a form want more room. */
  size?: ModalSize;
}

const ICONS: Record<ConfirmationIcon, string> = {
  warning: 'fas fa-triangle-exclamation',
  error: 'fas fa-circle-xmark',
  success: 'fas fa-circle-check',
  password: 'fas fa-key',
  security: 'fas fa-lock',
  info: 'fas fa-circle-info',
};

const BUTTON_CLASS: Record<ConfirmationTone, string> = {
  danger: 'btn btn-danger',
  primary: 'btn btn-primary',
  success: 'btn btn-success',
};

/**
 * The project's single confirmation dialog.
 *
 * Presentation only — it renders on top of the shared Modal and leaves the
 * caller owning its own state, API call, toasts and error handling.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  subtitle,
  heading,
  description,
  icon = 'warning',
  actionLabel = 'Confirm',
  cancelLabel = 'Cancel',
  actionColor = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  children,
  dangerZone = false,
  confirmOnEnter,
  confirmDisabled = false,
  size = 'sm',
}) => {
  // Enter confirms — but never for a destructive action, where a stray
  // keypress shouldn't be able to delete something.
  const enterConfirms = confirmOnEnter ?? actionColor !== 'danger';

  useEffect(() => {
    if (!isOpen || !enterConfirms) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      // Let Enter do its normal thing inside a textarea or on a button.
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON')) return;
      if (loading || confirmDisabled) return;
      event.preventDefault();
      onConfirm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, enterConfirms, loading, confirmDisabled, onConfirm]);

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onCancel}
      title={title}
      subtitle={subtitle}
      size={size}
      busy={loading}
      footer={(
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={BUTTON_CLASS[actionColor]}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Working…
              </>
            ) : actionLabel}
          </button>
        </>
      )}
    >
      <div className="app-confirm">
        <div className={`app-confirm__icon app-confirm__icon--${actionColor}`} aria-hidden="true">
          <i className={ICONS[icon]} />
        </div>

        {heading && (
          <h3 className={`app-confirm__heading app-confirm__heading--${actionColor}`}>{heading}</h3>
        )}

        {description && <p className="app-confirm__description">{description}</p>}

        {children && <div className="app-confirm__body">{children}</div>}

        {dangerZone && (
          <p className="app-confirm__danger-note" role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            This action cannot be undone.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
