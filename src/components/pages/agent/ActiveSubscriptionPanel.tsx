import React, { useState, useEffect } from 'react';
import { subscriptionService, type Subscription } from '../../../services/subscriptionService';
import { subscriptionRequestService } from '../../../services/subscriptionRequestService';
import { type SubscriptionRequest } from '../../../types/subscriptionRequest';
import { profileService } from '../../../services/profileService';
import { showToast, getErrorMessage } from '../../../utils/toast';

const asId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
    return (value as { _id: string })._id;
  }
  return undefined;
};

// Agent-facing "Active Subscription" panel (lives in the Agent Dashboard).
// Requesting a plan never sets the agent's active subscription directly —
// it only creates a pending SubscriptionRequest for an admin to review.
// Category access stays governed by whatever subscription is ALREADY
// active until that request is approved.
const ActiveSubscriptionPanel: React.FC = () => {
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, requestsRes, profileRes] = await Promise.all([
        subscriptionService.getSubscriptions(),
        subscriptionRequestService.getMyRequests(),
        profileService.getProfile(),
      ]);
      setPlans(plansRes.data || []);
      setRequests(requestsRes.data || []);
      setCurrentSubscription((profileRes.data.subscription as unknown as Subscription) || null);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequest = requests.find((r) => r.status === 'pending');
  const currentSubscriptionId = asId(currentSubscription);

  const handleRequest = async (planId: string) => {
    try {
      setSubmittingId(planId);
      await subscriptionRequestService.requestSubscription(planId);
      showToast.success(pendingRequest ? 'Your subscription request was updated.' : 'Subscription request submitted. An admin will review it shortly.');
      fetchData();
    } catch (error) {
      showToast.error(getErrorMessage(error));
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="card-header"><h4>Active Subscription</h4></div>
        <div className="card-body">
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm" role="status"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="card-header"><h4>Active Subscription</h4></div>
      <div className="card-body">
        <div className="mb-3">
          <strong>Current plan: </strong>
          {currentSubscription ? (
            <span className="badge bg-success">{currentSubscription.name}</span>
          ) : (
            <span className="text-muted">No active subscription</span>
          )}
        </div>

        {pendingRequest && (
          <div className="alert alert-warning">
            <i className="fas fa-clock me-2"></i>
            Your request for{' '}
            <strong>
              {typeof pendingRequest.subscriptionId === 'object' ? pendingRequest.subscriptionId.name : 'a plan'}
            </strong>{' '}
            is pending admin approval. You can request a different plan once this one is approved or rejected.
          </div>
        )}

        <h6 className="mt-4 mb-3">Available Plans</h6>
        <div className="row g-3">
          {plans.map((plan) => {
            const isCurrent = currentSubscriptionId === plan._id;
            const isPendingThis = pendingRequest && typeof pendingRequest.subscriptionId === 'object' && pendingRequest.subscriptionId._id === plan._id;
            // While a request is pending, only that plan (or the current
            // plan) shows anything actionable — every other plan's
            // "Request Plan" button is hidden so the agent can't fire off
            // a second, conflicting request.
            const showButton = !isCurrent && !pendingRequest;
            return (
              <div key={plan._id} className="col-md-4">
                <div className={`card h-100 ${isCurrent ? 'border-success' : ''}`}>
                  <div className="card-body d-flex flex-column">
                    <h6>{plan.name}</h6>
                    <p className="mb-1">${plan.price}/mo</p>
                    <p className="text-muted small mb-3">
                      Up to {plan.categoryLimit ?? 1} categor{(plan.categoryLimit ?? 1) === 1 ? 'y' : 'ies'}
                    </p>
                    <div className="mt-auto">
                      {isCurrent ? (
                        <span className="badge bg-success">Current Plan</span>
                      ) : isPendingThis ? (
                        <span className="badge bg-warning">Requested</span>
                      ) : showButton ? (
                        <button
                          className="btn btn-primary btn-sm w-100"
                          disabled={submittingId === plan._id}
                          onClick={() => handleRequest(plan._id)}
                        >
                          {submittingId === plan._id ? 'Submitting...' : 'Request Plan'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActiveSubscriptionPanel;
