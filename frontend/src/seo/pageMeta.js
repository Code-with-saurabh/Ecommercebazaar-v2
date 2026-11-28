// ============================================================
// ✏️ EDIT HERE — one entry per route.
// Write your own titles (≤60 chars) and descriptions (≤160 chars):
// they are what Google shows in search results.
// `robots: 'noindex, nofollow'` = hide this page from Google.
// ============================================================
export const PAGE_META = {
  '/': {
    title: 'Bazaar | Online Shopping for Shirts, T-Shirts, Pants & Shoes',
    description:
      'Explore the everyday wardrobe at Bazaar: shirts, tees, pants and footwear from an independent store in Surat.',
    keywords: 'online shopping, shirts, t-shirts, pants, shoes, bazaar, ecommerce',
    ogType: 'website',
  },
  '/products': {
    title: 'All Products | Shirts, T-Shirts, Pants & Shoes – Bazaar',
    description:
      'Browse the full Bazaar catalog: shirts, t-shirts, pants and shoes. Filter by category and find your next favourite fit.',
    keywords: 'all products, catalog, shirts, tshirts, pants, shoes',
  },
  '/products/tshirt': {
    title: 'Buy T-Shirts Online | Premium Tees – Bazaar',
    description:
      'Explore T-shirts at Bazaar. Compare brands, prices and available sizes.',
    keywords: 'buy tshirts, t-shirt online, premium tees',
  },
  '/products/shoes': {
    title: 'Shoes & Sneakers Online | Everyday Comfort – Bazaar',
    description:
      'Discover shoes and sneakers at Bazaar. Browse available sizes, colors and prices.',
    keywords: 'shoes online, sneakers, buy shoes',
  },
  '/about': {
    title: 'About Bazaar | Our Story & Quality Promise',
    description:
      'Meet Bazaar, an independent apparel and footwear store based in Surat.',
    keywords: 'about bazaar, online store, quality clothing',
  },
  '/help': {
    title: 'Help & FAQs | Bazaar Customer Support',
    description:
      'Answers to common questions about orders, shipping, returns and payments at Bazaar.',
    keywords: 'help, faq, support, returns, shipping',
  },
  '/contact': {
    title: 'Contact Bazaar | Get in Touch',
    description:
      'Questions about an order or product? Contact Bazaar by email or phone.',
    keywords: 'contact, support, help',
  },
  '/search': {
    title: 'Search Products | Bazaar',
    description: 'Search shirts, t-shirts, pants and shoes across the Bazaar catalog.',
    keywords: 'search products',
  },
  '/cart': {
    robots: 'noindex, nofollow',
    title: 'Your Cart | Bazaar',
    description: 'Review the items in your Bazaar shopping cart.',
  },
  '/login': {
    robots: 'noindex, nofollow',
    title: 'Login | Bazaar',
    description: 'Login to your Bazaar account.',
  },
  '/signup': {
    robots: 'noindex, nofollow',
    title: 'Sign Up | Bazaar',
    description: 'Create a free Bazaar account.',
  },
  '/ByNow': {
    robots: 'noindex, nofollow',
    title: 'Buy Now | Bazaar',
    description: 'Complete your Bazaar order.',
  },
  '/error': {
    robots: 'noindex, nofollow',
    title: 'Page Not Found | Bazaar',
    description: 'This page does not exist.',
  },
};

const DEFAULT_META = {
  title: 'Page Not Found | Bazaar',
  description: 'This page does not exist.',
  robots: 'noindex, follow',
};

export function resolvePageMeta(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const found = PAGE_META[path];
  if (!found && /^\/products\/[^/]+$/.test(path)) return { path, title: 'Product details | Bazaar', description: 'View product details, options and availability.', robots: 'index, follow' };
  const privatePage = ({ '/admin': 'Store administration', '/account': 'My account', '/wishlist': 'Wishlist', '/checkout': 'Checkout' })[path] || (/^\/order\/[^/]+\/confirmed$/.test(path) && 'Order receipt');
  if (privatePage) return { path, title: `${privatePage} | Bazaar`, description: privatePage, robots: 'noindex, nofollow' };
  if (found) {
    return { ...DEFAULT_META, ...found, robots: found.robots || 'index, follow', path };
  }
  return { ...DEFAULT_META, path };
}
