import React from 'react';
import { type Blog, type BlogFilters } from '../../../types/blog';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';

interface BlogListProps {
    blogs: Blog[];
    loading: boolean;
    filters: BlogFilters;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    onFilterChange: (filters: Partial<BlogFilters>) => void;
    onPageChange: (page: number) => void;
    onViewDetail: (blog: Blog) => void;
    onApprove: (blogId: string) => void;
    onReject: (blogId: string) => void;
    onAddBlog?: () => void;
}

const BlogList: React.FC<BlogListProps> = ({
    blogs,
    loading,
    filters,
    pagination,
    onFilterChange,
    onPageChange,
    onViewDetail,
    onApprove,
    onReject,
    onAddBlog
}) => {
    const getStatusBadge = (status: string) => {
        const statusClasses = {
            pending: 'badge-warning',
            approved: 'badge-success',
            rejected: 'badge-danger'
        };

        return (
            <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col">
                        <h5 className="card-title mb-0">Blog Posts</h5>
                    </div>
                    <div className="col-auto">
                        <div className="d-flex gap-2">
                            {onAddBlog && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={onAddBlog}
                                    style={{ minWidth: '100px' }}
                                >
                                    <i className="fas fa-plus me-1"></i>
                                    Add Blog
                                </button>
                            )}

                            <select
                                className="form-select form-select-sm"
                                value={filters.status || ''}
                                onChange={(e) => onFilterChange({ status: e.target.value as any || undefined })}
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>

                            {/* <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Search blogs..."
                                value={filters.search || ''}
                                onChange={(e) => onFilterChange({ search: e.target.value })}
                                style={{ minWidth: '200px' }}
                            /> */}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-body">
                {loading ? (
                    <TableSkeleton rows={5} columns={5} />
                ) : blogs.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="mb-4">
                            <i className="fas fa-blog fa-4x text-muted"></i>
                        </div>
                        <h5 className="text-muted mb-3">No blogs found</h5>
                        <p className="text-muted mb-4">
                            {filters.search || filters.status || filters.author
                                ? 'No blogs match your current filters. Try adjusting your search criteria.'
                                : 'Get started by creating your first blog post.'
                            }
                        </p>
                        {onAddBlog && (
                            <button
                                className="btn btn-primary"
                                onClick={onAddBlog}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Create New Blog
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Published</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blogs && blogs.length > 0 && blogs.map((blog) => (
                                    <tr key={blog._id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src={blog.coverImage || '/assets/img/placeholder/placeholder.png'}
                                                    alt={blog.title}
                                                    className="rounded me-3"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                />
                                                <div>
                                                    <h6 className="mb-1">{blog.title}</h6>
                                                    <div className="text-muted small" dangerouslySetInnerHTML={{ __html: truncateText(blog.content) }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-muted">
                                                {typeof blog.author === 'object' && blog.author?.email
                                                    ? blog.author.email
                                                    : String(blog.author)
                                                }
                                            </span>
                                        </td>
                                        <td>
                                            {getStatusBadge(blog.status)}
                                        </td>
                                        <td>
                                            <small className="text-muted">
                                                {formatDate(blog.createdAt)}
                                            </small>
                                        </td>
                                        <td>
                                            {blog.isPublished ? (
                                                <small className="text-success">
                                                    {blog.publishedAt ? formatDate(blog.publishedAt) : 'Yes'}
                                                </small>
                                            ) : (
                                                <small className="text-muted">No</small>
                                            )}
                                        </td>
                                        <td>
                                            <div className="btn-group" role="group">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => onViewDetail(blog)}
                                                    title="View Details"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>

                                                {blog.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={() => onApprove(blog._id)}
                                                            title="Approve"
                                                        >
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => onReject(blog._id)}
                                                            title="Reject"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className="card-footer">
                    <div className="row align-items-center">
                        <div className="col">
                            <p className="text-muted mb-0">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} entries
                            </p>
                        </div>
                        <div className="col-auto">
                            <nav>
                                <ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => onPageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                        >
                                            Previous
                                        </button>
                                    </li>

                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                        <li key={page} className={`page-item ${pagination.page === page ? 'active' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => onPageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        </li>
                                    ))}

                                    <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => onPageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.totalPages}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogList;
