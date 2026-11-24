import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import { useProducts } from '../../../hooks/useProducts';
import './Search.css';

/** Header search: debounced live suggestions, Enter submits to /search. */
const Search = () => {
  const [input, setInput] = useState('');
  const history = useHistory();

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
    event.preventDefault();
    goToSearch(input);
  };

  const handleSuggestion = product => {
    if (product.slug) {
      setInput(product.name || '');
      history.push(`/products/${product.slug}`);
      return;
    }
    setInput(product.name);
    goToSearch(product.name);
  };

  return (
    <form className="bz-search" role="search" onSubmit={handleSubmit}>
      <span className="material-symbols-outlined bz-search__icon" aria-hidden="true">
        search
      </span>
      <input
        type="search"
        value={input}
        onChange={event => setInput(event.target.value)}
        placeholder="Search editorial archive..."
        aria-label="Search products"
        autoComplete="off"
      />

      {suggestions.length > 0 && (
        <ul className="bz-search__suggestions" role="listbox" aria-label="Search suggestions">
          {suggestions.map(product => (
            <li key={product._id} role="option">
              <button
                type="button"
                // keep focus on the input so blur can't hide the list
                // before the click registers
                onMouseDown={event => event.preventDefault()}
                onClick={() => handleSuggestion(product)}
              >
                <span className="bz-search__s-name">{product.name}</span>
                <span className="bz-search__s-brand">{product.brand}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default Search;
