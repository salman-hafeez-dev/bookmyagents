import React, { useState } from 'react';
import { type Category, type CreateCategoryData } from '../../../types/category';
import ModalPortal from '../../common/ModalPortal';

interface CategoryFormModalProps {
  category: Category | null; // null = create mode
  onClose: () => void;
  onSave: (data: CreateCategoryData) => Promise<void>;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    basePrice: category?.basePrice ?? 0,
    displayOrder: category?.displayOrder ?? 0,
    isActive: category?.isActive ?? true,
    verificationRequirements: (category?.verificationRequirements || []).join('\n'),
  });
  const [saving, setSaving] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        displayOrder: Number(formData.displayOrder),
        isActive: formData.isActive,
        verificationRequirements: formData.verificationRequirements
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  };

  const paddingX = window.innerWidth < 768 ? '20px' : '30px';

  return (
    <ModalPortal>
      <div
        className="modal-overlay admin-modal-overlay"
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}
      >
        <div
          className="modal-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              zIndex: 1,
            }}
          >
            ×
          </button>

          <div style={{ flex: '0 0 auto', textAlign: 'center', padding: `${window.innerWidth < 768 ? '20px' : '30px'} ${paddingX} 20px` }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
              {category ? 'Edit Category' : 'Create Category'}
            </h2>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              {category ? 'Update this service category' : 'Add a new service category for agents'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
            <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: `0 ${paddingX}` }}>
              <div className="row mb-3">
                <div className="col-md-7">
                  <label htmlFor="cat-name" className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cat-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-5">
                  <label htmlFor="cat-slug" className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cat-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    pattern="[a-z0-9-]+"
                    title="Lowercase letters, numbers, and hyphens only"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="cat-description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="cat-description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="cat-price" className="form-label">Base Price</label>
                  <input
                    type="number"
                    className="form-control"
                    id="cat-price"
                    min="0"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="cat-order" className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    id="cat-order"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="cat-verification" className="form-label">Verification Requirements (one per line)</label>
                <textarea
                  className="form-control"
                  id="cat-verification"
                  rows={4}
                  value={formData.verificationRequirements}
                  onChange={(e) => setFormData({ ...formData, verificationRequirements: e.target.value })}
                  placeholder="business_license&#10;ntn&#10;..."
                />
              </div>

              <div className="mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="cat-active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="cat-active">
                    Active (visible to agents)
                  </label>
                </div>
              </div>
            </div>

            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                padding: `20px ${paddingX} ${window.innerWidth < 768 ? '20px' : '30px'}`,
              }}
            >
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default CategoryFormModal;
