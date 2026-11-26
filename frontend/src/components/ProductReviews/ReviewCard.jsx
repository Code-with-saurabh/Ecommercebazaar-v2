import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '../../api';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function ReviewCard({ review, productId, viewer, loginTo }) {
  const [vote, setVote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const own = String(review.user?._id || review.user?.id || review.user) === viewer;
  const voted = vote?.helpfulVoted || review.helpfulVoted;
  const count = vote?.helpfulCount ?? review.helpfulCount ?? 0;
  const date = formatDate(review.createdAt);

  async function markHelpful() {
    if (pending.current || voted || own) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      setVote(await post(`/products/${productId}/reviews/${review._id}/helpful`));
    } catch (error) {
      setError(error.message || 'Could not save your vote. Try again.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <article className="product-reviews__card">
      <div className="product-reviews__card-head">
        <div>
          <strong>{review.user?.name || review.user?.username || 'Bazaar shopper'}</strong>
          {own && <span className="product-reviews__tag">Your review</span>}
          {review.verified && <span className="product-reviews__verified">Verified purchase</span>}
        </div>
        {date && <time dateTime={review.createdAt}>{date}</time>}
      </div>
      <p className="product-reviews__stars" aria-label={`${review.rating} out of 5 stars`}>
        <span aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
      </p>
      {review.title && <h3>{review.title}</h3>}
      <p className="product-reviews__comment">{review.comment}</p>
      <div className="product-reviews__card-foot">
        {viewer && !own ? (
          <button type="button" className="product-reviews__helpful" onClick={markHelpful}
            disabled={busy || voted} aria-pressed={Boolean(voted)}>
            {busy ? 'Saving vote…' : voted ? 'Marked helpful' : 'Helpful'} ({count})
          </button>
        ) : (
          <span className="product-reviews__muted">{count} {count === 1 ? 'person found' : 'people found'} this helpful</span>
        )}
        {!viewer && <Link to={loginTo} className="bz-link">Sign in to vote</Link>}
      </div>
      {error && <p className="product-reviews__error" role="alert">{error}</p>}
    </article>
  );
}
