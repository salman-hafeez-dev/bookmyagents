import api from './api';
import {
    type Blog,
    type BlogDetailsResponse,
    type BlogFilters,
    type BlogListResponse,
    type BlogStats
} from '../types/blog';

export interface CreateBlogData {
    title: string;
    content: string;
    coverImage?: string;
    isPublished?: boolean;
}

export const blogService = {
    // Get all blogs for admin (all statuses)
    getAdminBlogs: async (filters: BlogFilters = {}): Promise<BlogListResponse> => {
        try {
            const params = new URLSearchParams();

            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.status) params.append('status', filters.status);
            if (filters.author) params.append('author', filters.author);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/admin/blogs?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get blogs for agent (only their own blogs)
    getAgentBlogs: async (filters: BlogFilters = {}): Promise<BlogListResponse> => {
        try {
            const params = new URLSearchParams();

            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/users/blogs?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get blogs for agent (public API)
    getPublicAgentBlogs: async (filters: BlogFilters = {}): Promise<BlogListResponse> => {
        try {
            const params = new URLSearchParams();

            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/blogs?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get a single blog by ID
    getBlogById: async (blogId: string): Promise<BlogDetailsResponse> => {
        try {
            const response = await api.get(`/blogs/${blogId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Approve a blog
    approveBlog: async (blogId: string): Promise<Blog> => {
        try {
            const response = await api.put(`/admin/blogs/${blogId}/approve`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Reject a blog
    rejectBlog: async (blogId: string): Promise<Blog> => {
        try {
            const response = await api.put(`/admin/blogs/${blogId}/reject`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get blog statistics
    getBlogStats: async (): Promise<BlogStats> => {
        try {
            const response = await api.get('/admin/blogs/stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete a blog (admin)
    deleteBlog: async (blogId: string): Promise<void> => {
        try {
            await api.delete(`/admin/blogs/${blogId}`);
        } catch (error) {
            throw error;
        }
    },

    // Delete a blog (public API for agents)
    deletePublicBlog: async (blogId: string): Promise<void> => {
        try {
            await api.delete(`/api/blogs/${blogId}`);
        } catch (error) {
            throw error;
        }
    },

    // Create a new blog (admin)
    createBlog: async (blogData: CreateBlogData): Promise<Blog> => {
        try {
            const response = await api.post('/admin/blogs', blogData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Create a new blog (public API for agents)
    createPublicBlog: async (blogData: CreateBlogData): Promise<Blog> => {
        try {
            const response = await api.post('/blogs', blogData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update a blog (admin)
    updateBlog: async (blogId: string, blogData: Partial<CreateBlogData>): Promise<Blog> => {
        try {
            const response = await api.put(`/admin/blogs/${blogId}`, blogData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update a blog (public API for agents)
    updatePublicBlog: async (blogId: string, blogData: Partial<CreateBlogData>): Promise<Blog> => {
        try {
            const response = await api.put(`/blogs/${blogId}`, blogData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Upload blog cover image
    uploadBlogImage: async (file: File): Promise<string> => {
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await api.post('/admin/blogs/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.data?.url || response.data.url;
        } catch (error) {
            throw error;
        }
    },

    // Public API endpoints for published blogs
    getPublishedBlogs: async (page: number = 1, limit: number = 10): Promise<BlogListResponse> => {
        try {
            const response = await api.get(`/blogs?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Like a blog
    likeBlog: async (blogId: string): Promise<Blog> => {
        try {
            const response = await api.post(`/blogs/${blogId}/like`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Dislike a blog
    dislikeBlog: async (blogId: string): Promise<Blog> => {
        try {
            const response = await api.post(`/blogs/${blogId}/dislike`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
