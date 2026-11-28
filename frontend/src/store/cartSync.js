import { get, put } from '../api';
import { getToken, getUser, subscribeAuth } from '../utils/session';
import { Store } from './Store';
import { clearCart, hydrateItems } from './slices/ForShirt';

const owner = () => getToken() ? getUser()?.id || getUser()?._id || 'account' : 'guest';
const items = () => Store.getState().Shirt.products;
let scope, timer, dirty = false, suppress = false;
let ready = Promise.resolve(), pending = Promise.resolve();

// Flush on checkout/sign-in as well as after a short quantity-edit debounce.
// Serialize snapshots: an older PUT must never arrive after a newer edit.
export async function flushCart() {
  clearTimeout(timer);
  const current = scope;
  await ready;
  const job = async () => {
    if (!dirty || current !== scope || owner() !== current) return;
    const snapshot = items();
    await put('/cart/items', { items: snapshot.map(line => ({
      productId: line.id, qty: line.qty, size: line.size || null, color: line.color || null,
    })) });
    if (scope === current && items() === snapshot) dirty = false;
  };
  pending = pending.catch(() => {}).then(job);
  await pending;
}

export function startCartSync() {
  let generation = 0, last = items();
  function pull(changed) {
    const mine = ++generation;
    scope = owner();
    clearTimeout(timer);
    if (changed) {
      // Account merge happens on the server. Never persist an old account's
      // lines into the new guest or overwrite the merged account snapshot.
      suppress = true; Store.dispatch(clearCart()); suppress = false;
    }
    dirty = !changed && items().length > 0;
    ready = get('/cart').then(cart => {
      if (mine !== generation || owner() !== scope || dirty || !cart?.items?.length) return;
      suppress = true;
      Store.dispatch(hydrateItems(cart.items.map(line => ({
        id: String(line.product), name: line.name, image: line.image, price: line.price,
        size: line.size, color: line.color, qty: line.qty,
      }))));
      suppress = false;
    }).catch(() => {});
    if (dirty) timer = setTimeout(() => flushCart().catch(() => {}), 400);
  }
  const unsubStore = Store.subscribe(() => {
    const next = items();
    if (next === last) return;
    last = next;
    if (suppress) return;
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(() => flushCart().catch(() => {}), 400);
  });
  const sessionChanged = () => { if (owner() !== scope) pull(true); };
  const unsubAuth = subscribeAuth(sessionChanged);
  window.addEventListener('storage', sessionChanged);
  pull(false);
  return () => { ++generation; clearTimeout(timer); unsubStore(); unsubAuth(); window.removeEventListener('storage', sessionChanged); };
}
