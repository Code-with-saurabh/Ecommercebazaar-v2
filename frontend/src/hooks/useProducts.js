import { useCallback, useEffect, useRef, useState } from 'react';
import { get, raw } from '../api';

/**
 * Catalog fetch hooks (API is the source of truth now, see backend
 * routes/products.js).
 *
 *   const { items, meta, loading, error, refetch } = useProducts({ category: 'shoes' });
 *   const { data, loading, error } = useProduct('air-max-270'); // id OR slug
 *
 * Lists share a module-level cache keyed by the normalized query, so Home,
 * Products and Search can ask for overlapping slices without stampeding the
 * API - and `refetch()` drops the entry first so a manual reload is honest.
 * Each cache entry holds `{ items, meta }` so pagination (meta.totalPages)
 * survives a cache hit without a second request.
 */

function keyOf(params) {
  return JSON.stringify(Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b)));
}

const listCache = new Map();
const cachedList = key => {
  const entry = listCache.get(key);
  return entry && Date.now() - entry.at < 60000 ? entry : null;
};

/** Review mutations change catalog rating summaries even when prices stay the same. */
export function invalidateProductsCache() {
  listCache.clear();
}

export function useProducts(params = {}, { enabled = true } = {}) {
  const key = enabled ? keyOf(params) : '';
  const [state, setState] = useState(() => {
    const cached = key ? cachedList(key) : null;
    return {
      items: cached ? cached.items : null,
      meta: cached ? cached.meta : null,
      loading: enabled && !cached,
      error: null,
    };
  });
  const seq = useRef(0);

  const load = useCallback(() => {
    const mine = ++seq.current;
    if (!key) {
      setState({ items: null, meta: null, loading: false, error: null });
      return;
    }
    const cached = cachedList(key);
    if (cached) {
      setState({ items: cached.items, meta: cached.meta, loading: false, error: null });
      return;
    }
    setState({ items: null, meta: null, loading: true, error: null });
    // raw envelope: items live in .data, pagination in .meta
    raw
      .get('/products', { params })
      .then(envelope => {
        const entry = {
          at: Date.now(),
          items: Array.isArray(envelope && envelope.data) ? envelope.data : [],
          meta: (envelope && envelope.meta) || null,
        };
        listCache.set(key, entry);
        if (listCache.size > 100) listCache.delete(listCache.keys().next().value);
        if (mine === seq.current) setState({ ...entry, loading: false, error: null });
      })
      .catch(error => {
        if (mine === seq.current) setState({ items: null, meta: null, loading: false, error });
      });
    // `params` identity changes every render; `key` is the stable proxy for it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => {
    listCache.delete(key);
    load();
  }, [key, load]);

  return { items: state.items, meta: state.meta, loading: state.loading, error: state.error, refetch };
}

export function useProduct(idOrSlug) {
  const key = idOrSlug || '';
  const [state, setState] = useState({ data: null, loading: Boolean(key), error: null });
  const seq = useRef(0);

  const load = useCallback(() => {
    if (!key) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const mine = (seq.current += 1);
    setState({ data: null, loading: true, error: null });
    get(`/products/${encodeURIComponent(key)}`)
      .then(data => {
        if (mine === seq.current) setState({ data, loading: false, error: null });
      })
      .catch(error => {
        if (mine === seq.current) setState({ data: null, loading: false, error });
      });
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
