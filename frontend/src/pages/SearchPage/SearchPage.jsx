import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Card from '../Home/Card';
import VirtualGrid from '../../components/VirtualGrid/VirtualGrid';
import { searchProducts } from '../../utils/search';
import './SearchPage.css';

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchPage = () => {
  const query = useQuery();
  const searchQuery = (query.get('query') || '').trim();
  const productCategories = useSelector(state => state.AllProduct.productCategories);

  // Ranked results: category matches, product names and brands - the old
  // code filtered a matched category by product NAME and always got nothing.
  const filteredProducts = useMemo(
    () => searchProducts(searchQuery, productCategories, { limit: 200 }),
    [searchQuery, productCategories]
  );

  return (
    <div className="search-page">
      <p className="search-count" role="status">
        {searchQuery
          ? `${filteredProducts.length} result(s) for “${searchQuery}”`
          : 'Type something to search products.'}
      </p>

      <VirtualGrid
        className="product-grid"
        layout="flex"
        items={filteredProducts}
        itemKey={product => product.id}
        renderItem={product => (
          <Card
            id={product.id}
            BrandName={product.BrandName}
            ProductName={product.ProductName}
            Price={product.Price}
            Imgs={product.Imgs}
          />
        )}
        empty={
          <div className="NFT_CC">
            <h1 className="NTF">No products found.</h1>
          </div>
        }
      />
    </div>
  );
};

export default SearchPage;
