import React, { useState, useEffect } from 'react';
import Modal from '../components/common/Modal';
import { subscriptionService, type Subscription } from '../services/subscriptionService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSubscription?: (subscription: Subscription) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSelectSubscription
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscriptions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSubscriptions();
    }
  }, [isOpen]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionService.getSubscriptions();
      setSubscriptions(response.data);
    } catch (err: any) {
      // Handle different types of errors
      if (err.response?.status === 404) {
        setError('Subscription service not found. Please check if the backend is running.');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in to view subscriptions.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        setError('Cannot connect to server. Please check your internet connection and ensure the backend is running.');
      } else {
        setError('Failed to load subscriptions. Please try again.');
      }
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubscription = (subscription: Subscription) => {
    if (onSelectSubscription) {
      onSelectSubscription(subscription);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title="Choose Your Subscription Plan"
      subtitle="Select the plan that fits how you work"
      size="xl"
    >
      {/* Loading State */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#666'
        }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #560CE3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '15px' }}>Loading subscriptions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#e74c3c'
        }}>
          <p>{error}</p>
          <button
            onClick={fetchSubscriptions}
            style={{
              backgroundColor: '#560CE3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Subscriptions Grid */}
      {!loading && !error && subscriptions.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {subscriptions.map((subscription) => (
            <div
              key={subscription._id}
              style={{
                border: subscription.isPopular ? '2px solid #560CE3' : '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '25px',
                position: 'relative',
                backgroundColor: subscription.isPopular ? '#f8f6ff' : 'white',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => handleSelectSubscription(subscription)}
            >
              {/* Popular Badge */}
              {subscription.isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#560CE3',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  Most Popular
                </div>
              )}

              {/* Plan Name */}
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                {subscription.name}
              </h3>

              {/* Price */}
              <div style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <span style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#560CE3'
                }}>
                  ${subscription.price}
                </span>
                <span style={{
                  color: '#666',
                  fontSize: '14px',
                  marginLeft: '5px'
                }}>
                  /month
                </span>
              </div>

              {/* Description */}
              {subscription.description && (
                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  lineHeight: '1.5'
                }}>
                  {subscription.description}
                </p>
              )}

              {/* Features */}
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {subscription.features.map((feature, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#333'
                  }}>
                    <span style={{
                      color: '#560CE3',
                      marginRight: '8px',
                      fontSize: '16px'
                    }}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Select Button */}
              <button
                style={{
                  width: '100%',
                  backgroundColor: subscription.isPopular ? '#560CE3' : '#f8f9fa',
                  color: subscription.isPopular ? 'white' : '#333',
                  border: subscription.isPopular ? 'none' : '1px solid #e0e0e0',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginTop: '20px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = subscription.isPopular ? '#4a0bc7' : '#e9ecef';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = subscription.isPopular ? '#560CE3' : '#f8f9fa';
                }}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No Subscriptions */}
      {!loading && !error && subscriptions.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#666'
        }}>
          <p>No subscription plans available at the moment.</p>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </Modal>
  );
};

export default SubscriptionModal;
