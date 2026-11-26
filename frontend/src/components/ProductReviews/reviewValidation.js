import * as Yup from 'yup';

export const REVIEW_LIMITS = { title: 100, commentMin: 3, comment: 2000 };

export const reviewSchema = Yup.object({
  rating: Yup.number()
    .typeError('Choose a rating from 1 to 5 stars.')
    .required('Choose a rating from 1 to 5 stars.')
    .integer('Choose a whole number of stars.')
    .min(1, 'Choose a rating from 1 to 5 stars.')
    .max(5, 'Choose a rating from 1 to 5 stars.'),
  title: Yup.string().trim().max(REVIEW_LIMITS.title, 'Keep the title within 100 characters.'),
  comment: Yup.string().trim()
    .required('Tell other shoppers about this product.')
    .min(REVIEW_LIMITS.commentMin, 'Write at least 3 characters.')
    .max(REVIEW_LIMITS.comment, 'Keep your review within 2,000 characters.'),
});

export function reviewPayload(values) {
  return {
    rating: Number(values.rating),
    title: (values.title || '').trim(),
    comment: values.comment.trim(),
  };
}
