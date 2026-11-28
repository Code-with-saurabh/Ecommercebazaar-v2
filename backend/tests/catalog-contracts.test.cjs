const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startReviewFixture } = require('./helpers/reviews-fixture.cjs');

test('admin partial updates preserve merchandise and coupon terms; catalog facets include all active records', async () => {
  const f = await startReviewFixture();
  try {
    const admin = await f.createUser({ role: 'admin' });
    const send = async (path, method, body) => {
      const response = await fetch(f.baseUrl + '/api' + path, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin.token}` },
        body: JSON.stringify(body),
      });
      return { status: response.status, data: (await response.json()).data };
    };
    const product = await f.createProduct({ sizes: ['S', 'M'], colors: ['Ink'], isActive: false, isFeatured: true });
    const edit = await send(`/admin/products/${product._id}`, 'PATCH', { stock: 3 });
    assert.equal(edit.status, 200);
    assert.equal(edit.data.images[0].url, product.images[0].url);
    assert.deepEqual(edit.data.sizes, ['S', 'M']);
    assert.deepEqual(edit.data.colors, ['Ink']);
    assert.equal(edit.data.isActive, false);
    assert.equal(edit.data.isFeatured, true);
    const coupon = await send('/admin/coupons', 'POST', { code: 'TERMS', type: 'percent', value: 15, minCart: 75, perUserLimit: 2, applicableCategories: ['shirts'] });
    assert.equal(coupon.status, 201);
    const edited = await send(`/admin/coupons/${coupon.data._id}`, 'PATCH', { active: false });
    assert.equal(edited.data.minCart, 75);
    assert.equal(edited.data.perUserLimit, 2);
    assert.deepEqual(edited.data.applicableCategories, ['shirts']);
    assert.equal((await send(`/admin/coupons/${coupon.data._id}`, 'PATCH', { value: 101 })).status, 400);
    // Beyond the former two-page client cap, plus the hidden record above.
    await f.Product.collection.insertMany(Array.from({ length: 105 }, (_, i) => ({
      sku: `facet-${i}`, slug: `facet-${i}`, isActive: true, category: 'pants', brand: 'Second maker', price: 100 + i,
    })));
    const { data: facets } = await (await fetch(f.baseUrl + '/api/products/facets')).json();
    assert.equal(facets.categories.pants, 105);
    assert.equal(facets.categories.shirts, 1);
    assert.equal(facets.maxPrice, 204);
    assert.equal(facets.minPrice, 40);
  } finally { await f.stop(); }
});
