export const CATEGORIES = [
  { key: 'shirts', label: 'Shirts', to: '/products?category=shirts' },
  { key: 'tshirts', label: 'T-shirts', to: '/products/tshirt' },
  { key: 'pants', label: 'Pants', to: '/products?category=pants' },
  { key: 'shoes', label: 'Footwear', to: '/products/shoes' },
];

export const hasOptions = product => Boolean(product?.sizes?.length || product?.colors?.length);
