import React, { useState, useRef } from 'react';
import { blogService, type CreateBlogData } from '../../../services/blogService';
import { type Blog } from '../../../types/blog';
import RichTextEditor from '../../common/RichTextEditor';

interface BlogFormProps {
    blog?: Blog;
    onSave: (blog: Blog) => void;
    onCancel: () => void;
    isEdit?: boolean;
}

const BlogForm: React.FC<BlogFormProps> = ({
    blog,
    onSave,
    onCancel,
    isEdit = false
}) => {
    const [formData, setFormData] = useState<CreateBlogData>({
        title: blog?.title || '',
        content: blog?.content || '',
        coverImage: blog?.coverImage || '',
        isPublished: blog?.isPublished || false
    });
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(blog?.coverImage || null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleContentChange = (content: string) => {
        setFormData(prev => ({
            ...prev,
            content
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        try {
            setUploadingImage(true);
            const imageUrl = await blogService.uploadBlogImage(file);
            setFormData(prev => ({
                ...prev,
                coverImage: imageUrl
            }));
            setImagePreview(imageUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }

        if (!formData.content.trim()) {
            alert('Please enter content');
            return;
        }

        try {
            setLoading(true);
            let savedBlog: Blog;

            if (isEdit && blog) {
                savedBlog = await blogService.updateBlog(blog._id, formData);
            } else {
                savedBlog = await blogService.createBlog(formData);
            }

            onSave(savedBlog);
        } catch (error) {
            console.error('Error saving blog:', error);
            alert('Failed to save blog. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({
            ...prev,
            coverImage: ''
        }));
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="admin-blog-form">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4 className="page-title">
                                {isEdit ? 'Edit Blog' : 'Create New Blog'}
                            </h4>
                            <p className="text-muted">
                                {isEdit ? 'Update blog information' : 'Create a new blog post'}
                            </p>
                        </div>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={onCancel}
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            Back to List
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Blog Content</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label">
                                        Title <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Enter blog title"
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="content" className="form-label">
                                        Content <span className="text-danger">*</span>
                                    </label>
                                    <RichTextEditor
                                        content={formData.content}
                                        onChange={handleContentChange}
                                        placeholder="Write your blog content here..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Blog Settings</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label htmlFor="coverImage" className="form-label">
                                        Cover Image
                                    </label>

                                    {imagePreview ? (
                                        <div className="mb-3">
                                            <img
                                                src={imagePreview}
                                                alt="Cover preview"
                                                className="img-fluid rounded mb-2"
                                                style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                                            />
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={removeImage}
                                                >
                                                    <i className="fas fa-trash me-1"></i>
                                                    Remove
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <i className="fas fa-edit me-1"></i>
                                                    Change
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-3">
                                            <div
                                                className="border rounded p-4 text-center"
                                                style={{ borderStyle: 'dashed' }}
                                                onClick={() => fileInputRef.current?.click()}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <i className="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                                                <p className="text-muted mb-0">Click to upload cover image</p>
                                                <small className="text-muted">JPG, PNG, GIF (Max 5MB)</small>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="form-control d-none"
                                        id="coverImage"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                    />

                                    {uploadingImage && (
                                        <div className="text-center mt-2">
                                            <div className="spinner-border spinner-border-sm" role="status">
                                                <span className="visually-hidden">Uploading...</span>
                                            </div>
                                            <small className="text-muted ms-2">Uploading image...</small>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="isPublished"
                                            name="isPublished"
                                            checked={formData.isPublished}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label" htmlFor="isPublished">
                                            Publish immediately
                                        </label>
                                    </div>
                                    <small className="text-muted">
                                        If checked, the blog will be published right away. Otherwise, it will be saved as draft.
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div className="card mt-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Actions</h6>
                            </div>
                            <div className="card-body">
                                <div className="d-grid gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || uploadingImage}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </span>
                                                {isEdit ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-2"></i>
                                                {isEdit ? 'Update Blog' : 'Create Blog'}
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={onCancel}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BlogForm;
