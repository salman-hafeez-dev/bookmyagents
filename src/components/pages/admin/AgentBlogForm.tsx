import React, { useState, useRef } from 'react';
import { blogService, type CreateBlogData } from '../../../services/blogService';
import { type Blog } from '../../../types/blog';
import { showToast, getErrorMessage } from '../../../utils/toast';

interface AgentBlogFormProps {
    blog?: Blog;
    onSave: (blog: Blog) => void;
    onCancel: () => void;
    isEdit?: boolean;
}

const AgentBlogForm: React.FC<AgentBlogFormProps> = ({
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
    const [uploadProgress, setUploadProgress] = useState(0);
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
            showToast.error('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast.error('Image size should be less than 5MB');
            return;
        }

        try {
            setUploadingImage(true);
            setUploadProgress(0);

            // Simulate progress (real progress would come from Cloudinary)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 30;
                });
            }, 200);

            const imageUrl = await blogService.uploadBlogImage(file);

            clearInterval(progressInterval);
            setUploadProgress(100);

            setFormData(prev => ({
                ...prev,
                coverImage: imageUrl
            }));
            setImagePreview(imageUrl);
            showToast.success('Image uploaded successfully!');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast.error(getErrorMessage(error));
        } finally {
            setUploadingImage(false);
            setTimeout(() => setUploadProgress(0), 500);
        }
    };

    const validateImageUrl = (url: string) => {
        try {
            new URL(url);
            return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            showToast.error('Please enter a title');
            return;
        }

        if (!formData.content.trim()) {
            showToast.error('Please enter content');
            return;
        }

        try {
            setLoading(true);
            let savedBlog: Blog;

            if (isEdit && blog) {
                savedBlog = await blogService.updatePublicBlog(blog._id, formData);
                showToast.success('Blog updated successfully!');
            } else {
                savedBlog = await blogService.createPublicBlog(formData);
                showToast.success('Blog created successfully!');
            }

            onSave(savedBlog);
        } catch (error) {
            console.error('Error saving blog:', error);
            showToast.error(getErrorMessage(error));
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
        // Clear the URL input as well
        const urlInput = document.getElementById('imageUrl') as HTMLInputElement;
        if (urlInput) {
            urlInput.value = '';
        }
    };

    return (
        <div className="agent-blog-form">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4 className="page-title">
                                {isEdit ? 'Edit Blog' : 'Create New Blog'}
                            </h4>
                            <p className="text-muted">
                                {isEdit ? 'Update your blog post' : 'Create a new blog post to share with the community'}
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

                                    {/* Image URL Input */}
                                    <div className="mb-3">
                                        <label htmlFor="imageUrl" className="form-label">
                                            <small>Or enter image URL:</small>
                                        </label>
                                        <input
                                            type="url"
                                            className={`form-control ${formData.coverImage && !validateImageUrl(formData.coverImage) ? 'is-invalid' : ''}`}
                                            id="imageUrl"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.coverImage}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, coverImage: e.target.value }));
                                                setImagePreview(e.target.value);
                                            }}
                                        />
                                        {formData.coverImage && !validateImageUrl(formData.coverImage) && (
                                            <div className="invalid-feedback">
                                                Please enter a valid image URL (jpg, jpeg, png, gif, webp)
                                            </div>
                                        )}
                                        <small className="text-muted">
                                            Enter a direct link to an image file (JPG, PNG, GIF, WebP)
                                        </small>
                                    </div>

                                    {/* Image Upload Section */}
                                    <div className="mb-3">
                                        <label className="form-label">
                                            <small>Or upload image file:</small>
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
                                        If checked, the blog will be published right away. Otherwise, it will be saved as draft and submitted for review.
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div className="card mt-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Actions</h6>
                            </div>
                            <div className="card-body">
                                {/* Upload Progress */}
                                {uploadingImage && uploadProgress > 0 && (
                                    <div className="mb-3">
                                        <small className="text-muted d-block mb-2">Uploading image...</small>
                                        <div className="progress" style={{ height: '4px' }}>
                                            <div
                                                className="progress-bar"
                                                role="progressbar"
                                                style={{ width: `${uploadProgress}%` }}
                                                aria-valuenow={uploadProgress}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                        <small className="text-muted d-block mt-1">{Math.round(uploadProgress)}%</small>
                                    </div>
                                )}

                                <div className="d-grid gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || uploadingImage}
                                        title={uploadingImage ? 'Uploading image...' : ''}
                                    >
                                        {uploadingImage ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Uploading...</span>
                                                </span>
                                                Uploading...
                                            </>
                                        ) : loading ? (
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


// Rich Text Editor Component
interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    placeholder
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        const editor = document.getElementById('rich-text-editor') as HTMLDivElement;
        if (editor) {
            onChange(editor.innerHTML);
        }
    };

    const handleInput = () => {
        const editor = document.getElementById('rich-text-editor') as HTMLDivElement;
        if (editor) {
            onChange(editor.innerHTML);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div className={`rich-text-editor ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="editor-toolbar">
                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('bold')}
                        title="Bold"
                    >
                        <i className="fas fa-bold"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('italic')}
                        title="Italic"
                    >
                        <i className="fas fa-italic"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('underline')}
                        title="Underline"
                    >
                        <i className="fas fa-underline"></i>
                    </button>
                </div>

                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('insertUnorderedList')}
                        title="Bullet List"
                    >
                        <i className="fas fa-list-ul"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('insertOrderedList')}
                        title="Numbered List"
                    >
                        <i className="fas fa-list-ol"></i>
                    </button>
                </div>

                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('justifyLeft')}
                        title="Align Left"
                    >
                        <i className="fas fa-align-left"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('justifyCenter')}
                        title="Align Center"
                    >
                        <i className="fas fa-align-center"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('justifyRight')}
                        title="Align Right"
                    >
                        <i className="fas fa-align-right"></i>
                    </button>
                </div>

                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleFormat('createLink', prompt('Enter URL:') || '')}
                        title="Insert Link"
                    >
                        <i className="fas fa-link"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={toggleFullscreen}
                        title="Toggle Fullscreen"
                    >
                        <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                    </button>
                </div>
            </div>

            <div
                id="rich-text-editor"
                className="editor-content"
                contentEditable
                dangerouslySetInnerHTML={{ __html: content }}
                onInput={handleInput}
                style={{
                    minHeight: isFullscreen ? '70vh' : '300px',
                    maxHeight: isFullscreen ? '70vh' : '500px',
                    overflowY: 'auto'
                }}
                data-placeholder={placeholder || ''}
            />
        </div>
    );
};

export default AgentBlogForm;
