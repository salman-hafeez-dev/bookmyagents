import React, { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import ConfirmationModal, {
  type ConfirmationIcon,
  type ConfirmationTone,
} from '../components/common/ConfirmationModal';

export interface ConfirmOptions {
  title: string;
  subtitle?: string;
  heading?: string;
  description?: string;
  icon?: ConfirmationIcon;
  actionLabel?: string;
  cancelLabel?: string;
  actionColor?: ConfirmationTone;
  dangerZone?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirmation, so a call site reads exactly like the
 * `window.confirm` it replaces:
 *
 *   if (!(await confirm({ title: 'Delete blog', ... }))) return;
 *
 * One dialog instance is shared by the whole app. For confirmations that need
 * their own form fields, use <ConfirmationModal> directly instead.
 */
export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // Held across renders so the modal's buttons can settle the promise the
  // caller is awaiting.
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((nextOptions) => {
    setOptions(nextOptions);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (result: boolean) => {
    setOptions(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmationModal
        isOpen={!!options}
        title={options?.title || ''}
        subtitle={options?.subtitle}
        heading={options?.heading}
        description={options?.description}
        icon={options?.icon}
        actionLabel={options?.actionLabel}
        cancelLabel={options?.cancelLabel}
        actionColor={options?.actionColor}
        dangerZone={options?.dangerZone}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within a ConfirmProvider');
  return confirm;
};
