import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import SearchIcon from '../../../assets/img/pngegg.png';
import './Search.css';

const Search = () => {
  const [input, setInput] = useState("");
  const history = useHistory();

  const handleSearch = () => {
    if (input.trim()) {
      history.push(`/search?query=${encodeURIComponent(input.trim())}`);
    }
  };

  return (
    <div className="search">
      <div className="search-bar">
        <img
          src={SearchIcon}
          alt="Search"
          className="search-icon"
          onClick={handleSearch}
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search products..."
          list="products"
        />
		{/*or ist badhana hai as per the my store prodiycts name*/}
			{/*<datalist id="products">
          <option value="T-shirts" />
          <option value="Pants" />
          <option value="Shirts" />
          <option value="Shoes" />
			</datalist>*/}
        <button onClick={handleSearch}>Search</button>
      </div>
    </div>
  );
};

export default Search;
