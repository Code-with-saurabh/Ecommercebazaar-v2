export const RECENTLY_VIEWED_KEY = 'bazaar:recently-viewed:v1';
export const RECENTLY_VIEWED_LIMIT = 8;

const EMPTY = Object.freeze([]);
const PRODUCT_ID = /^[a-f0-9]{24}$/i;

function browserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function normalizeId(value) {
  return typeof value === 'string' && PRODUCT_ID.test(value) ? value.toLowerCase() : null;
}

function parseHistory(raw) {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !Array.isArray(value.ids)) return EMPTY;
    const ids = [];
    for (const valueId of value.ids) {
      const id = normalizeId(valueId);
      if (id && !ids.includes(id)) ids.push(id);
      if (ids.length === RECENTLY_VIEWED_LIMIT) break;
    }
    return ids;
  } catch {
    return EMPTY;
  }
}

/** A small external store: only IDs persist; prices and stock always come from the API. */
export function createRecentlyViewedStore({
  storage = browserStorage(),
  events = typeof window === 'undefined' ? null : window,
} = {}) {
  let snapshot = EMPTY;
  let canPersist = Boolean(storage);
  const listeners = new Set();

  function readStored() {
    if (!canPersist) return snapshot;
    try {
      return parseHistory(storage.getItem(RECENTLY_VIEWED_KEY));
    } catch {
      canPersist = false;
      return snapshot;
    }
  }

  function publish(ids) {
    // useSyncExternalStore needs a stable reference until the contents change.
    if (ids.length === snapshot.length && ids.every((id, index) => id === snapshot[index])) return;
    snapshot = Object.freeze([...ids]);
    listeners.forEach(listener => listener());
  }

  function persist(ids) {
    // Clearing can still succeed when a full quota prevented previous writes.
    if (!storage || (ids.length > 0 && !canPersist)) return false;
    try {
      if (ids.length) {
        storage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify({ version: 1, ids }));
      } else {
        storage.removeItem(RECENTLY_VIEWED_KEY);
      }
      return true;
    } catch {
      // Keep a working in-memory history without re-reading an older saved value.
      canPersist = false;
      return false;
    }
  }

  function onStorage(event) {
    if (event.key !== null && event.key !== RECENTLY_VIEWED_KEY) return;
    if (event.storageArea && event.storageArea !== storage) return;
    publish(readStored());
  }

  snapshot = Object.freeze([...readStored()]);

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => EMPTY,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        events?.addEventListener('storage', onStorage);
        // Another tab may have changed storage while the shelf was unmounted.
        publish(readStored());
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) events?.removeEventListener('storage', onStorage);
      };
    },
    record(productId) {
      const id = normalizeId(productId);
      if (!id) return;
      const ids = [id, ...readStored().filter(previous => previous !== id)]
        .slice(0, RECENTLY_VIEWED_LIMIT);
      persist(ids);
      publish(ids);
    },
    clear() {
      const persisted = persist(EMPTY);
      publish(EMPTY);
      return persisted;
    },
  };
}

export const recentlyViewedStore = createRecentlyViewedStore();
