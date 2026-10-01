// src/pages/Products/Products.jsx

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../../components/ProductCard/ProductCard.jsx';
import { useSelector } from 'react-redux';
import VirtualGrid from '../../components/VirtualGrid/VirtualGrid';
import './Products.css';

// Route prop -> productCategories key. /products/tshirt passes "T-shirts".
const CATEGORY_ALIASES = {
  't-shirts': 'tshirts',
  tshirt: 'tshirts',
  tshirts: 'tshirts',
  shirts: 'shirts',
  shirt: 'shirts',
  pants: 'pants',
  pant: 'pants',
  shoes: 'shoes',
  shoe: 'shoes',
};

function Products({ category }) {
  const productCategories = useSelector(state => state.AllProduct.productCategories);

  // When a route passes a category, only that section renders (these routes
  // used to be dead: the prop was ignored and every category showed).
  const sections = useMemo(() => {
    if (!category) return Object.entries(productCategories);
    const key = CATEGORY_ALIASES[category.toLowerCase()] || category.toLowerCase();
    const products = productCategories[key];
    return products ? [[key, products]] : [];
  }, [category, productCategories]);

  return (
    <>
      {sections.map(([categoryKey, products]) => (
        <section key={categoryKey} className={`for-${categoryKey} forH`}>
          <h1>{categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}</h1>
          <hr />
          <div className={`${categoryKey} Hadding`}>
            <VirtualGrid
              className="GridStyle"
              layout="grid"
              minColumnWidth={250}
              gap={20}
              items={products}
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
              empty={<div className="NFT_CC"><h1 className="NTF">No products in this category.</h1></div>}
            />
          </div>
        </section>
      ))}
      {sections.length === 0 && (
        <div className="NFT_CC">
          <h1 className="NTF">No products in this category.</h1>
        </div>
      )}
    </>
  );
}

Products.propTypes = {
  category: PropTypes.string,
};

export default Products;
