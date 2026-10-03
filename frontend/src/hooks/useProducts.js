import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '../api';

/**
 * Catalog fetch hooks (API is the source of truth now, see backend
 * routes/products.js).
 *
 *   const { items, loading, error, refetch } = useProducts({ category: 'shoes' });
 *   const { data, loading, error } = useProduct('air-max-270'); // id OR slug
 *
 * Lists share a module-level cache keyed by the normalized query, so Home,
 * Products and Search can ask for overlapping slices without stampeding the
 * API - and `refetch()` drops the entry first so a manual reload is honest.
 */

function keyOf(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('&');
}

const listCache = new Map();

export function useProducts(params = {}, { enabled = true } = {}) {
  const key = enabled ? keyOf(params) : '';
  const [state, setState] = useState(() => {
    const cached = key ? listCache.get(key) : null;
    return { items: cached || null, loading: enabled && !cached, error: null };
  });
  const seq = useRef(0);

  const load = useCallback(() => {
    if (!key) {
      setState({ items: null, loading: false, error: null });
      return;
    }
    const cached = listCache.get(key);
    if (cached) {
      setState({ items: cached, loading: false, error: null });
      return;
    }
    const mine = (seq.current += 1);
    setState(current => ({ items: current.items, loading: true, error: null }));
    get('/products', { params })
      .then(items => {
        listCache.set(key, Array.isArray(items) ? items : []);
        if (mine === seq.current) setState({ items: listCache.get(key), loading: false, error: null });
      })
      .catch(error => {
        if (mine === seq.current) setState({ items: null, loading: false, error });
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

  return { items: state.items, loading: state.loading, error: state.error, refetch };
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
