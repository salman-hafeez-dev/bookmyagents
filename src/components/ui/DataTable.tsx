import React, { useMemo, useState } from 'react';
import Pager from '../dashboard-admin/Pager';
import { TableSkeleton } from '../dashboard-admin/Skeleton';
import Input from './Input';

export interface DataTableColumn<Row> {
  /** Stable key. Also used as the mobile card's label. */
  key: string;
  header: React.ReactNode;
  /** Cell contents. Given the row and its index. */
  render: (row: Row, index: number) => React.ReactNode;
  /** Right-align numeric and action columns. */
  align?: 'left' | 'right' | 'center';
  /** Stops the column wrapping — for dates, amounts, status pills. */
  nowrap?: boolean;
  /** Hidden below the tablet breakpoint, where horizontal room runs out. */
  hideBelow?: 'sm' | 'md' | 'lg';
  width?: string;
}

export interface DataTablePagination {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
  /** What is being counted, so the summary reads naturally. */
  noun?: string;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;

  title?: React.ReactNode;
  /** Buttons for the header bar — "New page", "Export". */
  actions?: React.ReactNode;
  /** Filters rendered beside the search box. */
  toolbar?: React.ReactNode;

  /**
   * Search box above the table. Pass `{ value, onChange }` to drive it from
   * the caller (server-side search); pass `{ keys }` to let the table filter
   * the rows it was given.
   */
  search?: {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    keys?: (keyof Row)[];
  };

  pagination?: DataTablePagination;

  loading?: boolean;
  /** Shown when there are no rows and nothing is loading. */
  emptyState?: { icon?: string; title: string; description?: string; action?: React.ReactNode };
  /** Rendered instead of the table when a request failed. */
  error?: React.ReactNode;

  /** Extra class on the <table>, for the rare table that needs its own tweak. */
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * The application's table.
 *
 * There were 17 tables here written eight different ways — `table
 * table-striped align-middle`, `table table-hover`, `table table-sm align-middle
 * mb-0` and so on — each with its own search box and, in five cases, its own
 * hand-rolled Previous/Next pagination. This is one table with search and
 * pagination as props.
 *
 * It composes rather than replaces: paging is the existing Pager (which
 * already has an ellipsis window), and the loading state is the existing
 * TableSkeleton.
 *
 * Below the `md` breakpoint each row becomes a stacked card, with the column
 * header shown as the label for each cell. A table of six columns cannot be
 * read on a 375px screen no matter how it scrolls, and `hideBelow` alone only
 * postpones the problem.
 */
function DataTable<Row>({
  columns, rows, rowKey,
  title, actions, toolbar,
  search, pagination,
  loading = false, emptyState, error,
  className = '', size = 'md',
}: DataTableProps<Row>) {
  const [internalQuery, setInternalQuery] = useState('');

  // Controlled when the caller passes a value (server-side search), internal
  // when it only passes `keys`.
  const isControlled = search?.onChange !== undefined;
  const query = isControlled ? (search?.value ?? '') : internalQuery;

  const visibleRows = useMemo(() => {
    if (isControlled || !search?.keys || !query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    return rows.filter((row) =>
      search.keys!.some((key) => String(row[key] ?? '').toLowerCase().includes(needle)));
  }, [rows, query, isControlled, search]);

  const hasHeader = Boolean(title || actions || search || toolbar);

  return (
    <div className="ui-table-wrap">
      {hasHeader && (
        <div className="ui-table-header">
          {(title || actions) && (
            <div className="ui-table-header__top">
              {title && <h4 className="ui-table-header__title">{title}</h4>}
              {actions && <div className="ui-table-header__actions">{actions}</div>}
            </div>
          )}

          {(search || toolbar) && (
            <div className="ui-table-header__tools">
              {search && (
                <div className="ui-table-header__search">
                  <Input
                    type="search"
                    size="sm"
                    icon="fas fa-search"
                    placeholder={search.placeholder || 'Search…'}
                    value={query}
                    onChange={(event) => (isControlled
                      ? search.onChange!(event.target.value)
                      : setInternalQuery(event.target.value))}
                    aria-label={search.placeholder || 'Search'}
                  />
                </div>
              )}
              {toolbar && <div className="ui-table-header__filters">{toolbar}</div>}
            </div>
          )}
        </div>
      )}

      {error ? (
        <div className="ui-table-state">{error}</div>
      ) : loading ? (
        <TableSkeleton rows={5} columns={Math.min(columns.length, 6)} />
      ) : visibleRows.length === 0 ? (
        <div className="ui-table-state ui-table-empty">
          {emptyState?.icon && <i className={emptyState.icon} aria-hidden="true" />}
          <h5>{emptyState?.title || 'Nothing to show yet'}</h5>
          {emptyState?.description && <p>{emptyState.description}</p>}
          {emptyState?.action}
        </div>
      ) : (
        <div className="ui-table-scroll">
          <table className={`ui-table ui-table--${size} ${className}`.trim()}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    className={[
                      column.align ? `text-${column.align}` : '',
                      column.hideBelow ? `ui-hide-below-${column.hideBelow}` : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr key={rowKey(row, index)}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      // Read by the mobile card layout as the cell's label.
                      data-label={typeof column.header === 'string' ? column.header : undefined}
                      className={[
                        column.align ? `text-${column.align}` : '',
                        column.nowrap ? 'ui-nowrap' : '',
                        column.hideBelow ? `ui-hide-below-${column.hideBelow}` : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {column.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.pages > 1 && !loading && !error && (
        <div className="ui-table-footer">
          <Pager
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onChange={pagination.onChange}
            noun={pagination.noun}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;
