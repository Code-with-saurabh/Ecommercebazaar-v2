import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';

/**
 * Decorative background video that stays out of the Critical Rendering Path.
 *
 * The <video> element is rendered immediately (same box as before -> no CLS),
 * but no bytes are downloaded until the element scrolls near the viewport AND
 * the browser is idle, so the LCP image / main-thread work is not competing
 * with a multi-megabyte mp4. Users who prefer reduced motion never load it.
 *
 *   <LazyVideo src={BGV2} className="background-video" />
 */
export default function LazyVideo({ src, type = 'video/mp4', className = '', poster, ...rest }) {
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || shouldLoad) return undefined;
    const el = videoRef.current;
    if (!el || !src) return undefined;

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const run = () => setShouldLoad(true);
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(run, { timeout: 2000 });
      } else {
        setTimeout(run, 250);
      }
    };

    if (typeof window.IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(
        entries => {
          if (entries.some(entry => entry.isIntersecting)) {
            observer.disconnect();
            start();
          }
        },
        { rootMargin: '150px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }

    start();
    return undefined;
  }, [reducedMotion, shouldLoad, src]);

  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      {...rest}
    >
      {shouldLoad && <source src={src} type={type} />}
    </video>
  );
}

LazyVideo.propTypes = {
  src: PropTypes.string.isRequired,
  type: PropTypes.string,
  className: PropTypes.string,
  poster: PropTypes.string,
};
