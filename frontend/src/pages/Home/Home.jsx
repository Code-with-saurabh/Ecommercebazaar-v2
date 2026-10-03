import './Home.css';
import Hero from './Hero.jsx';
import Card from '../../components/ProductCard/ProductCard.jsx';
import { ProductGridSkeleton } from '../../components/Skeleton/Skeleton';
import { useProducts } from '../../hooks/useProducts';

/** One API-backed row; loading/error stay local so the other row is untouched. */
function CardRow({ heading, className, params }) {
  const { items, loading, error, refetch } = useProducts(params);

  return (
    <div className={`inDiv ${className}`}>
      <h1>{heading}</h1>
      <div className="divIMG">
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <div className="NFT_CC">
            <p className="NTF">Could not load products.</p>
            <button type="button" onClick={refetch}>
              Retry
            </button>
          </div>
        ) : (
          (items || []).map(product => <Card key={product._id} product={product} />)
        )}
      </div>
    </div>
  );
}

function Home() {
  return (
    <>
      <Hero />
      {/* both rows hit /api/products; the hook cache dedupes overlapping params */}
      <CardRow heading="Recommended" className="recomneded" params={{ limit: 4, sort: 'newest' }} />
      <CardRow heading="Features" className="features" params={{ featured: 'true', limit: 5 }} />
    </>
  );
}

export default Home;
