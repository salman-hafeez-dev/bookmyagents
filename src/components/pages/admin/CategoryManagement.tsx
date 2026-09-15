import React, { useState, useEffect } from 'react';
import { categoryService } from '../../../services/categoryService';
import { type Category, type CreateCategoryData } from '../../../types/category';
import CategoryFormModal from './CategoryFormModal';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';
import { showToast, getErrorMessage } from '../../../utils/toast';

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

  return (
    <div className="admin-category-management">
      <div className="dashboard-card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h4>Service Categories</h4>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
              <i className="fas fa-plus me-2"></i>
              Add Category
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Base Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td>{category.displayOrder}</td>
                      <td>{category.name}</td>
                      <td><code>{category.slug}</code></td>
                      <td>${category.basePrice}</td>
                      <td>
                        <span className={`badge ${category.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEdit(category)}
                            title="Edit Category"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`btn btn-sm ${category.isActive ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleActive(category)}
                            title={category.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`fas ${category.isActive ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-folder-open"></i>
                  <h5 className="mt-3 mb-2">No Categories Found</h5>
                  <p className="text-muted">Create your first service category to get started.</p>
                </div>
              )}
            </div>
          )}
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
