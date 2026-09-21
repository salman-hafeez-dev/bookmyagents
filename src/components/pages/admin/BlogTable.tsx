import React, { useEffect, useState } from 'react';
import { type Blog, type BlogFilters } from '../../../types/blog';
import { Badge, Button, DataTable, IconButton, Select, type BadgeTone, type DataTableColumn } from '../../ui';

interface BlogTableProps {
  blogs: Blog[];
  loading: boolean;
  filters: BlogFilters;
  pagination: { total: number; page: number; limit: number; totalPages: number };
  onFilterChange: (filters: Partial<BlogFilters>) => void;
  onPageChange: (page: number) => void;
  onViewDetail: (blog: Blog) => void;
  onAddBlog?: () => void;

  title: string;
  /** Admin sees who wrote it; an agent is only ever shown their own posts. */
  showAuthor?: boolean;
  /** The per-row controls, which are the only real difference between the two
   *  screens: the admin approves and rejects, the agent edits and deletes. */
  rowActions?: (blog: Blog) => React.ReactNode;
}

const STATUS_TONES: Record<string, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

/**
 * The blog table, shared by the admin moderation queue and the agent's own
 * list.
 *
 * These were two files, BlogList and AgentBlogList, ~280 lines each and
 * identical apart from the heading, the author column and the row buttons —
 * including two copies of a Bootstrap pager that rendered every page number,
 * so fifty pages meant fifty buttons.
 */
const BlogTable: React.FC<BlogTableProps> = ({
  blogs, loading, filters, pagination,
  onFilterChange, onPageChange, onViewDetail, onAddBlog,
  title, showAuthor = false, rowActions,
}) => {
  // The blog endpoints filter server-side, so the box is debounced rather than
  // firing a request per keystroke.
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim() || undefined;
      if (next !== filters.search) onFilterChange({ search: next });
    }, 400);
    return () => clearTimeout(timer);
    // filters.search is read but deliberately not a trigger: including it would
    // re-run this the moment the parent echoes the value back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const columns: DataTableColumn<Blog>[] = [
    {
      key: 'title',
      header: 'Title',
      width: '100px',
      render: (blog) => (
        <div className="d-flex align-items-center gap-3">
          <img
            src={blog.coverImage || '/assets/img/placeholder/placeholder.png'}
            alt=""
            className="rounded flex-shrink-0"
            style={{ width: 48, height: 48, objectFit: 'cover' }}
            loading="lazy"
          />
          <div className="min-w-0">
            <div className="fw-semibold">{blog.title}</div>
            {/* The content preview was deliberately dropped from this cell —
                re-add it here if the title alone proves too thin. */}
          </div>
        </div>
      ),
    },
    ...(showAuthor ? [{
      key: 'author',
      header: 'Author',
      hideBelow: 'lg' as const,
      render: (blog: Blog) => (
        <span className="text-muted">
          {typeof blog.author === 'object' && blog.author?.email
            ? blog.author.email
            : String(blog.author)}
        </span>
      ),
    }] : []),
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (blog) => (
        <Badge tone={STATUS_TONES[blog.status] || 'neutral'} dot>
          {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      nowrap: true,
      hideBelow: 'md',
      render: (blog) => <small className="text-muted">{formatDate(blog.createdAt)}</small>,
    },
    {
      key: 'published',
      header: 'Published',
      nowrap: true,
      hideBelow: 'lg',
      render: (blog) => (blog.isPublished
        ? <small className="text-success">{blog.publishedAt ? formatDate(blog.publishedAt) : 'Yes'}</small>
        : <small className="text-muted">No</small>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: rowActions ? '132px' : '64px',
      render: (blog) => (
        <div className="ui-actions">
          <IconButton icon="far fa-eye" label="View details" onClick={() => onViewDetail(blog)} />
          {rowActions?.(blog)}
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(filters.search || filters.status || filters.author);

  return (
    <DataTable<Blog>
      columns={columns}
      rows={blogs}
      rowKey={(blog) => blog._id}
      title={title}
      loading={loading}
      search={{
        placeholder: 'Search blogs by title…',
        value: searchInput,
        onChange: setSearchInput,
      }}
      actions={onAddBlog && (
        <Button icon="fas fa-plus" size="sm" onClick={onAddBlog}>Add blog</Button>
      )}
      toolbar={(
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          value={filters.status || ''}
          size="sm"
          aria-label="Filter by status"
          onChange={(event) =>
            onFilterChange({ status: (event.target.value as BlogFilters['status']) || undefined })}
        />
      )}
      pagination={{
        page: pagination.page,
        pages: pagination.totalPages,
        total: pagination.total,
        limit: pagination.limit,
        onChange: onPageChange,
        noun: 'blogs',
      }}
      emptyState={{
        icon: 'fas fa-blog',
        title: 'No blogs found',
        description: hasFilters
          ? 'No blog matches your current filters. Try adjusting them.'
          : 'Get started by creating your first blog post.',
        action: onAddBlog && !hasFilters
          ? <Button onClick={onAddBlog}>Create new blog</Button>
          : undefined,
      }}
    />
  );
};

export default BlogTable;
