import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import Pager from '../dashboard-admin/Pager';
import {
  type RatingSummary,
  type Review,
  type ReviewEligibility,
} from '../../types/review';
import { reviewService } from '../../services/reviewService';
import { showToast } from '../../utils/toast';
import { formatDate } from '../../utils/format';

interface ReviewsTabProps {
  agentId: string;
  agentName?: string;
  // Lets the profile header's rating update the moment a review is withdrawn.
  onSummaryChange?: (summary: RatingSummary) => void;
}

const EMPTY_FORM = { rating: 0, title: '', comment: '' };

// The Reviews tab: the summary, the reviews themselves, and whichever of the
// review states applies to the person looking at the page.
const ReviewsTab: React.FC<ReviewsTabProps> = ({ agentId, agentName, onSummaryChange }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    avgRating: 0, reviewCount: 0, distribution: {},
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isWriting, setIsWriting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Held in a ref rather than listed as a dependency. Callers pass an inline
  // arrow, so its identity changes on every parent render; depending on it
  // meant each load triggered a re-render that rebuilt `load` and fetched
  // again, forever.
  const onSummaryChangeRef = useRef(onSummaryChange);
  useEffect(() => { onSummaryChangeRef.current = onSummaryChange; }, [onSummaryChange]);

  const load = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const [list, eligible] = await Promise.all([
        reviewService.getAgentReviews(agentId, page),
        // Eligibility depends on who is asking, and a signed-out visitor is a
        // normal answer here rather than an error.
        reviewService.getEligibility(agentId).catch(() => null),
      ]);
      setReviews(list.data);
      setSummary(list.summary);
      setPagination(list.pagination);
      onSummaryChangeRef.current?.(list.summary);
      if (eligible) setEligibility(eligible.data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => { load(1); }, [load]);

  const startWriting = () => {
    const existing = eligibility?.existingReview;
    setForm(existing
      ? { rating: existing.rating, title: existing.title || '', comment: existing.comment }
      : EMPTY_FORM);
    setErrors({});
    setIsWriting(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    try {
      setIsSaving(true);
      const existing = eligibility?.existingReview;
      const response = existing
        ? await reviewService.update(existing._id, form)
        : await reviewService.submit(agentId, form);

      showToast.success(response.message);
      setIsWriting(false);
      load(1);
    } catch (error) {
      const payload = (error as {
        response?: { data?: { errors?: Record<string, string>; message?: string } };
      })?.response?.data;

      if (payload?.errors) {
        setErrors(payload.errors);
      } else {
        showToast.error(payload?.message || 'We could not save your review. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleWithdraw = async () => {
    const existing = eligibility?.existingReview;
    if (!existing) return;

    try {
      await reviewService.remove(existing._id);
      showToast.success('Your review has been removed');
      setIsWriting(false);
      load(1);
    } catch {
      showToast.error('We could not remove your review. Please try again.');
    }
  };

  // Each ineligible case gets its own sentence. "You cannot review" with no
  // reason reads as a bug; the real reason is usually something the customer
  // can act on.
  const renderEligibilityNotice = () => {
    if (!eligibility || eligibility.canReview || isWriting) return null;

    const existing = eligibility.existingReview;

    if (eligibility.reason === 'already_reviewed' && existing) {
      return (
        <div className="bma-card bma-card-pad mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <div>
              <h3 className="h6 mb-1">Your review</h3>
              <StarRating value={existing.rating} size="sm" />
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={startWriting}>
                Edit
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleWithdraw}>
                Remove
              </button>
            </div>
          </div>

          {existing.status === 'pending' && (
            <p className="small text-muted mb-2">
              <i className="fas fa-clock me-2" aria-hidden="true"></i>
              Awaiting moderation — it will appear publicly once our team has checked it.
            </p>
          )}
          {existing.status === 'rejected' && (
            <p className="small text-danger mb-2">
              <i className="fas fa-circle-xmark me-2" aria-hidden="true"></i>
              Not published{existing.rejectionReason ? `: ${existing.rejectionReason}` : '.'}
            </p>
          )}

          <p className="mb-0">{existing.comment}</p>
        </div>
      );
    }

    const notice = {
      not_signed_in: (
        <>
          <Link to="/login">Sign in</Link> to leave a review. We only publish reviews from
          travellers who contacted this agent through the platform.
        </>
      ),
      agents_cannot_review: 'Only travellers can review an agent.',
      no_interaction: (
        <>
          Reviews come from travellers who have contacted {agentName || 'this agent'} here. Send
          an enquiry or tap WhatsApp above, and you will be able to share your experience
          afterwards.
        </>
      ),
      already_reviewed: 'You have already reviewed this agent.',
      eligible: '',
    }[eligibility.reason];

    return (
      <div className="bma-card bma-card-pad mb-4 d-flex gap-3 align-items-start">
        <i className="fas fa-shield-halved mt-1" style={{ color: 'var(--bma-primary)' }} aria-hidden="true"></i>
        <p className="small text-muted mb-0">{notice}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bma-card bma-card-pad">
        <div className="bma-skeleton mb-3" style={{ width: 200, height: 30 }} />
        {[0, 1, 2].map((index) => (
          <div key={index} className="py-3 border-bottom">
            <div className="bma-skeleton mb-2" style={{ width: '30%', height: 14 }} />
            <div className="bma-skeleton" style={{ width: '80%', height: 12 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Summary */}
      {summary.reviewCount > 0 && (
        <div className="bma-card bma-card-pad mb-4">
          <div className="row g-4 align-items-center">
            <div className="col-md-4 text-center">
              <div className="bma-rating-big">{summary.avgRating.toFixed(1)}</div>
              <StarRating value={summary.avgRating} size="md" />
              <div className="small text-muted mt-2">
                {summary.reviewCount} review{summary.reviewCount === 1 ? '' : 's'}
              </div>
            </div>
            <div className="col-md-8">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[String(star)] || 0;
                const percent = summary.reviewCount ? (count / summary.reviewCount) * 100 : 0;
                return (
                  <div className="d-flex align-items-center gap-2 mb-1" key={star}>
                    <span className="small text-muted" style={{ width: 42 }}>{star} star</span>
                    <div className="bma-meter flex-grow-1">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <span className="small text-muted" style={{ width: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {renderEligibilityNotice()}

      {/* Write / edit */}
      {eligibility?.canReview && !isWriting && (
        <div className="bma-card bma-card-pad mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="h6 mb-1">You contacted {agentName || 'this agent'}</h3>
            <p className="small text-muted mb-0">Share how it went to help other travellers.</p>
          </div>
          <button type="button" className="bma-search-submit px-4" onClick={startWriting}>
            Write a review
          </button>
        </div>
      )}

      {isWriting && (
        <form className="bma-card bma-card-pad mb-4" onSubmit={handleSubmit} noValidate>
          <h3 className="bma-section-heading">
            {eligibility?.existingReview ? 'Edit your review' : 'Write a review'}
          </h3>

          <div className="mb-3">
            <label className="form-label d-block">Your rating <span className="text-danger">*</span></label>
            <StarRating
              value={form.rating}
              size="lg"
              onChange={(rating) => { setForm({ ...form, rating }); setErrors({ ...errors, rating: '' }); }}
            />
            {errors.rating && <div className="text-danger small mt-1">{errors.rating}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="review-title">Title</label>
            <input
              id="review-title"
              type="text"
              className="form-control"
              placeholder="Smooth Umrah trip, well organised"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            {errors.title && <div className="text-danger small mt-1">{errors.title}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="review-comment">
              Your experience <span className="text-danger">*</span>
            </label>
            <textarea
              id="review-comment"
              rows={4}
              className={`form-control${errors.comment ? ' is-invalid' : ''}`}
              placeholder="What went well, what could have been better…"
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
            />
            <div className="d-flex justify-content-between">
              {errors.comment
                ? <div className="text-danger small mt-1">{errors.comment}</div>
                : <span className="small text-muted mt-1">At least 20 characters.</span>}
              <span className="small text-muted mt-1">{form.comment.length}/1500</span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="bma-search-submit px-4" disabled={isSaving}>
              {isSaving ? 'Sending…' : 'Submit review'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setIsWriting(false)}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>

          <p className="small text-muted mt-3 mb-0">
            Reviews are checked by our team before they appear.
          </p>
        </form>
      )}

      {/* The reviews */}
      {reviews.length === 0 ? (
        <div className="bma-card bma-empty">
          <i className="fas fa-star fa-2x d-block" aria-hidden="true"></i>
          <h3 className="h5 mb-2" style={{ color: 'var(--bma-ink)' }}>No reviews yet</h3>
          <p className="mb-0">
            {agentName || 'This agent'} has been verified by our team but has not been reviewed
            yet. Reviews only come from travellers who contacted them here.
          </p>
        </div>
      ) : (
        <div className="bma-card">
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
            onChange={(page) => load(page)}
          />
        </div>
      )}
    </>
  );
};

export default ReviewsTab;
