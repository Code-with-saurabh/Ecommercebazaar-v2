import { useRef, useState } from 'react';
import { del } from '../../api';
import { useToast } from '../Toast/Toast';
import ReviewForm from './ReviewForm';
import useReviewQuery from './useReviewQuery';

function OwnReviewContent({ productId, initialReview, onChanged, onReload }) {
  const [review, setReview] = useState(initialReview);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const toast = useToast();

  function saved(value) {
    setReview(value);
    setEditing(false);
    setError('');
    onChanged();
    toast.success(value.status === 'hidden' ? 'Review saved. It remains hidden from the public list.' : 'Your review has been saved.');
  }

  async function remove() {
    if (pending.current || !window.confirm('Delete your review? This cannot be undone.')) return;
    pending.current = true;
    setDeleting(true);
    setError('');
    try {
      await del(`/products/${productId}/reviews/mine`);
      setReview(null);
      onChanged();
      toast.success('Your review has been deleted.');
    } catch (error) {
      setError(error.message || 'Could not delete your review. Try again.');
    } finally {
      pending.current = false;
      setDeleting(false);
    }
  }

  if (!review || editing) {
    return <ReviewForm productId={productId} review={review} onSaved={saved}
      onCancel={() => setEditing(false)} onReload={onReload} />;
  }

  return (
    <section className="product-reviews__own" aria-label="Your review">
      <h3>Your review</h3>
      <p className="product-reviews__stars" aria-label={`${review.rating} out of 5 stars`}>
        <span aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
      </p>
      {review.title && <h4>{review.title}</h4>}
      <p className="product-reviews__comment">{review.comment}</p>
      {review.status === 'hidden' && (
        <p className="product-reviews__notice">
          This review is hidden from the public list. Editing it does not change its moderation status.
        </p>
      )}
      <div className="product-reviews__actions">
        <button type="button" className="bz-btn bz-btn--outline" disabled={deleting} onClick={() => setEditing(true)}>
          Edit review
        </button>
        <button type="button" className="bz-btn bz-btn--outline product-reviews__delete" disabled={deleting} onClick={remove}>
          {deleting ? 'Deleting review…' : 'Delete review'}
        </button>
      </div>
      {error && <p className="product-reviews__error" role="alert">{error}</p>}
    </section>
  );
}

export default function OwnReview({ productId, onChanged }) {
  const { data, loading, error, refetch } = useReviewQuery(`/products/${productId}/reviews/mine`);
  if (loading) return <p role="status">Checking your review…</p>;
  if (error) {
    return (
      <div className="product-reviews__notice" role="alert">
        <p>Could not load your review. {error.message}</p>
        <button type="button" className="bz-btn bz-btn--outline" onClick={refetch}>Retry my review</button>
      </div>
    );
  }
  return <OwnReviewContent key={`${data?.review?._id || 'new'}:${data?.review?.updatedAt || ''}`}
    productId={productId} initialReview={data?.review || null} onChanged={onChanged} onReload={refetch} />;
}
