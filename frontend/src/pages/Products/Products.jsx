import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import Card from '../../components/ProductCard/ProductCard.jsx';
import { ProductGridSkeleton } from '../../components/Skeleton/Skeleton';
import { useProducts } from '../../hooks/useProducts';
import './Products.css';

// Route prop -> API category value (the literal routes /products/tshirt and
// /products/shoes pass 'T-shirts' / 'Shoes'; the sidebar writes ?category=).
const CATEGORY_ALIASES = {
  't-shirts': 'tshirts',
  tshirt: 'tshirts',
  tshirts: 'tshirts',
  shirts: 'shirts',
  shirt: 'shirts',
  pants: 'pants',
  pant: 'pants',
  shoes: 'shoes',
  shoe: 'shoes',
};

const CATEGORIES = [
  { key: 'tshirts', label: 'T-Shirts' },
  { key: 'shirts', label: 'Shirts' },
  { key: 'pants', label: 'Pants' },
  { key: 'shoes', label: 'Footwear' },
];

const SORTS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: Low to High'],
  ['price_desc', 'Price: High to Low'],
  ['rating', 'Top Rated'],
  ['popular', 'Most Popular'],
  ['name', 'Name A-Z'],
];

const PAGE_SIZE = 20;

const categoryLabel = key => (CATEGORIES.find(c => c.key === key) || {}).label;

/**
 * Facet data for the sidebar - brand/category counts and the real price
 * bounds - aggregated client-side from the full catalog (2 cached pages,
 * no extra endpoint). Null until both pages arrive.
 */
function useCatalogFacets() {
  const page1 = useProducts({ limit: 50, page: 1, sort: 'name' });
  const page2 = useProducts({ limit: 50, page: 2, sort: 'name' });

  return useMemo(() => {
    if (!page1.items || !page2.items) return null;
    const brands = new Map();
    const categories = new Map();
    let min = Infinity;
    let max = 0;
    for (const product of [...page1.items, ...page2.items]) {
      brands.set(product.brand, (brands.get(product.brand) || 0) + 1);
      categories.set(product.category, (categories.get(product.category) || 0) + 1);
      const price = Number(product.price) || 0;
      if (price < min) min = price;
      if (price > max) max = price;
    }
    return {
      brands: [...brands].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
      categories,
      minPrice: Number.isFinite(min) ? min : 0,
      maxPrice: max,
    };
  }, [page1.items, page2.items]);
}

/** Facet checkbox row: control + label + optional count. */
const Check = ({ checked, onChange, label, count }) => (
  <label className="bz-check">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="bz-check__label">{label}</span>
    {count !== undefined && <span className="bz-caps bz-check__count">{count}</span>}
  </label>
);

Check.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  count: PropTypes.number,
};

/**
 * The catalog. The URL is the single source of truth for every filter
 * (?category=&brand=&minPrice=&maxPrice=&inStock=&sale=&sort=&page=), so
 * nav links, footer brand chips and the pills bar all share one state
 * machine and every view is shareable.
 */
