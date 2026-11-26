/** Keep browsing order even when requests finish out of order or a product disappears. */
export default async function loadRecentProducts(ids, fetchProduct, signal) {
  const results = await Promise.all(ids.map(async id => {
    try {
      const product = await fetchProduct(`/products/${encodeURIComponent(id)}`, { signal });
      return { product };
    } catch (error) {
      // A removed/disabled product is unavailable; a network failure is retryable.
      return { failed: error?.status !== 404 };
    }
  }));

  return {
    products: results.filter(result => result.product).map(result => result.product),
    failedCount: results.filter(result => result.failed).length,
  };
}
