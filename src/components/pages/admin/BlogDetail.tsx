import React from 'react';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { type Blog } from '../../../types/blog';

interface BlogDetailProps {
    blog: Blog;
    onBack: () => void;
    onApprove: (blogId: string) => void;
    onReject: (blogId: string) => void;
    onEdit?: (blog: Blog) => void;
}

const BlogDetail: React.FC<BlogDetailProps> = ({
    blog,
    onBack,
    onApprove,
    onReject,
    onEdit
}) => {
    // Shadows window.confirm with the styled dialog.
    const confirm = useConfirm();
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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="admin-blog-detail">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={onBack}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Back to List
                            </button>
                        </div>
                        <div>
                            <div className="btn-group me-2">
                                {onEdit && (
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => onEdit(blog)}
                                    >
                                        <i className="fas fa-edit me-2"></i>
                                        Edit
                                    </button>
                                )}
                            </div>

                            {blog.status === 'pending' && (
                                <div className="btn-group">
                                    <button
                                        className="btn btn-success"
                                        onClick={async () => {
                                            if (await confirm({
                                                title: 'Approve Blog',
                                                heading: 'Publish This Post',
                                                description: 'The blog will be published and visible to users.',
                                                icon: 'success',
                                                actionColor: 'success',
                                                actionLabel: 'Approve & Publish',
                                            })) {
                                                onApprove(blog._id);
                                            }
                                        }}
                                    >
                                        <i className="fas fa-check me-2"></i>
                                        Approve
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={async () => {
                                            if (await confirm({
                                                title: 'Reject Blog',
                                                heading: 'Send Back To Author',
                                                description: 'The author will be notified and can make changes before resubmitting.',
                                                icon: 'warning',
                                                actionColor: 'danger',
                                                actionLabel: 'Reject Blog',
                                            })) {
                                                onReject(blog._id);
                                            }
                                        }}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">Blog Details</h5>
                                {getStatusBadge(blog.status)}
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-8">
                                    <h2 className="mb-3">{blog.title}</h2>

                                    <div className="mb-4">
                                        <img
                                            src={blog.coverImage || '/assets/img/placeholder/placeholder.png'}
                                            alt={blog.title}
                                            className="img-fluid rounded"
                                            style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                                        />
                                    </div>

                                    <div className="blog-content">
                                        <h6 className="text-muted mb-3">Content:</h6>
                                        <div
                                            className="border rounded p-3"
                                            style={{
                                                maxHeight: '500px',
                                                overflowY: 'auto',
                                                backgroundColor: '#f8f9fa'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: blog.content }}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="card-title mb-0">Blog Information</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Author:</label>
                                                <p className="text-muted">
                                                    {typeof blog.author === 'object' && blog.author?.email
                                                        ? blog.author.email
                                                        : String(blog.author)
                                                    }
                                                </p>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Slug:</label>
                                                <p className="text-muted">{blog.slug}</p>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Status:</label>
                                                <div>{getStatusBadge(blog.status)}</div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Published:</label>
                                                <p className="text-muted">
                                                    {blog.isPublished ? 'Yes' : 'No'}
                                                </p>
                                            </div>

                                            {blog.publishedAt && (
                                                <div className="mb-3">
                                                    <label className="form-label fw-bold">Published At:</label>
                                                    <p className="text-muted">{formatDate(blog.publishedAt)}</p>
                                                </div>
                                            )}

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Created At:</label>
                                                <p className="text-muted">{formatDate(blog.createdAt)}</p>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Updated At:</label>
                                                <p className="text-muted">{formatDate(blog.updatedAt)}</p>
                                            </div>

                                            {blog.approvedBy && (
                                                <div className="mb-3">
                                                    <label className="form-label fw-bold">Approved By:</label>
                                                    <p className="text-muted">
                                                        {typeof blog.approvedBy === 'object' && blog.approvedBy?.email
                                                            ? blog.approvedBy.email
                                                            : String(blog.approvedBy)
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            {blog.approvedAt && (
                                                <div className="mb-3">
                                                    <label className="form-label fw-bold">Approved At:</label>
                                                    <p className="text-muted">{formatDate(blog.approvedAt)}</p>
                                                </div>
                                            )}

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Likes:</label>
                                                <p className="text-muted">{blog.likes.length}</p>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Dislikes:</label>
                                                <p className="text-muted">{blog.dislikes.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {blog.status === 'pending' && (
                                        <div className="card mt-3">
                                            <div className="card-header">
                                                <h6 className="card-title mb-0">Moderation Actions</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="d-grid gap-2">
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={async () => {
                                                            if (await confirm({
                                                title: 'Approve Blog',
                                                heading: 'Publish This Post',
                                                description: 'The blog will be published and visible to users.',
                                                icon: 'success',
                                                actionColor: 'success',
                                                actionLabel: 'Approve & Publish',
                                            })) {
                                                                onApprove(blog._id);
                                                            }
                                                        }}
                                                    >
                                                        <i className="fas fa-check me-2"></i>
                                                        Approve Blog
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={async () => {
                                                            if (await confirm({
                                                title: 'Reject Blog',
                                                heading: 'Send Back To Author',
                                                description: 'The author will be notified and can make changes before resubmitting.',
                                                icon: 'warning',
                                                actionColor: 'danger',
                                                actionLabel: 'Reject Blog',
                                            })) {
                                                                onReject(blog._id);
                                                            }
                                                        }}
                                                    >
                                                        <i className="fas fa-times me-2"></i>
                                                        Reject Blog
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;