function Products({ category }) {
  const location = useLocation();
  const history = useHistory();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ min: '', max: '' });

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const routeKey = category ? CATEGORY_ALIASES[category.toLowerCase()] : undefined;
  // URL wins; an explicit `category=` (even empty) means the user cleared it.
  // Unknown values from hand-edited URLs fall back to the full catalog
  // instead of sending a 400 to the API.
  const urlCategory = query.has('category') ? query.get('category') || '' : routeKey || '';
  const activeCategory = CATEGORIES.some(c => c.key === urlCategory) ? urlCategory : '';

  const brand = query.get('brand') || '';
  const minPrice = query.get('minPrice') || '';
  const maxPrice = query.get('maxPrice') || '';
  const inStock = query.get('inStock') === 'true';
  const sale = query.get('sale') === 'true';
  const urlSort = query.get('sort') || 'newest';
  const sort = SORTS.some(([value]) => value === urlSort) ? urlSort : 'newest';
  const page = Math.max(1, parseInt(query.get('page') || '1', 10) || 1);

  const params = { limit: PAGE_SIZE, page, sort };
  if (activeCategory) params.category = activeCategory;
  if (brand) params.brand = brand;
  if (minPrice) params.minPrice = Number(minPrice);
  if (maxPrice) params.maxPrice = Number(maxPrice);
  if (inStock) params.inStock = 'true';
  if (sale) params.sale = 'true';

  const { items, meta, loading, error, refetch } = useProducts(params);
  const facets = useCatalogFacets();

  /**
   * One writer for every filter: applies updates, drops back to page 1,
   * materializes a route-provided category into the URL on first use, and
   * always lands on /products so later clears are not re-seeded by the prop.
   */
  const pushQuery = updates => {
    const next = new URLSearchParams(location.search);
    const keys = updates.map(([key]) => key);
    if (!query.has('category') && activeCategory && !keys.includes('category')) {
      next.set('category', activeCategory);
    }
    for (const [key, value] of updates) {
      if (value === null || value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    }
    // every filter change goes back to page 1 - unless the update IS the page
    if (!keys.includes('page')) next.delete('page');
    const search = next.toString();
    history.push({ pathname: '/products', search: search ? `?${search}` : '' });
  };

  const pickCategory = key => pushQuery([['category', activeCategory === key ? null : key]]);
  const pickBrand = value => pushQuery([['brand', brand === value ? null : value]]);
  const toggleStock = () => pushQuery([['inStock', inStock ? null : 'true']]);
  const toggleSale = () => pushQuery([['sale', sale ? null : 'true']]);
  const applyPrice = event => {
    event.preventDefault();
    pushQuery([
      ['minPrice', priceDraft.min],
      ['maxPrice', priceDraft.max],
    ]);
  };
  const clearPrice = () => {
    setPriceDraft({ min: '', max: '' });
    pushQuery([['minPrice', null], ['maxPrice', null]]);
  };
  const resetAll = () => {
    setPriceDraft({ min: '', max: '' });
    history.push('/products');
  };

  // pills mirror the active criteria (design's "Active Criteria" bar)
  const pills = [];
  if (activeCategory) pills.push({ key: 'category', label: categoryLabel(activeCategory) || activeCategory, clear: () => pushQuery([['category', null]]) });
  if (brand) pills.push({ key: 'brand', label: brand, clear: () => pushQuery([['brand', null]]) });
  if (minPrice || maxPrice) {
    pills.push({
      key: 'price',
      label: `Price: ${minPrice ? `$${minPrice}` : '$0'} – ${maxPrice ? `$${maxPrice}` : 'any'}`,
      clear: clearPrice,
    });
  }
  if (inStock) pills.push({ key: 'inStock', label: 'In Stock Only', clear: toggleStock });
  if (sale) pills.push({ key: 'sale', label: 'Archive Sale', clear: toggleSale });

  const totalPages = meta ? meta.totalPages : 1;
  const total = meta ? meta.total : items ? items.length : 0;
  const title = activeCategory ? categoryLabel(activeCategory) || activeCategory : 'All Products';

  return (
    <div className="bz-catalog">
      {/* editorial lead header */}
      <section className="bz-shell bz-catalog__lead">
        <p className="bz-caps bz-catalog__eyebrow">The Catalogue</p>
        <div className="bz-catalog__lead-row">
          <div>
            <h1 className="bz-title bz-catalog__title">{title}</h1>
            <p className="bz-catalog__sub">
              {facets
                ? `${facets.brands.length} makers, ${facets.minPrice}–${facets.maxPrice} USD, every price verified at checkout.`
                : 'Every price verified at checkout.'}
            </p>
          </div>
          <button
            type="button"
            className="bz-btn bz-btn--outline bz-catalog__filter-toggle"
            onClick={() => setFiltersOpen(open => !open)}
            aria-expanded={filtersOpen}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              tune
            </span>
            Filters {pills.length > 0 && `(${pills.length})`}
          </button>
        </div>

        {pills.length > 0 && (
          <div className="bz-pills">
            <span className="bz-caps bz-pills__label">Active criteria:</span>
            {pills.map(pill => (
              <span key={pill.key} className="bz-pill">
                {pill.label}
                <button type="button" onClick={pill.clear} aria-label={`Remove ${pill.label}`}>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    close
                  </span>
                </button>
              </span>
            ))}
            <button type="button" className="bz-pills__reset" onClick={resetAll}>
              Reset All
            </button>
          </div>
        )}
      </section>

      <div className="bz-shell bz-catalog__layout">
        {/* faceted sidebar */}
        <aside className={`bz-filters${filtersOpen ? ' is-open' : ''}`}>
          <div className="bz-filters__head">
            <h2 className="bz-filters__title">Curatorial Filter</h2>
            <span className="bz-caps bz-filters__rules">{pills.length} active</span>
          </div>

          <fieldset className="bz-facet">
            <legend className="bz-caps bz-facet__legend">Garment Category</legend>
            {CATEGORIES.map(cat => (
              <Check
                key={cat.key}
                checked={activeCategory === cat.key}
                onChange={() => pickCategory(cat.key)}
                label={cat.label}
                count={facets ? facets.categories.get(cat.key) : undefined}
              />
            ))}
          </fieldset>

          <fieldset className="bz-facet">
            <legend className="bz-caps bz-facet__legend">House &amp; Maker</legend>
            <div className="bz-facet__scroll">
              {facets ? (
                facets.brands.map(([name, count]) => (
                  <Check
                    key={name}
                    checked={brand === name}
                    onChange={() => pickBrand(name)}
                    label={name}
                    count={count}
                  />
                ))
              ) : (
                <p className="bz-facet__hint">Loading makers…</p>
              )}
            </div>
          </fieldset>

          <fieldset className="bz-facet">
            <legend className="bz-caps bz-facet__legend">Price Range</legend>
            <form className="bz-price" onSubmit={applyPrice}>
              <input
                type="number"
                min="0"
                placeholder={facets ? `${facets.minPrice}` : 'Min'}
                value={priceDraft.min}
                onChange={event => setPriceDraft(d => ({ ...d, min: event.target.value }))}
                aria-label="Minimum price"
              />
              <span aria-hidden="true">–</span>
              <input
                type="number"
                min="0"
                placeholder={facets ? `${facets.maxPrice}` : 'Max'}
                value={priceDraft.max}
                onChange={event => setPriceDraft(d => ({ ...d, max: event.target.value }))}
                aria-label="Maximum price"
              />
              <button type="submit" className="bz-btn bz-btn--quiet bz-price__apply">
                Apply
              </button>
            </form>
          </fieldset>

          <fieldset className="bz-facet">
            <legend className="bz-caps bz-facet__legend">Status</legend>
            <Check checked={inStock} onChange={toggleStock} label="In Stock Only" />
            <Check checked={sale} onChange={toggleSale} label="Archive Sale" />
          </fieldset>
        </aside>

        {/* results */}
        <div className="bz-catalog__results">
          <div className="bz-sortbar">
            <p className="bz-caps bz-sortbar__count" role="status">
              {loading ? 'Curating…' : `${total} product${total === 1 ? '' : 's'}`}
            </p>
            <label className="bz-sort">
              <span className="bz-caps">Sort</span>
              <select
                value={sort}
                onChange={event => pushQuery([['sort', event.target.value]])}
                aria-label="Sort products"
              >
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : error ? (
            <div className="bz-catalog__state">
              <p>Could not load products.</p>
              <button type="button" className="bz-btn bz-btn--outline" onClick={refetch}>
                Retry
              </button>
            </div>
          ) : !items || items.length === 0 ? (
            <div className="bz-catalog__state">
              <p>No products match these filters.</p>
              <button type="button" className="bz-btn bz-btn--outline" onClick={resetAll}>
                Reset filters
              </button>
            </div>
          ) : (
            <div className="bz-catalog__grid">
              {items.map(product => (
                <Card key={product._id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="bz-pager" aria-label="Catalog pages">
              <button
                type="button"
                className="bz-pager__btn"
                disabled={page <= 1}
                onClick={() => pushQuery([['page', page - 1]])}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_back
                </span>
                Prev
              </button>
              <span className="bz-pager__pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`bz-pager__num${n === page ? ' is-current' : ''}`}
                    aria-current={n === page ? 'page' : undefined}
                    onClick={() => n !== page && pushQuery([['page', n]])}
                  >
                    {n}
                  </button>
                ))}
              </span>
              <button
                type="button"
                className="bz-pager__btn"
                disabled={page >= totalPages}
                onClick={() => pushQuery([['page', page + 1]])}
              >
                Next
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

Products.propTypes = {
  category: PropTypes.string,
};

export default Products;
