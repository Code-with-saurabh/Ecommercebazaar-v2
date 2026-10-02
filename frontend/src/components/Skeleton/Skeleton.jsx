import React from 'react';
import PropTypes from 'prop-types';
import './Skeleton.css';

/**
 * Skeleton (shimmer) placeholders.
 *
 * Why skeletons instead of a spinner: a grey block shaped like the real UI
 * keeps layout stable (no jump when data arrives) and tells the user *what*
 * is loading. Every placeholder below mirrors markup that actually exists:
 *
 *   <ProductGridSkeleton />  -> pages/Products (VirtualGrid + ProductCard)
 *   <HomeSkeleton />         -> pages/Home (Hero + two card rows)
 *   <CartSkeleton />         -> pages/Cart
 *   <FormSkeleton />         -> pages/Login, pages/SignUp
 *   <ListSkeleton />         -> components/List, search results
 *
 * Usage:
 *   <ProductGridSkeleton count={8} />              // section loading
 *   <Suspense fallback={<ProductGridSkeleton />}>  // route chunk loading
 *
 * Accessibility: the container is a `role="status"` live region (announced
 * once), the decorative blocks themselves are hidden from assistive tech.
 */

/** Base shimmer block. Width/height accept px numbers or CSS strings. */
export function Skeleton({ width = '100%', height = 16, radius = 8, className = '', style }) {
  const toCss = value => (typeof value === 'number' ? `${value}px` : value);

  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width: toCss(width), height: toCss(height), borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

Skeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  radius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  style: PropTypes.object,
};

/** N stacked text lines; the last one is short so it reads like a sentence. */
export function SkeletonText({ lines = 3, width = '100%', lastWidth = '55%', height = 12 }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastWidth : width}
          height={height}
          radius={6}
        />
      ))}
    </>
  );
}

SkeletonText.propTypes = {
  lines: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lastWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

/** Same box as `.card` (ProductCard.css) so nothing shifts when data lands. */
export function ProductCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton className="skeleton-card__image" height={null} radius={15} />
      <div className="skeleton-card__body">
        <Skeleton width="45%" height={11} radius={6} />
        <Skeleton width="95%" height={13} radius={6} />
        <Skeleton width="70%" height={13} radius={6} />
        <div className="skeleton-card__stars">
          <Skeleton width={18} height={18} radius="50%" />
          <Skeleton width={18} height={18} radius="50%" />
          <Skeleton width={18} height={18} radius="50%" />
          <Skeleton width={18} height={18} radius="50%" />
          <Skeleton width={18} height={18} radius="50%" />
        </div>
        <Skeleton width="35%" height={15} radius={6} />
        <Skeleton width="100%" height={38} radius={12} />
      </div>
    </div>
  );
}

/** Catalog grid: same columns/gap as `.GridStyle` in pages/Products. */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="skeleton-grid" role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}

ProductGridSkeleton.propTypes = {
  count: PropTypes.number,
};

/** Home: hero banner block + two rows of cards. */
export function HomeSkeleton() {
  return (
    <div role="status" aria-label="Loading home page">
      <div className="skeleton-hero" aria-hidden="true">
        <Skeleton width="55%" height={44} radius={10} />
        <Skeleton width="40%" height={16} radius={6} />
        <Skeleton width={150} height={44} radius={22} />
      </div>

      {['Recommended', 'Features'].map(title => (
        <div className="skeleton-section" key={title} aria-hidden="true">
          <h1 className="skeleton-section__title">
            <Skeleton width={220} height={30} radius={8} />
          </h1>
          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading home page…</span>
    </div>
  );
}

/** Cart rows: image square + text lines + button, mirroring `.IMGS-CC`. */
export function CartSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-label="Loading cart">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-cart-row" key={index} aria-hidden="true">
          <Skeleton className="skeleton-cart-row__image" height={null} radius={22} />
          <div className="skeleton-cart-row__body">
            <Skeleton width="70%" height={16} radius={6} />
            <Skeleton width="30%" height={14} radius={6} />
            <div className="skeleton-cart-row__actions">
              <Skeleton width={36} height={36} radius={10} />
              <Skeleton width={70} height={36} radius={10} />
              <Skeleton width={36} height={36} radius={10} />
            </div>
          </div>
        </div>
      ))}
      <div className="skeleton-cart-row__summary" aria-hidden="true">
        <Skeleton width="45%" height={20} radius={6} />
      </div>
      <span className="sr-only">Loading cart…</span>
    </div>
  );
}

CartSkeleton.propTypes = {
  rows: PropTypes.number,
};

/** Login / signup card: heading + N labelled input rows + submit button. */
export function FormSkeleton({ fields = 4, width = 420 }) {
  return (
    <div className="skeleton-form" style={{ maxWidth: typeof width === 'number' ? `${width}px` : width }} role="status" aria-label="Loading form">
      <Skeleton width="55%" height={28} radius={8} />
      {Array.from({ length: fields }).map((_, index) => (
        <div className="skeleton-form__field" key={index} aria-hidden="true">
          <Skeleton width="30%" height={12} radius={6} />
          <Skeleton width="100%" height={42} radius={10} />
        </div>
      ))}
      <Skeleton width="100%" height={44} radius={12} />
      <span className="sr-only">Loading form…</span>
    </div>
  );
}

FormSkeleton.propTypes = {
  fields: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

/** Generic list (search results, order history): `rows` rounded rows. */
export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading list">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-list__row" key={index} aria-hidden="true">
          <Skeleton width={44} height={44} radius={10} />
          <div className="skeleton-list__lines">
            <Skeleton width="60%" height={13} radius={6} />
            <Skeleton width="35%" height={11} radius={6} />
          </div>
          <Skeleton width={70} height={16} radius={6} />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

ListSkeleton.propTypes = {
  rows: PropTypes.number,
};

/** Fallback for every other lazy route (about, help, contact, errors…). */
export function PageSkeleton({ sections = 3 }) {
  return (
    <div className="skeleton-page" role="status" aria-label="Loading page">
      <Skeleton width="45%" height={34} radius={8} />
      <Skeleton width="75%" height={14} radius={6} />
      {Array.from({ length: sections }).map((_, index) => (
        <div className="skeleton-page__section" key={index} aria-hidden="true">
          <Skeleton width="35%" height={20} radius={6} />
          <SkeletonText lines={3} lastWidth="70%" />
        </div>
      ))}
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

PageSkeleton.propTypes = {
  sections: PropTypes.number,
};

export default Skeleton;
