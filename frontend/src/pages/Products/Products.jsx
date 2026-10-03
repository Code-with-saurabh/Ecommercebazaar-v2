// src/pages/Products/Products.jsx

import PropTypes from 'prop-types';
import Card from '../../components/ProductCard/ProductCard.jsx';
import VirtualGrid from '../../components/VirtualGrid/VirtualGrid';
import { ProductGridSkeleton } from '../../components/Skeleton/Skeleton';
import { useProducts } from '../../hooks/useProducts';
import './Products.css';

// Route prop -> API category value.
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

const ALL_CATEGORIES = ['tshirts', 'shirts', 'pants', 'shoes'];

function labelFor(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * One fetch per section. The hook lives here (not in a loop in `Products`)
 * so the number of requests stays legal with the rules of hooks: /products
 * renders four of these, a category route renders one.
 */
function CategorySection({ categoryKey }) {
  const { items, loading, error, refetch } = useProducts({
    category: categoryKey,
    limit: 50,
    sort: 'newest',
  });

  return (
    <section className={`for-${categoryKey} forH`}>
      <h1>{labelFor(categoryKey)}</h1>
      <hr />
      <div className={`${categoryKey} Hadding`}>
        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : error ? (
          <div className="NFT_CC">
            <h1 className="NTF">Could not load products.</h1>
            <button type="button" onClick={refetch}>
              Retry
            </button>
          </div>
        ) : (
          <VirtualGrid
            className="GridStyle"
            layout="grid"
            minColumnWidth={250}
            gap={20}
            items={items || []}
            itemKey={product => product._id}
            renderItem={product => <Card product={product} />}
            empty={
              <div className="NFT_CC">
                <h1 className="NTF">No products in this category.</h1>
              </div>
            }
          />
        )}
      </div>
    </section>
  );
}

CategorySection.propTypes = {
  categoryKey: PropTypes.string.isRequired,
};

function Products({ category }) {
  // When a route passes a category, only that section renders; otherwise the
  // full catalog splits into its four buckets (matches the legacy layout).
  let keys = ALL_CATEGORIES;
  if (category) {
    const key = CATEGORY_ALIASES[category.toLowerCase()] || category.toLowerCase();
    keys = ALL_CATEGORIES.includes(key) ? [key] : [];
  }

  if (keys.length === 0) {
    return (
      <div className="NFT_CC">
        <h1 className="NTF">No products in this category.</h1>
      </div>
    );
  }

  return <>{keys.map(key => <CategorySection key={key} categoryKey={key} />)}</>;
}

Products.propTypes = {
  category: PropTypes.string,
};

export default Products;
