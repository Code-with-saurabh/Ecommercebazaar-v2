import { useLocation } from 'react-router-dom';
import Card from '../../components/ProductCard/ProductCard';
import VirtualGrid from '../../components/VirtualGrid/VirtualGrid';
import { ProductGridSkeleton } from '../../components/Skeleton/Skeleton';
import { useProducts } from '../../hooks/useProducts';
import './SearchPage.css';

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchPage = () => {
  const query = useQuery();
  const searchQuery = (query.get('query') || '').trim();

  // Server-side search now: the API escapes the regex and ranks by the text
  // index / filters, so the client no longer reimplements matching rules.
  const { items, loading, error, refetch } = useProducts(
    { q: searchQuery, limit: 50 },
    { enabled: searchQuery.length > 0 }
  );

  const results = items || [];

  return (
    <div className="search-page">
      <p className="search-count" role="status">
        {!searchQuery
          ? 'Type something to search products.'
          : loading
            ? 'Searching\u2026'
            : `${results.length} result(s) for \u201c${searchQuery}\u201d`}
      </p>

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : error ? (
        <div className="NFT_CC">
          <h1 className="NTF">Search failed.</h1>
          <button type="button" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : (
        <VirtualGrid
          className="product-grid"
          layout="flex"
          items={results}
          itemKey={product => product._id}
          renderItem={product => <Card product={product} />}
          empty={
            <div className="NFT_CC">
              <h1 className="NTF">No products found.</h1>
            </div>
          }
        />
      )}
    </div>
  );
};

export default SearchPage;
