import { useId, useRef } from 'react';
import { useFormik } from 'formik';
import { post, put } from '../../api';
import { REVIEW_LIMITS, reviewPayload, reviewSchema } from './reviewValidation';

export default function ReviewForm({ productId, review, onSaved, onCancel, onReload }) {
  const prefix = useId();
  const pending = useRef(false);
  const form = useFormik({
    initialValues: {
      rating: review?.rating ?? '',
      title: review?.title || '',
      comment: review?.comment || '',
    },
    validationSchema: reviewSchema,
    onSubmit: async (values, helpers) => {
      if (pending.current) return;
      pending.current = true;
      helpers.setStatus(null);
      try {
        const url = `/products/${productId}/reviews`;
        const saved = review
          ? await put(`${url}/mine`, reviewPayload(values))
          : await post(url, reviewPayload(values));
        onSaved(saved);
      } catch (error) {
        if (error.fieldErrors) helpers.setErrors(error.fieldErrors);
        helpers.setStatus({ message: error.message || 'Could not save your review. Try again.', conflict: error.status === 409 });
      } finally {
        pending.current = false;
        helpers.setSubmitting(false);
      }
    },
  });
  const error = name => form.touched[name] && form.errors[name];

  return (
    <form className="product-reviews__form" onSubmit={form.handleSubmit} noValidate aria-label={review ? 'Edit your review' : 'Write a review'}>
      <h3>{review ? 'Edit your review' : 'Write a review'}</h3>
      <p className="product-reviews__muted">Share your experience. One review per account, per product.</p>

      <fieldset disabled={form.isSubmitting} className="product-reviews__fields">
        <fieldset className="product-reviews__rating-input" aria-describedby={error('rating') ? `${prefix}-rating-error` : undefined}>
          <legend>Your rating (required)</legend>
          <div className="product-reviews__choices">
            {[1, 2, 3, 4, 5].map(rating => (
              <label key={rating} className={`product-reviews__choice${Number(form.values.rating) === rating ? ' is-selected' : ''}`}>
                <input type="radio" name="rating" value={rating} checked={Number(form.values.rating) === rating}
                  onChange={form.handleChange} onBlur={form.handleBlur} required aria-invalid={Boolean(error('rating'))} />
                <span aria-hidden="true">{rating} ★</span>
                <span className="sr-only">{rating} {rating === 1 ? 'star' : 'stars'}</span>
              </label>
            ))}
          </div>
          {error('rating') && <p className="product-reviews__error" id={`${prefix}-rating-error`}>{error('rating')}</p>}
        </fieldset>

        <div className="bz-field">
          <label htmlFor={`${prefix}-title`}>Review title (optional)</label>
          <input id={`${prefix}-title`} name="title" className="bz-input" maxLength={REVIEW_LIMITS.title}
            value={form.values.title} onChange={form.handleChange} onBlur={form.handleBlur}
            aria-invalid={Boolean(error('title'))} aria-describedby={error('title') ? `${prefix}-title-error` : undefined} />
          {error('title') && <p className="product-reviews__error" id={`${prefix}-title-error`}>{error('title')}</p>}
        </div>

        <div className="bz-field">
          <label htmlFor={`${prefix}-comment`}>Your review (required)</label>
          <textarea id={`${prefix}-comment`} name="comment" className="bz-textarea" rows={5} required
            minLength={REVIEW_LIMITS.commentMin} maxLength={REVIEW_LIMITS.comment}
            value={form.values.comment} onChange={form.handleChange} onBlur={form.handleBlur}
            aria-invalid={Boolean(error('comment'))}
            aria-describedby={`${prefix}-comment-hint${error('comment') ? ` ${prefix}-comment-error` : ''}`} />
          <span className="product-reviews__muted" id={`${prefix}-comment-hint`}>
            {form.values.comment.length} / {REVIEW_LIMITS.comment} characters · Minimum 3 characters
          </span>
          {error('comment') && <p className="product-reviews__error" id={`${prefix}-comment-error`}>{error('comment')}</p>}
        </div>

        <div className="product-reviews__actions">
          <button type="submit" className="bz-btn bz-btn--primary" disabled={form.isSubmitting}>
            {form.isSubmitting ? 'Saving review…' : review ? 'Save review' : 'Post review'}
          </button>
          {review && <button type="button" className="bz-btn bz-btn--outline" onClick={onCancel}>Cancel editing</button>}
        </div>
      </fieldset>

      {form.status && (
        <div className="product-reviews__notice" role="alert">
          <p>{form.status.message}</p>
          {form.status.conflict && (
            <button type="button" className="bz-btn bz-btn--outline" onClick={onReload}>
              Load my existing review
            </button>
          )}
        </div>
      )}
    </form>
  );
}
