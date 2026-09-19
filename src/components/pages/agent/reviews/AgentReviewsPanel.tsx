import React, { useCallback, useEffect, useState } from 'react';
import { type RatingSummary, type Review } from '../../../../types/review';
import { reviewService } from '../../../../services/reviewService';
import { showToast, getErrorMessage } from '../../../../utils/toast';
import StarRating from '../../../marketplace/StarRating';
import StatTile from '../../../dashboard-admin/StatTile';
import Pager from '../../../dashboard-admin/Pager';
import { formatDate } from '../../../../utils/format';

interface AgentSummary extends RatingSummary {
  isPubliclyVisible: boolean;
}

// What customers have said, as the agent sees it.
//
// Read-only on purpose. Replying to reviews is a feature of its own and is not
// part of the agreed scope; more importantly an agent cannot edit, hide or
// remove anything here, because a rating an agent can curate is not a rating.
const AgentReviewsPanel: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<AgentSummary | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const response = await reviewService.getMyReviews(page);
      setReviews(response.data);
      setSummary(response.summary as AgentSummary);
      setPagination(response.pagination);
    } catch (error) {
      setHasError(true);
      showToast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const positive = (summary?.distribution?.['5'] || 0) + (summary?.distribution?.['4'] || 0);

  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-lg-4 col-md-4 col-6">
          <StatTile
            label="Average rating"
            value={summary?.reviewCount ? summary.avgRating.toFixed(1) : '—'}
            icon="fas fa-star"
            tone="warning"
          />
        </div>
        <div className="col-xl-3 col-lg-4 col-md-4 col-6">
          <StatTile label="Total reviews" value={summary?.reviewCount ?? 0} icon="fas fa-comments" tone="primary" />
        </div>
        <div className="col-xl-3 col-lg-4 col-md-4 col-6">
          <StatTile label="4 & 5 star" value={positive} icon="fas fa-thumbs-up" tone="success" />
        </div>
        <div className="col-xl-3 col-lg-4 col-md-4 col-6">
          <StatTile
            label="1 & 2 star"
            value={(summary?.distribution?.['1'] || 0) + (summary?.distribution?.['2'] || 0)}
            icon="fas fa-triangle-exclamation"
            tone="muted"
          />
        </div>
      </div>

      {summary && summary.reviewCount > 0 && (
        <div className="dashboard-card mb-3">
          <div className="card-body">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution?.[String(star)] || 0;
              const percent = summary.reviewCount ? (count / summary.reviewCount) * 100 : 0;
              return (
                <div className="d-flex align-items-center gap-2 mb-1" key={star}>
                  <span className="small text-muted" style={{ width: 46 }}>{star} star</span>
                  <div className="bma-meter flex-grow-1"><span style={{ width: `${percent}%` }} /></div>
                  <span className="small text-muted" style={{ width: 28, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard-card">
        {isLoading ? (
          <div className="card-body">
            {[0, 1, 2].map((index) => (
              <div key={index} className="py-3 border-bottom">
                <div className="bma-skeleton mb-2" style={{ width: '28%', height: 14 }} />
                <div className="bma-skeleton" style={{ width: '78%', height: 12 }} />
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="card-body text-center py-5">
            <i className="fas fa-triangle-exclamation fa-2x text-muted mb-3"></i>
            <h4>We could not load your reviews</h4>
            <button type="button" className="btn btn-primary mt-2" onClick={load}>Try again</button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="card-body text-center py-5">
            <i className="fas fa-star fa-2x text-muted mb-3"></i>
            {summary && !summary.isPubliclyVisible ? (
              <>
                <h4>Your profile is not live yet</h4>
                <p className="text-muted mb-0">
                  Customers can only review agents they can find and contact. Reviews will
                  appear here once your profile is approved.
                </p>
              </>
            ) : (
              <>
                <h4>No reviews yet</h4>
                <p className="text-muted mb-0">
                  Only travellers who contacted you through the platform can review you, and
                  every review is checked by our team before it appears.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <ul className="bma-review-list">
              {reviews.map((review) => (
                <li key={review._id}>
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="bma-review-avatar">
                        {review.reviewer.avatar
                          ? <img src={review.reviewer.avatar} alt="" />
                          : review.reviewer.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="fw-semibold" style={{ color: 'var(--bma-ink)' }}>
                          {review.reviewer.name}
                        </div>
                        <div className="small text-muted">{formatDate(review.createdAt)}</div>
                      </div>
                    </div>
                    <StarRating value={review.rating} size="sm" />
                  </div>

                  {review.isVerifiedCustomer && (
                    <span className="bma-verified mb-2">
                      <i className="fas fa-circle-check" aria-hidden="true"></i>Verified customer
                    </span>
                  )}

                  {review.title && <h4 className="h6 mt-2 mb-1">{review.title}</h4>}
                  <p className="mb-0" style={{ color: 'var(--bma-muted)' }}>{review.comment}</p>
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

export default AgentReviewsPanel;
