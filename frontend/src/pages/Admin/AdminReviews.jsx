import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patch, raw } from '../../api';
import { useToast } from '../../components/Toast/Toast.jsx';
import { ListSkeleton } from '../../components/Skeleton/Skeleton';

/**
 * /admin?view=reviews - review moderation.
 *
 * Hide/Publish PATCHes /admin/reviews/:id/status; the Review model's
 * setStatus hook recomputes the product's rating aggregate, so hiding a
 * review immediately fixes the storefront average. Owner edits keep a
 * hidden review hidden (they never republish themselves).
 */
const PAGE_SIZE = 20;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function excerpt(text, max = 140) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function AdminReviews({ bump }) {
  const toast = useToast();

  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const envelope = await raw.get('/admin/reviews', {
        params: { status: status || undefined, page, limit: PAGE_SIZE },
      });
      setReviews(Array.isArray(envelope.data) ? envelope.data : []);
      setMeta(envelope.meta || null);
    } catch (err) {
      setReviews([]);
      setError(err.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- spinner flag only; list lands after await
    load();
  }, [load, bump]);

  // new filter -> back to page 1 (adjusted during render, not in an effect)
  const filterKey = String(status);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const toggleStatus = async review => {
    const next = review.status === 'published' ? 'hidden' : 'published';
    setBusyId(review._id);
    try {
      const updated = await patch(`/admin/reviews/${review._id}/status`, { status: next });
      setReviews(prev => prev.map(item => (item._id === updated._id ? { ...item, ...updated } : item)));
      toast.success(next === 'hidden' ? 'Review hidden' : 'Review published');
    } catch (err) {
      toast.error(err.message || 'Moderation action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All reviews</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : error ? null : reviews.length === 0 ? (
        <div className="bz-empty">
          <h2>No reviews found.</h2>
        </div>
      ) : (
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Review moderation">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Author</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review._id}>
                  <td>
                    {review.product ? (
                      <Link to={`/products/${review.product.slug || review.product._id}`}>
                        <strong>{review.product.name}</strong>
                      </Link>
                    ) : (
                      <span className="admin-muted">Removed product</span>
                    )}
                  </td>
                  <td>
                    {review.user ? (
                      <>
                        <strong>{review.user.username}</strong>
                        <span className="admin-table__email">{review.user.email}</span>
                      </>
                    ) : (
                      <span className="admin-muted">Deleted account</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-stars" aria-label={`${review.rating} out of 5`}>
                      {'★'.repeat(review.rating || 0)}
                      {'☆'.repeat(5 - (review.rating || 0))}
                    </span>
                  </td>
                  <td className="admin-excerpt">
                    {review.title && <strong>{review.title}</strong>}
                    <span className="admin-table__email" title={review.comment || ''}>
                      {excerpt(review.comment)}
                    </span>
                    <span className="admin-table__email">
                      {review.helpful || 0} helpful{review.verified ? ' · verified purchase' : ''}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge admin-badge--${review.status === 'published' ? 'active' : 'off'}`}>
                      {review.status === 'published' ? 'Published' : 'Hidden'}
                    </span>
                  </td>
                  <td>{formatDate(review.createdAt)}</td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className={review.status === 'published' ? 'admin-action admin-action--danger' : 'admin-action'}
                      disabled={busyId === review._id}
                      onClick={() => toggleStatus(review)}
                    >
                      {review.status === 'published' ? 'Hide' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="admin-pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>
            ← Prev
          </button>
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} reviews
          </span>
          <button type="button" disabled={!meta.hasNext} onClick={() => setPage(current => current + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}

export default AdminReviews;
