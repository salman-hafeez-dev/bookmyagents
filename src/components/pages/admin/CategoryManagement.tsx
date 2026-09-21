import React, { useState, useEffect } from 'react';
import { categoryService } from '../../../services/categoryService';
import { type Category, type CreateCategoryData } from '../../../types/category';
import CategoryFormModal from './CategoryFormModal';
import { showToast, getErrorMessage } from '../../../utils/toast';
import { Badge, Button, DataTable, IconButton, type DataTableColumn } from '../../ui';

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAdminCategories({ limit: 20 });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleSave = async (data: CreateCategoryData) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, data);
        showToast.success('Category updated successfully');
      } else {
        await categoryService.createCategory(data);
        showToast.success('Category created successfully');
      }
      setShowModal(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await categoryService.updateCategory(category._id, { isActive: !category.isActive });
      showToast.success(category.isActive ? 'Category deactivated' : 'Category activated');
      fetchCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
      showToast.error(getErrorMessage(error));
    }
  };

  const columns: DataTableColumn<Category>[] = [
    { key: 'order', header: 'Order', width: '80px', nowrap: true, render: (c) => c.displayOrder },
    { key: 'name', header: 'Name', render: (c) => <span className="fw-semibold">{c.name}</span> },
    { key: 'slug', header: 'Slug', hideBelow: 'md', render: (c) => <code className="small">{c.slug}</code> },
    {
      key: 'price',
      header: 'Base Price',
      nowrap: true,
      hideBelow: 'lg',
      render: (c) => `PKR ${c.basePrice.toLocaleString()}`,
    },
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (c) => (c.isActive
        ? <Badge tone="success" dot>Active</Badge>
        : <Badge tone="neutral" dot>Inactive</Badge>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '96px',
      render: (category) => (
        <div className="ui-actions">
          <IconButton
            icon="far fa-pen-to-square"
            label="Edit category"
            onClick={() => handleEdit(category)}
          />
          <IconButton
            icon={category.isActive ? 'far fa-eye-slash' : 'far fa-eye'}
            label={category.isActive ? 'Deactivate' : 'Activate'}
            tone={category.isActive ? 'warning' : 'success'}
            onClick={() => handleToggleActive(category)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="admin-category-management">
      <div className="dashboard-card">
        <div className="card-body">
          <DataTable<Category>
            columns={columns}
            rows={categories}
            rowKey={(category) => category._id}
            pagination={{ noun: 'categories' }}
            title="Service Categories"
            loading={loading}
            search={{ placeholder: 'Search categories…', keys: ['name', 'slug'] }}
            actions={<Button icon="fas fa-plus" size="sm" onClick={handleAdd}>Add category</Button>}
            emptyState={{
              icon: 'fas fa-folder-open',
              title: 'No categories found',
              description: 'Create your first service category to get started.',
              action: <Button onClick={handleAdd}>Add category</Button>,
            }}
          />
        </div>
      </div>

      {showModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => { setShowModal(false); setEditingCategory(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
