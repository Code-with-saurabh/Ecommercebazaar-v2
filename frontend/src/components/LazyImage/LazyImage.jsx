import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './LazyImage.css';

/**
 * LazyImage — deferred + skeleton'd product/media image.
 *
 * Three things happen in one component:
 *   1. **True lazy loading.** The `<img>` is not even created until an
 *      IntersectionObserver says the wrapper is within 200px of the viewport
 *      (browsers' native `loading="lazy"` still downloads the image as soon
 *      as layout is computed in some engines; deferring the element saves the
 *      bytes on long grids). Native lazy is set too, as a belt & braces.
 *   2. **Skeleton while loading.** A shimmer fills the reserved box, so the
 *      grid never shows a hole and never jumps when the bytes arrive
 *      (the wrapper keeps the same aspect-ratio as the final image).
 *   3. **Fade-in + error state.** The image swaps in with an opacity
 *      transition; a failed download leaves a neutral block instead of the
 *      browser's broken-image icon.
 *
 * Props:
 *   <LazyImage src={url} alt="..." className="PDF" wrapperClassName="lazy-image--square" />
 *   - `className`          -> the <img> (keeps existing per-page CSS)
 *   - `wrapperClassName`   -> the box (aspect-ratio, grid cell, …)
 *   - `eager`              -> load immediately (LCP: hero, above-the-fold)
 */
export default function LazyImage({
  src,
  alt = '',
  width,
  height,
  className = '',
  wrapperClassName = '',
  wrapperStyle,
  eager = false,
  rootMargin = '200px 0px',
  ...imgProps
}) {
  const wrapperRef = useRef(null);
  const [nearViewport, setNearViewport] = useState(eager);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Deferred mount: only observe when we are actually deferring.
  useEffect(() => {
    if (nearViewport || eager || !src) return undefined;

    const node = wrapperRef.current;
    if (!node) return undefined;

    // No IntersectionObserver (very old browser / SSR) -> load right away.
    if (typeof IntersectionObserver !== 'function') {
      setNearViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [nearViewport, eager, src, rootMargin]);

  // A new src is a new image: reset the flags or the old state leaks.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const shouldRender = (nearViewport || eager) && Boolean(src) && !failed;
  const status = loaded ? 'is-loaded' : shouldRender ? 'is-loading' : 'is-idle';

  return (
    <span
      ref={wrapperRef}
      className={`lazy-image ${status} ${wrapperClassName}`.trim()}
      style={wrapperStyle}
    >
      {shouldRender && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`lazy-image__img ${className}`.trim()}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          {...imgProps}
        />
      )}

      {!loaded && !failed && <span className="lazy-image__placeholder" aria-hidden="true" />}
      {failed && <span className="lazy-image__fallback" aria-hidden="true" role="img" aria-label={alt} />}
    </span>
  );
}

LazyImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  wrapperStyle: PropTypes.object,
  eager: PropTypes.bool,
  rootMargin: PropTypes.string,
};
