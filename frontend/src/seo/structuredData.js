import { SITE, absUrl, absAsset } from './site';

const CONTEXT = 'https://schema.org';

export function organizationJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: absAsset(SITE.image),
    description: SITE.tagline,
    sameAs: SITE.socials.filter(Boolean),
  };
}

export function websiteJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.tagline,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search?query={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(pathname, name) {
  const parts = pathname.split('/').filter(Boolean);
  const items = [{ name: 'Home', item: absUrl('/') }];
  let built = '';
  parts.forEach(part => {
    built += `/${part}`;
    items.push({ name: part.replace(/-/g, ' '), item: absUrl(built) });
  });
  if (items.length > 1) items[items.length - 1] = { ...items[items.length - 1], name };

  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

function productJsonLd(product) {
  const price = Number(product.Price);
  const node = {
    '@type': 'Product',
    name: product.ProductName,
    sku: String(product.id),
    brand: product.BrandName ? { '@type': 'Brand', name: product.BrandName } : undefined,
    image: absAsset(product.Imgs),
  };
  if (Number.isFinite(price) && price > 0) {
    node.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: SITE.currency,
      url: absUrl('/products'),
    };
  }
  return node;
}

const CATALOG_PATHS = { '/products/tshirt': ['tshirts'], '/products/shoes': ['shoes'] };
const ALL_CATALOG_PATHS = ['/', '/products'];

export function catalogItemListJsonLd(pathname, productCategories) {
  if (!productCategories) return null;

  let keys = CATALOG_PATHS[pathname];
  if (!keys && ALL_CATALOG_PATHS.includes(pathname)) keys = Object.keys(productCategories);
  if (!keys) return null;

  const items = keys
    .flatMap(key => (Array.isArray(productCategories[key]) ? productCategories[key] : []))
    .filter(Boolean)
    .slice(0, 60);
  if (!items.length) return null;

  return {
    '@context': CONTEXT,
    '@type': 'ItemList',
    name: `${SITE.name} product catalog`,
    numberOfItems: items.length,
    itemListElement: items.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: productJsonLd(product),
    })),
  };
}
