import React, { useState, useEffect } from 'react';
import { subscriptionRequestService } from '../../../services/subscriptionRequestService';
import { type SubscriptionRequest } from '../../../types/subscriptionRequest';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';

// Admin view of pending subscription requests. Approving here calls the
// same assignSubscriptionToUser path the existing direct-assign endpoint
// uses — this panel is the review gate in front of it, not a parallel
// mechanism.
const SubscriptionRequestsPanel: React.FC = () => {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await subscriptionRequestService.getAdminRequests('pending');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching subscription requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActingId(requestId);
      await subscriptionRequestService.approveRequest(requestId);
      setMessage({ type: 'success', text: 'Subscription request approved — the agent now has this plan active.' });
      fetchRequests();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error approving request:', error);
      setMessage({ type: 'error', text: 'Failed to approve request' });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setActingId(requestId);
      await subscriptionRequestService.rejectRequest(requestId);
      setMessage({ type: 'success', text: 'Subscription request rejected.' });
      fetchRequests();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setMessage({ type: 'error', text: 'Failed to reject request' });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="dashboard-card mb-30">
      <div className="card-header">
        <h4>
          Pending Subscription Requests
          {!loading && <span className="badge bg-secondary ms-2">{requests.length}</span>}
        </h4>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h5 className="mt-3 mb-2">No Pending Requests</h5>
            <p className="text-muted">All subscription requests have been reviewed.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Current Plan</th>
                  <th>Requested Plan</th>
                  <th>Requested On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const agent = typeof req.agentId === 'object' ? req.agentId : null;
                  const requestedPlan = typeof req.subscriptionId === 'object' ? req.subscriptionId : null;
                  const currentPlan = agent?.subscription && typeof agent.subscription === 'object' ? agent.subscription : null;
                  return (
                    <tr key={req._id}>
                      <td>
                        {agent ? (
                          <>
                            <div>{agent.fullName}</div>
                            <small className="text-muted">{agent.email}</small>
                          </>
                        ) : 'Unknown agent'}
                      </td>
                      <td>
                        {currentPlan ? (
                          <span className="badge bg-secondary">{currentPlan.name}</span>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td>
                        {requestedPlan ? (
                          <span className="badge bg-primary">{requestedPlan.name} (${requestedPlan.price})</span>
                        ) : 'N/A'}
                      </td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-success"
                            disabled={actingId === req._id}
                            onClick={() => handleApprove(req._id)}
                            title="Approve"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={actingId === req._id}
                            onClick={() => handleReject(req._id)}
                            title="Reject"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRequestsPanel;
