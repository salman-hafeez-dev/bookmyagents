import React, { useState, useEffect } from 'react';
import { subscriptionService, type Subscription } from '../../../services/subscriptionService';
import { userService } from '../../../services/userService';
import { type User } from '../../../services/authService';
import { CardSkeleton } from '../../dashboard-admin/Skeleton';
import ModalPortal from '../../common/ModalPortal';

interface UserSubscriptionModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionAssigned: () => void;
}

const UserSubscriptionModal: React.FC<UserSubscriptionModalProps> = ({
  user,
  isOpen,
  onClose,
  onSubscriptionAssigned
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Debug showCancelModal state changes
  useEffect(() => {
    console.log("showCancelModal state changed:", showCancelModal);
  }, [showCancelModal]);

  // Debug currentSubscription state changes
  useEffect(() => {
    console.log("currentSubscription state changed:", currentSubscription);
  }, [currentSubscription]);

  useEffect(() => {
    if (isOpen && user) {
      fetchData();
    }
  }, [isOpen, user]);

  // Clear selection if it's the current plan
  useEffect(() => {
    if (currentSubscription && selectedSubscriptionId === currentSubscription._id) {
      setSelectedSubscriptionId('');
    }
  }, [currentSubscription, selectedSubscriptionId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all available subscriptions
      const subscriptionsResponse = await subscriptionService.getSubscriptions();
      setSubscriptions(subscriptionsResponse.data || []);

      // Fetch user's current subscription
      try {
        const currentSubResponse = await userService.getUserSubscription(user!._id);
        console.log("currentSubResponse", currentSubResponse?.userSubscription?.subscription);
        setCurrentSubscription(currentSubResponse?.userSubscription?.subscription);
      } catch (err) {
        // User might not have a subscription yet
        setCurrentSubscription(null);
      }
    } catch (err: any) {
      setError('Failed to load subscription data');
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubscription = async () => {
    if (!selectedSubscriptionId || !user) return;

    setAssigning(true);
    setError(null);

    try {
      await userService.assignSubscription(user._id, selectedSubscriptionId);
      onSubscriptionAssigned();
      onClose();
    } catch (err: any) {
      setError('Failed to assign subscription. Please try again.');
      console.error('Error assigning subscription:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;

    setCancelling(true);
    setError(null);

    try {
      await userService.cancelSubscription(user._id);
      onSubscriptionAssigned();
      setShowCancelModal(false);
      onClose();
    } catch (err: any) {
      setError('Failed to cancel subscription. Please try again.');
      console.error('Error cancelling subscription:', err);
    } finally {
      setCancelling(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  console.log("setShowCancelModal", setShowCancelModal);

  return (
    <ModalPortal>
    <div
      className="modal fade show d-block modern-modal-overlay"
      onClick={handleBackdropClick}
    >
      <div className="modal-dialog modal-xl modern-modal-dialog">
        <div className="modal-content modern-modal-content">
          <div className="modal-header modern-modal-header">
            <div className="modal-title-section">
              <div className="title-icon">
                <i className="fas fa-crown" style={{ color: '#667eea' }}></i>
              </div>
              <div className="title-content">
                <h4 className="modal-title">Subscription Management</h4>
                {/* <p className="modal-subtitle">
                  <i className="fas fa-user me-2"></i>
                  {user.fullName}
                </p> */}
              </div>
            </div>
            <button
              type="button"
              className="btn-close modern-close-btn btn-close-modal"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body modern-modal-body">
            {loading ? (
              <CardSkeleton count={3} />
            ) : (
              <>
                {/* Current Subscription Section */}
                {/* <div className="current-subscription-section">
                    <div className="section-header">
                      <h5 className="section-title">
                        <i className="fas fa-shield-alt me-2"></i>
                        Current Plan
                      </h5>
                    </div>
                    
                    {currentSubscription ? (
                      <div className="current-plan-card active-plan">
                        <div className="plan-header">
                          <div className="plan-icon">
                            <i className="fas fa-crown"></i>
                          </div>
                          <div className="plan-info">
                            <h6 className="plan-name">{currentSubscription.name}</h6>
                            <p className="plan-price">
                              <span className="currency">$</span>
                              <span className="amount">{currentSubscription.price}</span>
                              <span className="period">/{currentSubscription.duration}</span>
                            </p>
                          </div>
                          <div className="plan-status">
                            <span className="status-badge active">
                              <i className="fas fa-check-circle me-1"></i>
                              Active
                            </span>
                          </div>
                        </div>
                        <div className="plan-features">
                          <div className="feature-item">
                            <i className="fas fa-check text-success me-2"></i>
                            <span>Premium Features Access</span>
                          </div>
                          <div className="feature-item">
                            <i className="fas fa-check text-success me-2"></i>
                            <span>Priority Support</span>
                          </div>
                          <div className="feature-item">
                            <i className="fas fa-check text-success me-2"></i>
                            <span>Advanced Analytics</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="current-plan-card no-plan">
                        <div className="plan-header">
                          <div className="plan-icon">
                            <i className="fas fa-exclamation-triangle"></i>
                          </div>
                          <div className="plan-info">
                            <h6 className="plan-name">No Active Plan</h6>
                            <p className="plan-description">
                              This agent needs a subscription to access premium features
                            </p>
                          </div>
                          <div className="plan-status">
                            <span className="status-badge inactive">
                              <i className="fas fa-times-circle me-1"></i>
                              Inactive
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div> */}

                {/* Available Subscriptions Section */}
                <div className="available-plans-section">
                  <div className="section-header">
                    <h5 className="section-title">
                      <i className="fas fa-rocket me-2"></i>
                      Choose New Plan
                    </h5>
                    <p className="section-subtitle">
                      {currentSubscription
                        ? "Select a different subscription plan to change the agent's current plan"
                        : "Select a subscription plan to assign to this agent"
                      }
                    </p>
                  </div>

                  <div className="plans-grid">
                    {subscriptions.map((subscription) => {
                      const isCurrentPlan = currentSubscription && currentSubscription._id === subscription._id;
                      const isDisabled = isCurrentPlan;

                      return (
                        <div key={subscription._id} className="plan-card-wrapper">
                          <div
                            className={`modern-plan-card ${selectedSubscriptionId === subscription._id ? 'selected' : ''
                              } ${subscription.isPopular ? 'popular' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && setSelectedSubscriptionId(subscription._id)}
                          >
                            {isCurrentPlan && (
                              <div className="current-plan-badge">
                                <i className="fas fa-check-circle me-1"></i>
                                Current Plan
                              </div>
                            )}
                            {subscription.isPopular && !isCurrentPlan && (
                              <div className="popular-badge">
                                <i className="fas fa-star me-1"></i>
                                Most Popular
                              </div>
                            )}

                            <div className="plan-card-header">
                              <div className="plan-icon">
                                <i className="fas fa-gem"></i>
                              </div>
                              <h6 className="plan-name">{subscription.name}</h6>
                            </div>

                            <div className="plan-pricing">
                              <div className="price-display">
                                <span className="currency">$</span>
                                <span className="amount">{subscription.price}</span>
                                <span className="period">/{subscription.duration}</span>
                              </div>
                            </div>

                            <div className="plan-features">
                              <div className="feature-item">
                                <i className="fas fa-check text-success me-2"></i>
                                <span>Premium Features</span>
                              </div>
                              <div className="feature-item">
                                <i className="fas fa-check text-success me-2"></i>
                                <span>Priority Support</span>
                              </div>
                              <div className="feature-item">
                                <i className="fas fa-check text-success me-2"></i>
                                <span>Advanced Tools</span>
                              </div>
                            </div>

                            <div className="plan-selection">
                              <div className="selection-indicator">
                                {isDisabled ? (
                                  <div className="disabled-indicator">
                                    <i className="fas fa-lock"></i>
                                    <span>Current Plan</span>
                                  </div>
                                ) : (
                                  <div className={`radio-button ${selectedSubscriptionId === subscription._id ? 'selected' : ''}`}>
                                    {selectedSubscriptionId === subscription._id && (
                                      <i className="fas fa-check"></i>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="error-alert">
                    <div className="error-icon">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="error-content">
                      <h6>Error</h6>
                      <p>{error}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Info Section */}
            {/* <div className="info-section">
              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="info-content">
                  <h6>Important Note</h6>
                  <p>Subscriptions are only available for agent users to access premium features and services. Choose a plan that best fits the agent's needs.</p>
                </div>
              </div>
            </div> */}
          </div>

          <div className="modal-footer modern-modal-footer">
            <div className="footer-actions">

              {currentSubscription && (
                <button
                  type="button"
                  className="btn btn-cancel-plan"
                  onClick={() => {
                    console.log("currentSubscription", currentSubscription);
                    console.log("Setting showCancelModal to true");
                    setShowCancelModal(true);
                  }}
                >
                  <i className="fas fa-times-circle me-2"></i>
                  Cancel Plan
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary btn-assign"
                onClick={handleAssignSubscription}
                disabled={!selectedSubscriptionId || assigning}
              >
                {assigning ? (
                  <>
                    <div className="btn-spinner me-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle me-2"></i>
                    Assign Subscription
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-cancel"
                onClick={onClose}
                disabled={assigning}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #6c757d',
                  borderRadius: '6px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal fade show d-block cancel-confirmation-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content cancel-confirmation-modal">
              <div className="modal-header cancel-confirmation-header">
                <div className="confirmation-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h5 className="modal-title">Cancel Subscription</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body cancel-confirmation-body">
                <div className="confirmation-content">
                  <h6>Are you sure you want to cancel this subscription?</h6>
                  <p>
                    This action will immediately remove the agent's access to premium features.
                    The agent will lose access to:
                  </p>
                  <ul className="feature-list">
                    <li><i className="fas fa-times text-danger me-2"></i>Premium Features</li>
                    <li><i className="fas fa-times text-danger me-2"></i>Priority Support</li>
                    <li><i className="fas fa-times text-danger me-2"></i>Advanced Analytics</li>
                  </ul>
                  <div className="warning-box">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> This action cannot be undone. You can always assign a new subscription later.
                  </div>
                </div>
              </div>

              <div className="modal-footer cancel-confirmation-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  Keep Subscription
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-cancel-confirm"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <div className="btn-spinner me-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash-alt me-2"></i>
                      Yes, Cancel Subscription
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ModalPortal>
  );
};

export default UserSubscriptionModal;
