import React, { useState } from 'react';
import { type Subscription } from '../../../services/subscriptionService';
import ModalPortal from '../../common/ModalPortal';

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
    features: subscription.features.join('\n')
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subscriptionData: Partial<Subscription> = {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        isPopular: formData.isPopular,
        features: formData.features.split('\n').filter(f => f.trim() !== '')
      };

      await onSave(subscriptionData);
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  console.log("subscription", subscription)

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
          padding: '20px'
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
            margin: window.innerWidth < 768 ? '10px' : '20px',
            background: "#FFF"
          }}
        >
          {/* Close Button */}
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
              transition: 'background-color 0.2s',
              zIndex: 1
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>

          {/* Header — stays fixed while the body below scrolls */}
          <div style={{ flex: '0 0 auto', textAlign: 'center', padding: `${window.innerWidth < 768 ? '20px' : '30px'} ${paddingX} 20px` }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px'
            }}>
              Edit Subscription Plan
            </h2>
            <p style={{
              color: '#666',
              fontSize: '14px',
              margin: 0
            }}>
              Update the subscription plan details
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
            <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: `0 ${paddingX}` }}>
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
            </div>

            {/* Footer — stays fixed while the fields above scroll */}
            <div style={{
              flex: '0 0 auto',
              display: 'flex',
              gap: '15px',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              padding: `20px ${paddingX} ${window.innerWidth < 768 ? '20px' : '30px'}`
            }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{
                  padding: '10px 20px',
                  border: '1px solid #6c757d',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  flex: window.innerWidth < 768 ? '1' : 'none',
                  minWidth: window.innerWidth < 768 ? 'auto' : '100px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: loading ? '#ccc' : '#560CE3',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flex: window.innerWidth < 768 ? '1' : 'none',
                  minWidth: window.innerWidth < 768 ? 'auto' : '120px'
                }}
              >
                {loading ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default EditSubscriptionModal;
