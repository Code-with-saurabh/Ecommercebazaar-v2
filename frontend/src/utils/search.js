/**
 * Search helpers for the legacy catalog shape:
 *   productCategories: { tshirts: [{ id, BrandName, ProductName, Price, Imgs }], ... }
 *
 * Goal: querying "shoes" returns the shoes category, "nike" finds the brand,
 * and product names are matched too - instead of the old
 * category-match AND name-match rule that often returned nothing.
 */

export const normalize = value => String(value ?? '').trim().toLowerCase();

const categoryName = key => normalize(key).replace(/s$/, ''); // tshirts -> tshirt

/** Exact / partial category match, tolerant of singular vs plural. */
export function findCategoryKey(query, productCategories = {}) {
  const q = normalize(query);
  if (!q) return null;

  return (
    Object.keys(productCategories).find(key => {
      const plain = normalize(key);
      const singular = categoryName(key);
      return plain === q || singular === q || plain.startsWith(q) || q.startsWith(plain);
    }) || null
  );
}

/** 0 = no match, higher = better. */
export function scoreProduct(product, query) {
  const q = normalize(query);
  if (!q) return 0;

  const name = normalize(product.ProductName);
  const brand = normalize(product.BrandName);

  let score = 0;

  if (name.startsWith(q)) score += 5;
  else if (name.includes(q)) score += 3;

  if (brand === q) score += 5;
  else if (brand.startsWith(q)) score += 4;
  else if (brand.includes(q)) score += 2;

  if (normalize(product.category).includes(q)) score += 1;

  return score;
}

/**
 * Ranked results for a query.
 * Returns [{ ...product, category, score }] sorted best-first.
 */
export function searchProducts(query, productCategories = {}, { limit = 40 } = {}) {
  const q = normalize(query);
  if (!q) return [];

  const results = [];
  const seen = new Set();

  const categoryKey = findCategoryKey(q, productCategories);

  for (const [category, products] of Object.entries(productCategories)) {
    const isCategoryHit = categoryKey === category;

    for (const product of products || []) {
      const score = scoreProduct(product, q);
      const total = score + (isCategoryHit ? 2 : 0);
      if (total <= 0) continue;
      if (seen.has(product.id)) continue;

      seen.add(product.id);
      results.push({ ...product, category, score: total });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Unique brands across the catalog - for autocomplete/datalist. */
export function collectBrands(productCategories = {}) {
  const brands = new Set();
  for (const products of Object.values(productCategories)) {
    for (const product of products || []) {
      const brand = String(product.BrandName || '').trim();
      if (brand) brands.add(brand);
    }
  }
  return [...brands].sort((a, b) => a.localeCompare(b));
}

/** Unique category keys - for the navbar/datalist. */
export function collectCategories(productCategories = {}) {
  return Object.keys(productCategories);
}
