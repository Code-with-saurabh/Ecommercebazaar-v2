import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SearchIcon from '../../../assets/img/pngegg.png';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import { searchProducts } from '../../../utils/search';
import './Search.css';

const Search = () => {
  const [input, setInput] = useState('');
  const history = useHistory();
  const productCategories = useSelector(state => state.AllProduct.productCategories);

  // Suggestions are recomputed 250ms after typing stops, not on every
  // keystroke (keeps typing responsive - INP)
  const debouncedQuery = useDebouncedValue(input.trim(), 250);

  // Ranked: name matches, brand matches, category matches (shared helper)
  const suggestions = useMemo(
    () => searchProducts(debouncedQuery, productCategories, { limit: 6 }),
    [debouncedQuery, productCategories]
  );

  const goToSearch = text => {
    const value = (text || '').trim();
    if (value) history.push(`/search?query=${encodeURIComponent(value)}`);
  };

  const handleSubmit = event => {
    event.preventDefault(); // Enter now submits (it used to do nothing)
    goToSearch(input);
  };

  const handleSuggestion = product => {
    setInput(product.ProductName);
    goToSearch(product.ProductName);
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
              <li key={product.id} role="option">
                <button
                  type="button"
                  // Keep focus in the input so blur does not hide the list
                  // before the click registers
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => handleSuggestion(product)}
                >
                  <span className="search-suggestions__name">{product.ProductName}</span>
                  <span className="search-suggestions__brand">{product.BrandName}</span>
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
