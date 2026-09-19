import React, { useCallback, useEffect, useState } from 'react';
import {
  type AdminReviewRow,
  type ReviewStatus,
  REVIEW_STATUSES,
} from '../../../types/review';
import { reviewService } from '../../../services/reviewService';
import { showToast, getErrorMessage } from '../../../utils/toast';
import { useConfirm } from '../../../contexts/ConfirmContext';
import StarRating from '../../marketplace/StarRating';
import Pager from '../../dashboard-admin/Pager';
import { formatDate } from '../../../utils/format';

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  approved: 'Published',
  rejected: 'Rejected',
  hidden: 'Hidden',
};

const STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: 'bma-lead-badge--new',
  approved: 'bma-lead-badge--converted',
  rejected: 'bma-lead-badge--closed',
  hidden: 'bma-lead-badge--followup',
};

// The moderation queue.
//
// Nothing a customer writes reaches an agent's public rating until it passes
// through here, so this screen is what keeps the ratings worth trusting.
const ReviewsManagement: React.FC = () => {
  const confirm = useConfirm();

  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [statusCounts, setStatusCounts] = useState<Partial<Record<ReviewStatus, number>>>({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [status, setStatus] = useState<ReviewStatus | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const response = await reviewService.getQueue({ status, page, limit: 20 });
      setReviews(response.data);
      setStatusCounts(response.statusCounts);
      setPagination(response.pagination);
    } catch (error) {
      setHasError(true);
      showToast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (
    review: AdminReviewRow,
    next: Exclude<ReviewStatus, 'pending'>
  ) => {
    let rejectionReason: string | undefined;

    // A rejection the reviewer cannot understand is just a silent deletion, so
    // the API requires a reason and the UI collects one.
    if (next === 'rejected') {
      const reason = window.prompt(
        'Why is this review being rejected? The reviewer will see this.'
      );
      if (reason === null) return;
      if (!reason.trim()) {
        showToast.error('A reason is required to reject a review');
        return;
      }
      rejectionReason = reason.trim();
    }

    if (next === 'hidden') {
      const confirmed = await confirm({
        title: 'Hide review',
        description: 'This review will be removed from the agent\'s public profile and their rating recalculated.',
        icon: 'warning',
        actionLabel: 'Hide review',
        actionColor: 'danger',
      });
      if (!confirmed) return;
    }

    try {
      setBusyId(review._id);
      const response = await reviewService.moderate(review._id, { status: next, rejectionReason });
      showToast.success(response.message);
      load();
    } catch (error) {
      showToast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const tabs: (ReviewStatus | 'all')[] = ['pending', ...REVIEW_STATUSES.filter((s) => s !== 'pending'), 'all'];

  return (
    <>
      <div className="dashboard-card mb-3">
        <div className="card-body">
          <div className="bma-lead-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`bma-lead-tab${status === tab ? ' is-active' : ''}`}
                onClick={() => { setStatus(tab); setPage(1); }}
              >
                {tab === 'all' ? 'All' : STATUS_LABEL[tab]}
                {tab !== 'all' && (
                  <span className="bma-tab-count">{statusCounts[tab] ?? 0}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        {isLoading ? (
          <div className="card-body">
            {[0, 1, 2].map((index) => (
              <div key={index} className="py-3 border-bottom">
                <div className="bma-skeleton mb-2" style={{ width: '30%', height: 14 }} />
                <div className="bma-skeleton mb-2" style={{ width: '85%', height: 12 }} />
                <div className="bma-skeleton" style={{ width: '60%', height: 12 }} />
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="card-body text-center py-5">
            <i className="fas fa-triangle-exclamation fa-2x text-muted mb-3"></i>
            <h4>We could not load reviews</h4>
            <button type="button" className="btn btn-primary mt-2" onClick={load}>Try again</button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="card-body text-center py-5">
            <i className="fas fa-star fa-2x text-muted mb-3"></i>
            <h4>{status === 'pending' ? 'Nothing waiting for review' : 'No reviews here'}</h4>
            <p className="text-muted mb-0">
              {status === 'pending'
                ? 'New customer reviews will appear here for checking before they go live.'
                : 'Try another tab.'}
            </p>
          </div>
        ) : (
          <>
            <ul className="bma-review-list">
              {reviews.map((review) => (
                <li key={review._id}>
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <StarRating value={review.rating} size="sm" />
                        <span className={`bma-lead-badge ${STATUS_CLASS[review.status]}`}>
                          {STATUS_LABEL[review.status]}
                        </span>
                        {review.isVerifiedCustomer && (
                          <span className="bma-verified">
                            <i className="fas fa-circle-check" aria-hidden="true"></i>Verified customer
                          </span>
                        )}
                      </div>
                      <div className="small text-muted mt-1">
                        {review.reviewer?.fullName || 'Traveller'}
                        {review.reviewer?.email && ` · ${review.reviewer.email}`}
                        {' → '}
                        <strong>{review.agent?.companyName || 'Unknown agent'}</strong>
                        {review.agent?.city && ` (${review.agent.city})`}
                        {' · '}{formatDate(review.createdAt)}
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      {review.status !== 'approved' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          disabled={busyId === review._id}
                          onClick={() => moderate(review, 'approved')}
                        >
                          Publish
                        </button>
                      )}
                      {review.status === 'pending' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={busyId === review._id}
                          onClick={() => moderate(review, 'rejected')}
                        >
                          Reject
                        </button>
                      )}
                      {review.status === 'approved' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          disabled={busyId === review._id}
                          onClick={() => moderate(review, 'hidden')}
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  </div>

                  {review.title && <h4 className="h6 mb-1">{review.title}</h4>}
                  <p className="mb-0" style={{ color: 'var(--bma-muted)' }}>{review.comment}</p>

                  {review.rejectionReason && (
                    <p className="small text-danger mt-2 mb-0">
                      <i className="fas fa-circle-xmark me-2" aria-hidden="true"></i>
                      Rejected: {review.rejectionReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <Pager
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              noun="reviews"
              onChange={setPage}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ReviewsManagement;
