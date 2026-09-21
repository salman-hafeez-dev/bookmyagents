import React, { useState } from 'react';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useAuth } from '../../../contexts/AuthContext';
import { blogService } from '../../../services/blogService';
import { type Blog, type BlogFilters, type BlogStats } from '../../../types/blog';
import BlogTable from './BlogTable';
import { IconButton } from '../../ui';
import AgentBlogDetail from './AgentBlogDetail';
import AgentBlogForm from './AgentBlogForm';
import BlogStatsCard from './BlogStatsCard';
import { useGetAgentBlogsQuery } from '../../../redux/api/dashboardApi';

type ActiveView = 'list' | 'detail' | 'create' | 'edit';

const AgentBlogManagement: React.FC = () => {
    // Shadows window.confirm with the styled dialog.
    const confirm = useConfirm();
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<ActiveView>('list');
    const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
    // Stats were never actually wired up for agents (fetchStats was
    // dead/commented-out code before this refactor) — preserved as-is.
    const [stats] = useState<BlogStats | null>(null);
    const [filters, setFilters] = useState<BlogFilters>({
        page: 1,
        limit: 10,
        author: user?._id, // Filter by current user
        search: ''
    });

    const {
        data: blogsResponse,
        isFetching: loading,
        refetch: refetchBlogs,
    } = useGetAgentBlogsQuery(filters, { skip: !user?._id });
    const blogs = blogsResponse?.data.blogs || [];
    const pagination = blogsResponse?.data.pagination
        ? {
            total: blogsResponse.data.pagination.total,
            page: blogsResponse.data.pagination.page,
            limit: blogsResponse.data.pagination.limit,
            totalPages: blogsResponse.data.pagination.pages,
        }
        : { total: 0, page: 1, limit: 10, totalPages: 0 };

    const handleDeleteBlog = async (blogId: string) => {
        if (!await confirm({
                                                title: 'Delete Blog',
                                                heading: 'Permanent Deletion',
                                                description: 'This blog post will be permanently removed and can no longer be viewed by anyone.',
                                                icon: 'error',
                                                actionColor: 'danger',
                                                actionLabel: 'Delete Blog',
                                                dangerZone: true,
                                            })) {
            return;
        }

        try {
            await blogService.deletePublicBlog(blogId);
            refetchBlogs();
        } catch (error) {
            console.error('Error deleting blog:', error);
        }
    };

    const handleViewDetail = (blog: Blog) => {
        setSelectedBlog(blog);
        setActiveView('detail');
    };

    const handleBackToList = () => {
        setActiveView('list');
        setSelectedBlog(null);
    };

    const handleAddBlog = () => {
        setActiveView('create');
        setSelectedBlog(null);
    };

    const handleEditBlog = (blog: Blog) => {
        setSelectedBlog(blog);
        setActiveView('edit');
    };

    const handleBlogSaved = () => {
        setActiveView('list');
        setSelectedBlog(null);
        refetchBlogs();
    };

    const handleFilterChange = (newFilters: Partial<BlogFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    if (activeView === 'detail' && selectedBlog) {
        return (
            <AgentBlogDetail
                blog={selectedBlog}
                onBack={handleBackToList}
                onEdit={handleEditBlog}
                onDelete={handleDeleteBlog}
            />
        );
    }

    if (activeView === 'create') {
        return (
            <AgentBlogForm
                onSave={handleBlogSaved}
                onCancel={handleBackToList}
            />
        );
    }

    if (activeView === 'edit' && selectedBlog) {
        return (
            <AgentBlogForm
                blog={selectedBlog}
                onSave={handleBlogSaved}
                onCancel={handleBackToList}
                isEdit={true}
            />
        );
    }

    return (
        <div className="agent-blog-management">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box">
                        <h4 className="page-title">My Blog Posts</h4>
                        <p className="text-muted">Manage your blog posts and track their status</p>
                    </div>
                </div>
            </div>

            {stats && (
                <div className="row mb-4">
                    <BlogStatsCard stats={stats} />
                </div>
            )}

            <div className="row">
                <div className="col-12">
                    <BlogTable
                        title="My Blog Posts"
                        blogs={blogs}
                        loading={loading}
                        filters={filters}
                        pagination={pagination}
                        onFilterChange={handleFilterChange}
                        onPageChange={handlePageChange}
                        onViewDetail={handleViewDetail}
                        onAddBlog={handleAddBlog}
                        rowActions={(blog) => (
                            <>
                                {/* Editable until it has been ruled on; deletable
                                    only once rejected — the same rules the
                                    previous AgentBlogList encoded. */}
                                {blog.status !== 'approved' && blog.status !== 'rejected' && (
                                    <IconButton
                                        icon="far fa-pen-to-square"
                                        label="Edit"
                                        onClick={() => handleEditBlog(blog)}
                                    />
                                )}
                                {blog.status === 'rejected' && (
                                    <IconButton
                                        icon="far fa-trash-can"
                                        label="Delete"
                                        tone="danger"
                                        onClick={() => handleDeleteBlog(blog._id)}
                                    />
                                )}
                            </>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default AgentBlogManagement;
