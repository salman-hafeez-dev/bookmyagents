import React from 'react';

interface PagerProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
  // What is being counted, so the summary reads naturally.
  noun?: string;
}

// Page numbers around the current page, with ellipses, so a long list does not
// produce a row of fifty buttons.
const pageWindow = (page: number, pages: number): (number | '…')[] => {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

  const items: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);

  if (start > 2) items.push('…');
  for (let index = start; index <= end; index += 1) items.push(index);
  if (end < pages - 1) items.push('…');

  items.push(pages);
  return items;
};

const Pager: React.FC<PagerProps> = ({ page, pages, total, limit, onChange, noun = 'items' }) => {
  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav className="bma-pager" aria-label="Pagination">
      <span className="bma-pager-info">
        Showing {first}–{last} of {total} {noun}
      </span>

      {pages > 1 && (
        <div className="bma-pager-controls">
          <button
            type="button"
            className="bma-pager-btn"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <i className="fas fa-chevron-left" aria-hidden="true"></i>
          </button>

          {pageWindow(page, pages).map((item, index) => (
            item === '…' ? (
              <span key={`gap-${index}`} className="bma-pager-info px-1">…</span>
            ) : (
              <button
                key={item}
                type="button"
                className={`bma-pager-btn${item === page ? ' is-active' : ''}`}
                onClick={() => onChange(item)}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </button>
            )
          ))}

          <button
            type="button"
            className="bma-pager-btn"
            onClick={() => onChange(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
          >
            <i className="fas fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Pager;
