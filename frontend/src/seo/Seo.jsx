import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { SITE, absUrl, absAsset } from './site';
import { resolvePageMeta } from './pageMeta';
import {
  organizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
} from './structuredData';

function upsertMeta(attr, key, content) {
  if (content === undefined || content === null || content === '') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function applyHead(meta) {
  const url = absUrl(meta.path);
  const image = absAsset(meta.image || SITE.image);

  document.title = meta.title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'keywords', meta.keywords);
  upsertMeta('name', 'robots', meta.robots);
  upsertMeta('name', 'author', SITE.author);
  upsertLink('canonical', url);

  upsertMeta('property', 'og:site_name', SITE.name);
  upsertMeta('property', 'og:locale', SITE.locale);
  upsertMeta('property', 'og:type', meta.ogType || 'website');
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', image);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', image);
  if (SITE.twitter) upsertMeta('name', 'twitter:site', SITE.twitter);
}

function Seo() {
  const { pathname } = useLocation();
  const meta = useMemo(() => resolvePageMeta(pathname), [pathname]);

  useEffect(() => {
    applyHead(meta);
  }, [meta]);

  const jsonLd = useMemo(() => {
    const nodes = [organizationJsonLd(), websiteJsonLd()];
    if (meta.path !== '/') nodes.push(breadcrumbJsonLd(meta.path, meta.title));
    // catalog ItemList moved server-side (products live in Mongo now); the
    // per-product JSON-LD is emitted by the detail page once data lands
    return nodes;
  }, [meta]);

  return (
    <>
      {jsonLd.map((node, index) => (
        <script
          key={`${meta.path}-${node['@type']}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}

export default Seo;
