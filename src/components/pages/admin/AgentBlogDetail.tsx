import React from 'react';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { type Blog } from '../../../types/blog';

interface AgentBlogDetailProps {
    blog: Blog;
    onBack: () => void;
    onEdit?: (blog: Blog) => void;
    onDelete?: (blogId: string) => void;
}

const AgentBlogDetail: React.FC<AgentBlogDetailProps> = ({
    blog,
    onBack,
    onEdit,
    onDelete
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

    const canEdit = (blog: Blog) => {
        // Can edit if not approved and not rejected
        return blog.status !== 'approved' && blog.status !== 'rejected';
    };

    const canDelete = (blog: Blog) => {
        // Can delete if rejected only
        return blog.status === 'rejected';
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Your blog is currently under review. You can edit it until it gets approved or rejected.';
            case 'approved':
                return 'Your blog has been approved and is now live! You cannot edit it anymore.';
            case 'rejected':
                return 'Your blog was rejected. You can delete it and create a new one.';
            default:
                return '';
        }
    };

    return (
        <div className="agent-blog-detail">
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
                            <div className="btn-group">
                                {canEdit(blog) && onEdit && (
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => onEdit(blog)}
                                    >
                                        <i className="fas fa-edit me-2"></i>
                                        Edit
                                    </button>
                                )}

                                {canDelete(blog) && onDelete && (
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={async () => {
                                            if (await confirm({
                                                title: 'Delete Blog',
                                                heading: 'Permanent Deletion',
                                                description: 'This blog post will be permanently removed and can no longer be viewed by anyone.',
                                                icon: 'error',
                                                actionColor: 'danger',
                                                actionLabel: 'Delete Blog',
                                                dangerZone: true,
                                            })) {
                                                onDelete(blog._id);
                                            }
                                        }}
                                    >
                                        <i className="fas fa-trash me-2"></i>
                                        Delete
                                    </button>
                                )}
                            </div>
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
                            {/* Status Message */}
                            <div className={`alert ${blog.status === 'approved' ? 'alert-success' :
                                blog.status === 'rejected' ? 'alert-danger' : 'alert-warning'} mb-4`}>
                                <i className={`fas ${blog.status === 'approved' ? 'fa-check-circle' :
                                    blog.status === 'rejected' ? 'fa-times-circle' : 'fa-clock'} me-2`}></i>
                                {getStatusMessage(blog.status)}
                            </div>

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

                                    {/* Action Buttons */}
                                    <div className="card mt-3">
                                        <div className="card-header">
                                            <h6 className="card-title mb-0">Actions</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="d-grid gap-2">
                                                {canEdit(blog) && onEdit && (
                                                    <button
                                                        className="btn btn-warning"
                                                        onClick={() => onEdit(blog)}
                                                    >
                                                        <i className="fas fa-edit me-2"></i>
                                                        Edit Blog
                                                    </button>
                                                )}

                                                {canDelete(blog) && onDelete && (
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={async () => {
                                                            if (await confirm({
                                                title: 'Delete Blog',
                                                heading: 'Permanent Deletion',
                                                description: 'This blog post will be permanently removed and can no longer be viewed by anyone.',
                                                icon: 'error',
                                                actionColor: 'danger',
                                                actionLabel: 'Delete Blog',
                                                dangerZone: true,
                                            })) {
                                                                onDelete(blog._id);
                                                            }
                                                        }}
                                                    >
                                                        <i className="fas fa-trash me-2"></i>
                                                        Delete Blog
                                                    </button>
                                                )}

                                                {blog.status === 'approved' && (
                                                    <div className="alert alert-info mb-0">
                                                        <i className="fas fa-info-circle me-2"></i>
                                                        This blog is live and cannot be edited.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentBlogDetail;
