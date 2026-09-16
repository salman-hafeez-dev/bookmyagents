import React, { useState } from 'react';
import { type Category, type CreateCategoryData } from '../../../types/category';
import Modal from '../../common/Modal';

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

  return (
    <Modal
      onClose={onClose}
      title={category ? 'Edit Category' : 'Create Category'}
      subtitle={category ? 'Update this service category' : 'Add a new service category for agents'}
      size="lg"
      busy={saving}
      onSubmit={handleSubmit}
      footer={(
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </button>
        </>
      )}
    >
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
    </Modal>
  );
};

export default CategoryFormModal;
