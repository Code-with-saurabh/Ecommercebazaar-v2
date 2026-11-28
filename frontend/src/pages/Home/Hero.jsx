import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../utils/catalog';
import { formatMoney } from '../../utils/money';
import { useProducts } from '../../hooks/useProducts';
import './Hero.css';

function Plate({ category }) {
  const { items, loading, error, refetch } = useProducts({ category: category.key, inStock: 'true', sort: 'popular', limit: 1 });
  const piece = items?.[0];
  return (
    <div className="wardrobe-plate" aria-busy={loading} aria-live="polite">
      {piece ? <Link className="wardrobe-plate__link" to={`/products/${piece.slug}`}>
        <div className="wardrobe-plate__photo">{piece.thumbnail && <img src={piece.thumbnail} alt={piece.images?.find(image => image.isPrimary)?.alt || piece.name} fetchpriority="high" />}</div>
        <div className="wardrobe-plate__caption">
          <div><span className="bz-caps">{piece.brand}</span><p>{piece.name}</p></div>
          <strong>{formatMoney(piece.price)}</strong>
        </div>
      </Link> : <div className="wardrobe-plate__state">
        <p>{loading ? `Opening ${category.label.toLowerCase()}…` : error ? 'This selection could not be loaded.' : 'No pieces currently in stock.'}</p>
        {error && <button className="bz-link" type="button" onClick={refetch}>Try again</button>}
      </div>}
    </div>
  );
}

export default function Hero() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  return <section className="bz-shell wardrobe" aria-labelledby="wardrobe-title">
    <div className="wardrobe__copy">
      <p className="bz-caps">Bazaar / Surat, India</p>
      <h1 id="wardrobe-title">The everyday <br /><em>wardrobe.</em></h1>
      <p className="wardrobe__intro">Start with a shirt. Find the pair that goes with it. Explore our collection, one piece at a time.</p>
      <div className="wardrobe__index" aria-label="Preview a collection" role="group">
        {CATEGORIES.map(item => <button key={item.key} type="button" aria-pressed={category.key === item.key} onClick={() => setCategory(item)}>{item.label}</button>)}
      </div>
      <Link className="bz-btn bz-btn--primary" to={category.to}>Shop {category.label.toLowerCase()} <span aria-hidden="true">↗</span></Link>
    </div>
    <Plate key={category.key} category={category} />
  </section>;
}
