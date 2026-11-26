import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRecentlyViewedStore,
  RECENTLY_VIEWED_KEY,
  RECENTLY_VIEWED_LIMIT,
} from '../src/utils/recentlyViewed.js';
import loadRecentProducts from '../src/components/RecentlyViewed/loadRecentProducts.js';

const id = number => number.toString(16).padStart(24, '0');
const saved = ids => JSON.stringify({ version: 1, ids });

function memoryStorage(initial = null) {
  const values = new Map(initial === null ? [] : [[RECENTLY_VIEWED_KEY, initial]]);
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

function storageEvents() {
  const handlers = new Set();
  return {
    addEventListener: (_type, listener) => handlers.add(listener),
    removeEventListener: (_type, listener) => handlers.delete(listener),
    send: event => handlers.forEach(listener => listener(event)),
    count: () => handlers.size,
  };
}

test('history survives reload and revisiting moves a product to the front without duplicates', () => {
  const storage = memoryStorage();
  const store = createRecentlyViewedStore({ storage });
  store.record(id(1));
  store.record(id(2));
  store.record(id(1));
  assert.deepEqual(store.getSnapshot(), [id(1), id(2)]);
  const reloaded = createRecentlyViewedStore({ storage });
  assert.deepEqual(reloaded.getSnapshot(), [id(1), id(2)]);
  assert.deepEqual(JSON.parse(storage.getItem(RECENTLY_VIEWED_KEY)), {
    version: 1, ids: [id(1), id(2)],
  });
});

test('history remains bounded and discards the oldest items', () => {
  const store = createRecentlyViewedStore({ storage: memoryStorage() });
  for (let index = 1; index <= 12; index++) store.record(id(index));
  assert.equal(store.getSnapshot().length, RECENTLY_VIEWED_LIMIT);
  assert.deepEqual(store.getSnapshot(), [12, 11, 10, 9, 8, 7, 6, 5].map(id));
});

test('invalid, duplicated, and oversized saved data are sanitized before use', () => {
  const ids = [null, {}, '../auth/logout', id(10).toUpperCase(), id(10), ...Array.from({ length: 20 }, (_, i) => id(i))];
  const store = createRecentlyViewedStore({ storage: memoryStorage(saved(ids)) });
  assert.deepEqual(store.getSnapshot(), [10, 0, 1, 2, 3, 4, 5, 6].map(id));
  for (const value of [null, {}, [], 'shoes', '../products', 'a'.repeat(25)]) store.record(value);
  assert.deepEqual(store.getSnapshot(), [10, 0, 1, 2, 3, 4, 5, 6].map(id));
});

test('corrupt or unsupported storage does not break browsing and can be replaced', () => {
  for (const raw of ['{broken', 'null', '[]', '{"version":2,"ids":[]}', '{"version":1,"ids":{}}']) {
    const storage = memoryStorage(raw);
    const store = createRecentlyViewedStore({ storage });
    assert.deepEqual(store.getSnapshot(), []);
    store.record(id(1));
    assert.deepEqual(JSON.parse(storage.getItem(RECENTLY_VIEWED_KEY)), { version: 1, ids: [id(1)] });
  }
});

test('repeated views have a stable snapshot and notify subscribers only when contents change', () => {
  const store = createRecentlyViewedStore({ storage: memoryStorage() });
  let notifications = 0;
  const unsubscribe = store.subscribe(() => { notifications++; });
  store.record(id(1));
  const snapshot = store.getSnapshot();
  store.record(id(1));
  assert.equal(store.getSnapshot(), snapshot);
  assert.equal(notifications, 1);
  assert.equal(Object.isFrozen(snapshot), true);
  unsubscribe();
  store.record(id(2));
  assert.equal(notifications, 1);
});

test('clear removes only browsing history and stays empty on reload', () => {
  const storage = memoryStorage(saved([id(1), id(2)]));
  storage.setItem('bazaar:cart', 'keep cart');
  const store = createRecentlyViewedStore({ storage });
  assert.equal(store.clear(), true);
  assert.deepEqual(store.getSnapshot(), []);
  assert.equal(storage.getItem(RECENTLY_VIEWED_KEY), null);
  assert.equal(storage.getItem('bazaar:cart'), 'keep cart');
  assert.deepEqual(createRecentlyViewedStore({ storage }).getSnapshot(), []);
});

test('blocked storage falls back to a working in-memory history', () => {
  const storage = {
    getItem() { throw new Error('Blocked'); },
    setItem() { throw new Error('Blocked'); },
    removeItem() { throw new Error('Blocked'); },
  };
  for (const unavailableStorage of [null, storage]) {
    const store = createRecentlyViewedStore({ storage: unavailableStorage });
    store.record(id(1));
    store.record(id(2));
    assert.deepEqual(store.getSnapshot(), [id(2), id(1)]);
    assert.equal(store.clear(), false);
    assert.deepEqual(store.getSnapshot(), []);
    store.record(id(3));
    assert.deepEqual(store.getSnapshot(), [id(3)]);
  }
});

test('a full storage quota still allows clearing saved history', () => {
  const storage = memoryStorage(saved([id(1)]));
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  const store = createRecentlyViewedStore({ storage });
  store.record(id(2));
  assert.deepEqual(store.getSnapshot(), [id(2), id(1)]);
  assert.equal(store.clear(), true);
  assert.equal(storage.getItem(RECENTLY_VIEWED_KEY), null);
  store.record(id(3));
  assert.deepEqual(store.getSnapshot(), [id(3)]);
});

test('failed removal clears this tab but reports that persisted data could not be removed', () => {
  const storage = memoryStorage(saved([id(1)]));
  storage.removeItem = () => { throw new Error('Blocked'); };
  const store = createRecentlyViewedStore({ storage });
  assert.equal(store.clear(), false);
  assert.deepEqual(store.getSnapshot(), []);
  assert.equal(storage.getItem(RECENTLY_VIEWED_KEY), saved([id(1)]));
});

test('cross-tab updates and clear events synchronize; unrelated storage is ignored', () => {
  const storage = memoryStorage(saved([id(1)]));
  const events = storageEvents();
  const store = createRecentlyViewedStore({ storage, events });
  const unsubscribe = store.subscribe(() => {});
  assert.equal(events.count(), 1);
  storage.setItem(RECENTLY_VIEWED_KEY, saved([id(2), id(1)]));
  events.send({ key: 'bazaar:cart', storageArea: storage });
  assert.deepEqual(store.getSnapshot(), [id(1)]);
  events.send({ key: RECENTLY_VIEWED_KEY, storageArea: memoryStorage() });
  assert.deepEqual(store.getSnapshot(), [id(1)]);
  events.send({ key: RECENTLY_VIEWED_KEY, storageArea: storage });
  assert.deepEqual(store.getSnapshot(), [id(2), id(1)]);
  storage.removeItem(RECENTLY_VIEWED_KEY);
  events.send({ key: null, storageArea: storage });
  assert.deepEqual(store.getSnapshot(), []);
  unsubscribe();
  assert.equal(events.count(), 0);
});

test('remount refreshes changes made while the shelf was unmounted', () => {
  const storage = memoryStorage(saved([id(1)]));
  const store = createRecentlyViewedStore({ storage, events: storageEvents() });
  store.subscribe(() => {})();
  storage.setItem(RECENTLY_VIEWED_KEY, saved([id(2)]));
  const unsubscribe = store.subscribe(() => {});
  assert.deepEqual(store.getSnapshot(), [id(2)]);
  unsubscribe();
});

test('record merges the latest persisted history rather than overwriting a newer tab', () => {
  const storage = memoryStorage(saved([id(1)]));
  const store = createRecentlyViewedStore({ storage });
  storage.setItem(RECENTLY_VIEWED_KEY, saved([id(2), id(1)]));
  store.record(id(3));
  assert.deepEqual(store.getSnapshot(), [id(3), id(2), id(1)]);
});

test('product loading preserves history order and uses fresh server data', async () => {
  const resolve = new Map();
  const signal = { aborted: false };
  const promise = loadRecentProducts([id(1), id(2)], (path, options) => {
    assert.equal(options.signal, signal);
    return new Promise(done => resolve.set(path, done));
  }, signal);
  resolve.get(`/products/${id(2)}`)({ _id: id(2), price: 20, inStock: false });
  resolve.get(`/products/${id(1)}`)({ _id: id(1), price: 15, inStock: true });
  const result = await promise;
  assert.deepEqual(result.products, [
    { _id: id(1), price: 15, inStock: true },
    { _id: id(2), price: 20, inStock: false },
  ]);
  assert.equal(result.failedCount, 0);
});

test('missing products are skipped but transient failures are exposed for retry', async () => {
  const result = await loadRecentProducts([id(1), id(2), id(3), id(4)], async path => {
    if (path.endsWith(id(2))) throw { status: 404 };
    if (path.endsWith(id(3))) throw { status: 0 };
    if (path.endsWith(id(4))) throw { status: 500 };
    return { _id: id(1), price: 25 };
  });
  assert.deepEqual(result.products, [{ _id: id(1), price: 25 }]);
  assert.equal(result.failedCount, 2);
});

test('an entirely removed history is distinguishable from a server outage', async () => {
  const result = await loadRecentProducts([id(1)], async () => { throw { status: 404 }; });
  assert.deepEqual(result, { products: [], failedCount: 0 });
  assert.deepEqual(await loadRecentProducts([], async () => assert.fail('No request expected')), {
    products: [], failedCount: 0,
  });
});
