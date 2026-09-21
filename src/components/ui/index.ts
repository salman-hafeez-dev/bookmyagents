/**
 * The UI primitives.
 *
 * Import from here rather than reaching into individual files, so a component
 * can move without touching every call site:
 *
 *   import { Button, DataTable, IconButton } from '../../ui';
 */
export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as IconButton } from './IconButton';
export type { IconButtonProps, IconButtonTone } from './IconButton';

export { default as Tooltip } from './Tooltip';
export type { TooltipProps, TooltipPlacement } from './Tooltip';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { default as Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { default as Badge } from './Badge';
export type { BadgeProps, BadgeTone } from './Badge';

export { default as DataTable } from './DataTable';
export type { DataTableProps, DataTableColumn, DataTablePagination } from './DataTable';

export { default as Field } from './Field';
export { useFieldIds } from './useFieldIds';
export type { FieldProps, ControlSize } from './Field';

/* Re-exported so the existing, already-good pieces are part of the same
   surface rather than a second place to look. */
export { default as Modal } from '../common/Modal';
export type { ModalProps, ModalSize } from '../common/Modal';
export { default as Pager } from '../dashboard-admin/Pager';
export { Skeleton, TableSkeleton, CardSkeleton } from '../dashboard-admin/Skeleton';
