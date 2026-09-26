import React, { useEffect, useState } from 'react';
import { useLocation} from 'react-router-dom';
import { useSelector } from 'react-redux';
import Card from '../Home/Card';
import './SearchPage.css';
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
  /*
  const abc = () => {
    const params = new URLSearchParams("query=T-shirts");
    console.log(params.get('query')); // This will log "T-shirts"
};

abc(); // Calling the function will now log "T-shirts"
  */
};

const SearchPage = () => {
  const query = useQuery();
  const searchQuery = query.get('query') || "";
  const products = useSelector(state => state.AllProduct.productCategories);

  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    console.log("Search Query:", searchQuery);
    console.log("Products:", products);

    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    // Normalize the categories and find matching category
    const category = Object.keys(products).find(cat => 
      cat.toLowerCase() === normalizedSearchQuery
    );

    console.log("Category:", category);

    if (category) {
      // Filter products within the matched category
      const result = products[category].filter(product =>
        product.ProductName.toLowerCase().includes(normalizedSearchQuery)
      );
      console.log("Filtered Results:", result);
      setFilteredProducts(result);
    } else {
      // Check if the search query should match product names directly
      const allProducts = Object.values(products).flat();
      const directResults = allProducts.filter(product =>
        product.ProductName.toLowerCase().includes(normalizedSearchQuery)
      );
      console.log("Direct Results:", directResults);
      setFilteredProducts(directResults);
    }
  }, [searchQuery, products]);

  return (
    <div className="search-page">
      <div className="product-grid">
        {filteredProducts.length ? (
          filteredProducts.map(product => (
            <Card
              key={product.id}  // Ensure each card has a unique key
              id={product.id}
              BrandName={product.BrandName}
              ProductName={product.ProductName}
              Price={product.Price}
              Imgs={product.Imgs}
            />
          ))
        ) : (
		<div className="NFT_CC">
          <h1 className="NTF">No products found.</h1>
		  </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
