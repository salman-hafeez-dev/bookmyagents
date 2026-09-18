import React, { useState } from 'react';
import { type Subscription } from '../../../services/subscriptionService';
import Modal from '../../common/Modal';
import { useConfirm } from '../../../contexts/ConfirmContext';

interface EditSubscriptionModalProps {
  subscription: Subscription;
  onClose: () => void;
  onSave: (data: Partial<Subscription>) => void;
}

const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({
  subscription,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: subscription.name,
    price: subscription.price,
    description: subscription.description || '',
    isPopular: subscription.isPopular || false,
    features: subscription.features.join('\n'),
    categoryLimit: subscription.categoryLimit ?? 1
  });
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = await confirm({
      title: 'Update Plan',
      subtitle: subscription?.name,
      heading: 'Save Plan Changes',
      description: 'Existing subscribers keep the price they already paid — their payments and invoices are historical records and are not re-priced.',
      icon: 'warning',
      actionColor: 'primary',
      actionLabel: 'Update Plan',
    });
    if (!ok) return;

    setLoading(true);

    try {
      const subscriptionData: Partial<Subscription> = {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        isPopular: formData.isPopular,
        features: formData.features.split('\n').filter(f => f.trim() !== ''),
        categoryLimit: formData.categoryLimit
      };

      await onSave(subscriptionData);
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log("subscription", subscription)

  return (
    <Modal
      onClose={onClose}
      title="Edit Subscription Plan"
      subtitle="Update the subscription plan details"
      size="lg"
      busy={loading}
      onSubmit={handleSubmit}
      footer={(
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Updating...' : 'Update Plan'}
          </button>
        </>
      )}
    >
      <div className="row mb-3">
        <div className="col-md-8">
          <label htmlFor="name" className="form-label">Plan Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="price" className="form-label">Price ($)</label>
          <input
            type="number"
            className="form-control"
            id="price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="categoryLimit" className="form-label">
            Category Limit
            <small className="text-muted ms-2">(how many service categories an agent on this plan may select)</small>
          </label>
          <input
            type="number"
            className="form-control"
            id="categoryLimit"
            value={formData.categoryLimit}
            onChange={(e) => setFormData({ ...formData, categoryLimit: parseInt(e.target.value, 10) || 0 })}
            min="0"
            step="1"
            required
          />
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          className="form-control"
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter plan description..."
        />
      </div>

      <div className="mb-3">
        <label htmlFor="features" className="form-label">Features (one per line)</label>
        <textarea
          className="form-control"
          id="features"
          rows={15}
          style={{ minHeight: '120px' }}
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          placeholder="Enter features, one per line..."
          required
        />
      </div>

      <div className="mb-4">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="isPopular"
            checked={formData.isPopular}
            onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
          />
          <label className="form-check-label" htmlFor="isPopular">
            Mark as Popular Plan
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default EditSubscriptionModal;
