import React, { useState } from 'react';
import { blogService } from '../../../services/blogService';
import { type Blog, type BlogFilters } from '../../../types/blog';
import BlogTable from './BlogTable';
import { IconButton } from '../../ui';
import BlogDetail from './BlogDetail';
import BlogStatsCard from './BlogStatsCard';
import BlogForm from './BlogForm';
import { useGetAdminBlogsQuery, useGetBlogStatsQuery } from '../../../redux/api/dashboardApi';

type ActiveView = 'list' | 'detail' | 'create' | 'edit';

const BlogManagement: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>('list');
    const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [filters, setFilters] = useState<BlogFilters>({
        page: 1,
        limit: 10,
        status: undefined,
        author: undefined,
        search: ''
    });

    const {
        data: blogsResponse,
        isFetching: loading,
        refetch: refetchBlogs,
    } = useGetAdminBlogsQuery(filters);
    const blogs = blogsResponse?.data.blogs || [];
    const pagination = blogsResponse?.data.pagination
        ? {
            total: blogsResponse.data.pagination.total,
            page: blogsResponse.data.pagination.page,
            limit: blogsResponse.data.pagination.limit,
            totalPages: blogsResponse.data.pagination.pages,
        }
        : { total: 0, page: 1, limit: 10, totalPages: 0 };

    const { data: stats, refetch: refetchStats } = useGetBlogStatsQuery();

    const handleApprove = async (blogId: string) => {
        try {
            await blogService.approveBlog(blogId);
            refetchBlogs();
            refetchStats();
            // Show success message
            setSuccessMessage('Blog approved successfully!');
            // Redirect back to list view
            setActiveView('list');
            setSelectedBlog(null);
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error approving blog:', error);
        }
    };

    const handleReject = async (blogId: string) => {
        try {
            await blogService.rejectBlog(blogId);
            refetchBlogs();
            refetchStats();
            // Show success message
            setSuccessMessage('Blog rejected successfully!');
            // Redirect back to list view
            setActiveView('list');
            setSelectedBlog(null);
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error rejecting blog:', error);
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
        refetchStats();
    };

    const handleFilterChange = (newFilters: Partial<BlogFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    if (activeView === 'detail' && selectedBlog) {
        return (
            <BlogDetail
                blog={selectedBlog}
                onBack={handleBackToList}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEditBlog}
            />
        );
    }

    if (activeView === 'create') {
        return (
            <BlogForm
                onSave={handleBlogSaved}
                onCancel={handleBackToList}
            />
        );
    }

    if (activeView === 'edit' && selectedBlog) {
        return (
            <BlogForm
                blog={selectedBlog}
                onSave={handleBlogSaved}
                onCancel={handleBackToList}
                isEdit={true}
            />
        );
    }

    return (
        <div className="admin-blog-management">
            {/* Success Message */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="fas fa-check-circle me-2"></i>
                    {successMessage}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setSuccessMessage(null)}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            <div className="row">
                <div className="col-12">
                    <div className="page-title-box">
                        <h4 className="page-title">Blog Management</h4>
                        <p className="text-muted">Manage and moderate blog posts</p>
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
                        title="Blog Posts"
                        showAuthor
                        blogs={blogs}
                        loading={loading}
                        filters={filters}
                        pagination={pagination}
                        onFilterChange={handleFilterChange}
                        onPageChange={handlePageChange}
                        onViewDetail={handleViewDetail}
                        onAddBlog={handleAddBlog}
                        rowActions={(blog) => blog.status === 'pending' && (
                            <>
                                <IconButton
                                    icon="far fa-circle-check"
                                    label="Approve"
                                    tone="success"
                                    onClick={() => handleApprove(blog._id)}
                                />
                                <IconButton
                                    icon="far fa-circle-xmark"
                                    label="Reject"
                                    tone="danger"
                                    onClick={() => handleReject(blog._id)}
                                />
                            </>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default BlogManagement;
