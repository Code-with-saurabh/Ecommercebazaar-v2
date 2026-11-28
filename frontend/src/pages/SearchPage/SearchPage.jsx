import { Link, useLocation } from 'react-router-dom';
import Card from '../../components/ProductCard/ProductCard';
import VirtualGrid from '../../components/VirtualGrid/VirtualGrid';
import { ProductGridSkeleton } from '../../components/Skeleton/Skeleton';
import { useProducts } from '../../hooks/useProducts';
import './SearchPage.css';

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchPage = () => {
  const query = useQuery();
  const searchQuery = (query.get('query') || '').trim();
  const page = Math.max(1, parseInt(query.get('page'), 10) || 1);
  const pageUrl = number => `/search?query=${encodeURIComponent(searchQuery)}&page=${number}`;

  // Server-side search now: the API escapes the regex and ranks by the text
  // index / filters, so the client no longer reimplements matching rules.
  const { items, meta, loading, error, refetch } = useProducts(
    { q: searchQuery, limit: 20, page },
    { enabled: searchQuery.length > 0 }
  );

  const results = items || [];
  const total = meta?.total ?? results.length;
  let summary = `${total} product${total === 1 ? '' : 's'} found`;
  if (!searchQuery) summary = 'Type something to search products.';
  else if (loading) summary = 'Searching…';
  else if (error) summary = 'Could not load search results.';

  return (
    <div className="bz-shell bz-page">
      <header className="bz-lead">
        <p className="bz-caps">Catalog search</p>
        <h1>{searchQuery ? `Results for “${searchQuery}”` : 'Search the collection'}</h1>
        <p role="status">{summary}</p>
      </header>

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : error ? (
        <div className="bz-empty">
          <button type="button" className="bz-btn bz-btn--outline" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : (
        <VirtualGrid
          className="search-grid"
          minColumnWidth={230}
          gap={20}
          items={results}
          itemKey={product => product._id}
          renderItem={product => <Card product={product} />}
          empty={
            <div className="bz-empty">
              {searchQuery && <h2>No products found.</h2>}
              <Link to="/products" className="bz-link">Browse all products</Link>
            </div>
          }
        />
      )}
      {!loading && !error && meta?.totalPages > 1 && <nav className="search-pages" aria-label="Search result pages">
        {page > 1 && <Link className="bz-link" to={pageUrl(page - 1)}>Previous</Link>}
        <span>Page {page} of {meta.totalPages}</span>
        {page < meta.totalPages && <Link className="bz-link" to={pageUrl(page + 1)}>Next</Link>}
      </nav>}
    </div>
  );
};

export default SearchPage;
