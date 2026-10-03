import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get, put } from '../api';
import { hydrateItems } from '../store/slices/ForShirt.jsx';
import { subscribeAuth } from '../utils/session';

const PUSH_DEBOUNCE_MS = 400;

/**
 * Keeps the redux/local cart and the server cart in sync (Phase A3).
 *
 *   pull - on mount and on every session change (login/refresh/logout).
 *          Local empty   -> hydrate from the server (second device, merged
 *                           guest cart). Local non-empty -> local wins, the
 *                           next push overwrites the server copy.
 *   push - debounced PUT of the whole cart whenever it changes, so qty edits
 *          from the Cart page land on the account cart too.
 *
 * Fails soft everywhere: offline, rate-limited, or a first visit with an
 * empty cart - the local cart keeps working without a server round trip.
 */
export default function useCartSync() {
  const dispatch = useDispatch();
  const items = useSelector(state => state.Shirt.products);
  const [ready, setReady] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  const itemsRef = useRef(items);
  // a non-empty server cart exists -> emptying the local cart must still PUT
  // (so the clear propagates), while a brand-new visitor with nothing never
  // creates an empty server cart
  const serverKnownRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // login / refresh / logout all re-key the pull below
  useEffect(() => subscribeAuth(() => setAuthVersion(version => version + 1)), []);

  // --- pull ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cart = await get('/cart');
        if (cancelled || !cart || !Array.isArray(cart.items)) return;
        if (cart.items.length > 0) {
          serverKnownRef.current = true;
          if (itemsRef.current.length === 0) {
            dispatch(
              hydrateItems(
                cart.items.map(line => ({
                  id: String(line.product),
                  Bname: '',
                  name: line.name || '',
                  price: Number(line.price) || 0,
                  image: line.image || '',
                  qty: Number(line.qty) || 1,
                }))
              )
            );
          }
        }
      } catch {
        // offline / rate-limited: stay local-only
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authVersion, dispatch]);

  // --- push ------------------------------------------------------------------
  useEffect(() => {
    if (!ready) return undefined;
    if (items.length === 0 && !serverKnownRef.current) return undefined;

    const timer = setTimeout(() => {
      serverKnownRef.current = true;
      put('/cart/items', {
        items: items.map(item => ({
          productId: item.id,
          qty: Math.min(99, Math.max(1, Number(item.qty) || 1)),
        })),
      }).catch(() => {
        // offline: the local copy persists; the next change retries
      });
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [items, ready]);
}
