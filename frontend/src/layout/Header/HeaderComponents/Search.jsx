import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import SearchIcon from '../../../assets/img/pngegg.png';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import { useProducts } from '../../../hooks/useProducts';
import './Search.css';

const Search = () => {
  const [input, setInput] = useState('');
  const history = useHistory();

  // Suggestions come from the API, recomputed 250ms after typing stops
  // (keeps typing responsive - INP), and only once there is something to match
  const debouncedQuery = useDebouncedValue(input.trim(), 250);
  const { items } = useProducts(
    { q: debouncedQuery, limit: 6, inStock: 'true' },
    { enabled: debouncedQuery.length >= 2 }
  );
  const suggestions = items || [];

  const goToSearch = text => {
    const value = (text || '').trim();
    if (value) history.push(`/search?query=${encodeURIComponent(value)}`);
  };

  const handleSubmit = event => {
    event.preventDefault(); // Enter submits instead of doing nothing
    goToSearch(input);
  };

  const handleSuggestion = product => {
    // straight to the product page when we know where it lives
    if (product.slug) {
      setInput(product.name || '');
      history.push(`/products/${product.slug}`);
      return;
    }
    setInput(product.name);
    goToSearch(product.name);
  };

  return (
    <div className="search">
      <form className="search-bar" role="search" onSubmit={handleSubmit}>
        <button type="submit" className="search-icon-button" aria-label="Search">
          <img src={SearchIcon} alt="" aria-hidden="true" width="16" height="16" className="search-icon" />
        </button>
        <input
          type="text"
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
          autoComplete="off"
        />
        <button type="submit">Search</button>

        {suggestions.length > 0 && (
          <ul className="search-suggestions" role="listbox" aria-label="Search suggestions">
            {suggestions.map(product => (
              <li key={product._id} role="option">
                <button
                  type="button"
                  // Keep focus in the input so blur does not hide the list
                  // before the click registers
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => handleSuggestion(product)}
                >
                  <span className="search-suggestions__name">{product.name}</span>
                  <span className="search-suggestions__brand">{product.brand}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
};

export default Search;
