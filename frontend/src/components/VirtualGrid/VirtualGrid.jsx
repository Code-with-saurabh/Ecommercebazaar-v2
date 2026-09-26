import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useRafThrottle } from '../../hooks/useRafThrottle';
import './VirtualGrid.css';

/**
 * Windowed (virtualised) list/grid.
 *
 * Keeps the host layout untouched: the visible slice renders in normal flow
 * and two spacer elements stand in for the rows above/below, so the original
 * CSS grid/flex rules still position every card exactly as before.
 *
 * - Scroll tracking is rAF-throttled (max one state update per frame).
 * - Row stride is measured from the real DOM, so it works for both grid and
 *   flex hosts and survives webfonts/images changing card height.
 * - Renders everything until a measurement exists: progressive enhancement
 *   only, it can never clip or hide content.
 *
 * renderItem(item, index) must return a single element; its key is set here.
 */
export default function VirtualGrid({
  items,
  renderItem,
  itemKey,
  layout = 'grid',
  minColumnWidth = 250,
  columns: columnsOverride = 0,
  gap = 20,
  overscan = 2,
  className = '',
  empty = null,
  ...rest
}) {
  const containerRef = useRef(null);
  const [stride, setStride] = useState(0); // measured row height + gap
  const [columns, setColumns] = useState(columnsOverride || 1);
  const [containerTop, setContainerTop] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  const total = items ? items.length : 0;

  // ---- column count (mirrors repeat(auto-fit, minmax(minColumnWidth, 1fr))) ----
  useLayoutEffect(() => {
    if (columnsOverride) {
      setColumns(columnsOverride);
      return undefined;
    }
    const el = containerRef.current;
    if (!el) return undefined;

    const measure = () => {
      const width = el.clientWidth;
      if (width > 0) setColumns(Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap))));
    };

    measure();
    if (typeof window.ResizeObserver === 'function') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [columnsOverride, minColumnWidth, gap]);

  // ---- measure real row stride (only while the list is fully rendered) ----
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || stride !== 0 || total === 0) return;

    const kids = Array.prototype.filter.call(el.children, child => !child.dataset.vgSpacer);
    if (kids.length === 0) return;

    let measured = 0;
    const byColumns = Math.min(columns, kids.length - 1);
    if (byColumns > 0) measured = kids[byColumns].offsetTop - kids[0].offsetTop;
    if (!measured && kids.length > 1) measured = kids[1].offsetTop - kids[0].offsetTop;
    if (!measured) measured = kids[0].offsetHeight + gap;
    if (measured > 0) setStride(measured);
  }, [stride, columns, total, gap]);

  // Re-measure if webfonts load after first paint (card height can change)
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;
    if (document.fonts.status === 'loaded') return;
    let cancelled = false;
    document.fonts.ready
      .then(() => {
        if (!cancelled) setStride(0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- scroll / resize (rAF-throttled) ----
  const onScroll = useRafThrottle(() => {
    setScrollTop(window.scrollY || window.pageYOffset || 0);
    setViewportHeight(window.innerHeight);
  });

  useEffect(() => {
    setViewportHeight(window.innerHeight);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [onScroll]);

  // ---- document offset of the container ----
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const update = () => setContainerTop(el.getBoundingClientRect().top + (window.scrollY || 0));
    update();
    if (typeof window.ResizeObserver === 'function') {
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }
    return undefined;
  }, [total, columns]);

  // ---- window maths ----
  const rows = Math.ceil(total / columns) || 0;
  const active = stride > 0 && total > columns * 3;

  let start = 0;
  let end = total;
  if (active) {
    const relativeTop = Math.max(0, scrollTop - containerTop);
    const firstRow = Math.floor(relativeTop / stride);
    const visibleRows = Math.ceil(viewportHeight / stride);
    start = Math.max(0, (firstRow - overscan) * columns);
    start -= start % columns;
    end = Math.min(total, (firstRow + visibleRows + overscan + 1) * columns);
  }

  const slice = active ? items.slice(start, end) : total ? items : [];
  const startRow = Math.floor(start / columns);
  const endRow = Math.ceil(end / columns);
  const topHeight = active && startRow > 0 ? startRow * stride - gap : 0;
  const bottomHeight = active && endRow < rows ? (rows - endRow) * stride - gap : 0;

  if (total === 0) return empty || null;

  const spacerStyle =
    layout === 'grid'
      ? { gridColumn: '1 / -1' }
      : { flex: '0 0 100%', width: '100%', maxWidth: '100%' };

  return (
    <div
      ref={containerRef}
      className={`virtual-grid ${className}`.trim()}
      data-virtualised={active ? 'true' : 'false'}
      {...rest}
    >
      {topHeight > 0 && (
        <div data-vg-spacer="top" aria-hidden="true" style={{ ...spacerStyle, height: topHeight }} />
      )}
      {slice.map((item, index) => {
        const node = renderItem(item, start + index);
        const key = itemKey ? itemKey(item, start + index) : start + index;
        return React.isValidElement(node) ? React.cloneElement(node, { key: node.key || key }) : node;
      })}
      {bottomHeight > 0 && (
        <div
          data-vg-spacer="bottom"
          aria-hidden="true"
          style={{ ...spacerStyle, height: bottomHeight }}
        />
      )}
    </div>
  );
}

VirtualGrid.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  itemKey: PropTypes.func,
  layout: PropTypes.oneOf(['grid', 'flex']),
  minColumnWidth: PropTypes.number,
  columns: PropTypes.number,
  gap: PropTypes.number,
  overscan: PropTypes.number,
  className: PropTypes.string,
  empty: PropTypes.node,
};
