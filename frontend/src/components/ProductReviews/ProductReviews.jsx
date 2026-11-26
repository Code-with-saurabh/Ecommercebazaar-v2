import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { invalidateProductsCache } from '../../hooks/useProducts';
import { Skeleton, SkeletonText } from '../Skeleton/Skeleton';
import OwnReview from './OwnReview';
import ReviewCard from './ReviewCard';
import useReviewQuery from './useReviewQuery';
import useReviewViewer from './useReviewViewer';
import './ProductReviews.css';

const PAGE_SIZE = 5;

function Reviews({ productId, viewer, onRatingChange }) {
  const location = useLocation();
  const section = useRef(null);
  const [query, setQuery] = useState({ page: 1, sort: 'newest', revision: 0 });
  const reportRating = useCallback(envelope => {
    if (envelope.meta?.rating) onRatingChange?.(envelope.meta.rating);
  }, [onRatingChange]);
  const { data, meta, loading, error, refetch } = useReviewQuery(
    `/products/${productId}/reviews`,
    { page: query.page, sort: query.sort, limit: PAGE_SIZE },
    query.revision,
    reportRating
  );
  const items = data || [];
  const loginTo = { pathname: '/login', state: { from: `${location.pathname}${location.search}#reviews` } };

  useEffect(() => {
    if (location.hash === '#reviews') section.current?.scrollIntoView({ block: 'start' });
  }, [location.hash]);

  function onChanged() {
    invalidateProductsCache();
    setQuery(current => ({ ...current, page: 1, revision: current.revision + 1 }));
  }

  return (
    <section ref={section} id="reviews" className="bz-shell product-reviews" aria-labelledby="product-reviews-heading">
      <div className="product-reviews__heading">
        <div>
          <p className="bz-caps product-reviews__eyebrow">From the community</p>
          <h2 id="product-reviews-heading" className="bz-title">Customer reviews</h2>
        </div>
        {meta?.rating && (
          <p className="product-reviews__summary" role="status">
            {meta.rating.count > 0
              ? <><strong>{meta.rating.avg.toFixed(1)} / 5</strong><span>{meta.rating.count} {meta.rating.count === 1 ? 'review' : 'reviews'}</span></>
              : 'No published reviews yet'}
          </p>
        )}
      </div>

      <div className="product-reviews__layout">
        <div className="product-reviews__feed">
          <div className="product-reviews__toolbar">
            <label htmlFor="product-reviews-sort">Sort reviews</label>
            <select id="product-reviews-sort" className="bz-select" value={query.sort}
              onChange={event => setQuery(current => ({ ...current, sort: event.target.value, page: 1 }))}>
              <option value="newest">Newest first</option>
              <option value="helpful">Most helpful</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>

          {loading ? (
            <div className="product-reviews__loading" role="status" aria-label="Loading customer reviews">
              <Skeleton width="35%" height={18} radius={2} />
              <SkeletonText lines={3} />
              <span className="sr-only">Loading customer reviews…</span>
            </div>
          ) : error ? (
            <div className="product-reviews__notice" role="alert">
              <p>Could not load reviews. {error.message}</p>
              <button type="button" className="bz-btn bz-btn--outline" onClick={refetch}>Retry reviews</button>
            </div>
          ) : items.length === 0 ? (
            <div className="product-reviews__notice" role="status">
              <p>{meta?.total ? 'There are no reviews on this page.' : 'Be the first to share your experience with this product.'}</p>
              {query.page > 1 && <button type="button" className="bz-btn bz-btn--outline"
                onClick={() => setQuery(current => ({ ...current, page: 1 }))}>Back to first page</button>}
            </div>
          ) : (
            <div className="product-reviews__list">
              {items.map(review => <ReviewCard key={`${review._id}:${review.helpfulCount}:${review.helpfulVoted}`}
                review={review} productId={productId} viewer={viewer} loginTo={loginTo} />)}
            </div>
          )}

          {!loading && !error && meta?.totalPages > 1 && (
            <nav className="product-reviews__pagination" aria-label="Review pages">
              <button type="button" className="bz-btn bz-btn--outline" disabled={query.page <= 1}
                onClick={() => setQuery(current => ({ ...current, page: current.page - 1 }))}>Previous reviews</button>
              <span role="status">Page {query.page} of {meta.totalPages}</span>
              <button type="button" className="bz-btn bz-btn--outline" disabled={!meta.hasNext}
                onClick={() => setQuery(current => ({ ...current, page: current.page + 1 }))}>Next reviews</button>
            </nav>
          )}
        </div>

        <div className="product-reviews__editor">
          {viewer ? <OwnReview productId={productId} onChanged={onChanged} /> : (
            <div className="product-reviews__signin">
              <h3>Have something to share?</h3>
              <p>Sign in to write a review or mark a review as helpful.</p>
              <Link to={loginTo} className="bz-btn bz-btn--primary">Sign in to write a review</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ProductReviews({ productId, onRatingChange }) {
  const viewer = useReviewViewer();
  // Account changes discard private drafts/results instead of exposing them to the next user.
  return <Reviews key={`${productId}:${viewer}`} productId={productId} viewer={viewer} onRatingChange={onRatingChange} />;
}
