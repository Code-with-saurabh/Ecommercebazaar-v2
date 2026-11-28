import { useCallback, useEffect, useState } from 'react';
import { del, patch, post, raw } from '../../api';
import { useToast } from '../../components/Toast/Toast.jsx';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { ListSkeleton } from '../../components/Skeleton/Skeleton';

/**
 * /admin?view=products - catalog CRUD.
 *
 * "Delete" is a soft delist (DELETE /admin/products/:id flips isActive) -
 * rows are referenced by past orders and wishlists, so they must outlive
 * the listing. Relist sends PATCH { isActive: true }.
 */
const PAGE_SIZE = 20;

const CATEGORIES = [
  { id: 'tshirts', label: 'T-shirts' },
  { id: 'shirts', label: 'Shirts' },
  { id: 'pants', label: 'Pants' },
  { id: 'shoes', label: 'Shoes' },
];

const EMPTY_FORM = {
  name: '',
  brand: '',
  description: '',
  price: '',
  mrp: '',
  category: 'tshirts',
  stock: '',
  sizes: '',
  colors: '',
  tags: '',
  imageUrl: '',
  isFeatured: false,
  isActive: true,
};

function splitList(value) {
  return String(value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

function primaryImage(product) {
  const images = product?.images || [];
  return images.find(image => image.isPrimary)?.url || images[0]?.url || '';
}

function toForm(product) {
  if (!product) return { ...EMPTY_FORM };
  return {
    name: product.name || '',
    brand: product.brand || '',
    description: product.description || '',
    price: String(product.price ?? ''),
    mrp: product.mrp == null ? '' : String(product.mrp),
    category: product.category || 'tshirts',
    stock: String(product.stock ?? 0),
    sizes: (product.sizes || []).join(', '),
    colors: (product.colors || []).join(', '),
    tags: (product.tags || []).join(', '),
    imageUrl: primaryImage(product),
    isFeatured: Boolean(product.isFeatured),
    isActive: product.isActive !== false,
  };
}

function AdminProducts({ bump }) {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // create = form open with a blank row; edit = form open on a product
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const envelope = await raw.get('/admin/products', {
        params: { query: debouncedQuery || undefined, category: category || undefined, status: status || undefined, page, limit: PAGE_SIZE },
      });
      setProducts(Array.isArray(envelope.data) ? envelope.data : []);
      setMeta(envelope.meta || null);
    } catch (err) {
      setProducts([]);
      setError(err.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, category, status, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- spinner flag only; list lands after await
    load();
  }, [load, bump]);

  // new filter -> back to page 1 (adjusted during render, not in an effect)
  const filterKey = `${debouncedQuery}|${category}|${status}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = product => {
    setEditing(product);
    setForm(toForm(product));
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFormError('');
  };

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async event => {
    event.preventDefault();

    const price = Number(form.price);
    const stock = parseInt(form.stock, 10);
    if (form.name.trim().length < 2) return setFormError('Name must be at least 2 characters.');
    if (!form.brand.trim()) return setFormError('Brand is required.');
    if (!form.description.trim()) return setFormError('Description is required.');
    if (!Number.isFinite(price) || price < 0) return setFormError('Price must be 0 or more.');
    if (form.mrp !== '') {
      const mrp = Number(form.mrp);
      if (!Number.isFinite(mrp) || mrp < price) return setFormError('MRP must be ≥ price.');
    }
    if (!Number.isInteger(stock) || stock < 0) return setFormError('Stock must be a whole number ≥ 0.');

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      price,
      category: form.category,
      stock,
      sizes: splitList(form.sizes),
      colors: splitList(form.colors),
      tags: splitList(form.tags),
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };
    if (form.mrp !== '') payload.mrp = Number(form.mrp);

    // images: only send when the primary URL actually changed, so an edit
    // that ignores images never wipes the product's gallery
    const originalPrimary = editing ? primaryImage(editing) : '';
    if (!editing) {
      if (form.imageUrl.trim()) payload.images = [{ url: form.imageUrl.trim(), alt: '', isPrimary: true }];
    } else if (form.imageUrl.trim() && form.imageUrl.trim() !== originalPrimary) {
      const images = [...(editing.images || [])];
      if (images.length === 0) {
        payload.images = [{ url: form.imageUrl.trim(), alt: '', isPrimary: true }];
      } else {
        const index = Math.max(0, images.findIndex(image => image.isPrimary));
        images[index] = { ...images[index], url: form.imageUrl.trim() };
        payload.images = images;
      }
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await patch(`/admin/products/${editing._id}`, payload);
        setProducts(prev => prev.map(item => (item._id === updated._id ? updated : item)));
        toast.success('Product updated');
      } else {
        const created = await post('/admin/products', payload);
        setProducts(prev => [created, ...prev]);
        toast.success('Product created');
      }
      closeForm();
    } catch (err) {
      setFormError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const delist = async product => {
    const removing = product.isActive !== false;
    if (removing && !window.confirm(`Delist "${product.name}"? It will disappear from the storefront.`)) return;
    setBusyId(product._id);
    try {
      if (removing) {
        await del(`/admin/products/${product._id}`);
        setProducts(prev => prev.map(item => (item._id === product._id ? { ...item, isActive: false } : item)));
        toast.info('Product delisted');
      } else {
        const updated = await patch(`/admin/products/${product._id}`, { isActive: true });
        setProducts(prev => prev.map(item => (item._id === updated._id ? updated : item)));
        toast.success('Product relisted');
      }
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Search name, brand or SKU…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          aria-label="Search products"
        />
        <select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map(item => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="all">Any status</option>
          <option value="active">Listed</option>
          <option value="inactive">Delisted</option>
        </select>
        <button type="button" className="admin-action admin-action--new" onClick={openCreate}>
          + New product
        </button>
      </div>

      {formOpen && (
        <form className="admin-form" onSubmit={submit} aria-label={editing ? 'Edit product' : 'New product'}>
          <div className="admin-form__row">
            <label htmlFor="pf-name">Name</label>
            <input id="pf-name" value={form.name} onChange={event => setField('name', event.target.value)} required />
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-brand">Brand</label>
            <input id="pf-brand" value={form.brand} onChange={event => setField('brand', event.target.value)} required />
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-category">Category</label>
            <select id="pf-category" value={form.category} onChange={event => setField('category', event.target.value)}>
              {CATEGORIES.map(item => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-price">Price ($)</label>
            <input
              id="pf-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={event => setField('price', event.target.value)}
              required
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-mrp">MRP ($) — optional</label>
            <input id="pf-mrp" type="number" min="0" step="0.01" value={form.mrp} onChange={event => setField('mrp', event.target.value)} />
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-stock">Stock</label>
            <input
              id="pf-stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={event => setField('stock', event.target.value)}
              required
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-sizes">Sizes (comma separated)</label>
            <input id="pf-sizes" value={form.sizes} onChange={event => setField('sizes', event.target.value)} placeholder="S, M, L" />
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-colors">Colors (comma separated)</label>
            <input id="pf-colors" value={form.colors} onChange={event => setField('colors', event.target.value)} placeholder="Black, Olive" />
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-tags">Tags (comma separated)</label>
            <input id="pf-tags" value={form.tags} onChange={event => setField('tags', event.target.value)} />
          </div>
          <div className="admin-form__row">
            <label htmlFor="pf-image">Primary image URL</label>
            <input
              id="pf-image"
              type="url"
              value={form.imageUrl}
              onChange={event => setField('imageUrl', event.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="admin-form__row admin-form__check">
            <input
              id="pf-featured"
              type="checkbox"
              checked={form.isFeatured}
              onChange={event => setField('isFeatured', event.target.checked)}
            />
            <label htmlFor="pf-featured">Featured</label>
          </div>
          <div className="admin-form__row admin-form__check">
            <input
              id="pf-active"
              type="checkbox"
              checked={form.isActive}
              onChange={event => setField('isActive', event.target.checked)}
            />
            <label htmlFor="pf-active">Listed on storefront</label>
          </div>
          <div className="admin-form__row" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="pf-description">Description</label>
            <textarea
              id="pf-description"
              value={form.description}
              onChange={event => setField('description', event.target.value)}
              required
            />
          </div>
          {formError && (
            <p className="admin-form__error" role="alert">
              {formError}
            </p>
          )}
          <div className="admin-form__actions">
            <button type="submit" className="admin-action" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
            </button>
            <button type="button" className="admin-action" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="admin-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : error ? null : products.length === 0 ? (
        <div className="bz-empty">
          <h2>No products found.</h2>
        </div>
      ) : (
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Product list">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>
                    <div className="admin-product">
                      {primaryImage(product) ? (
                        <img className="admin-thumb" src={primaryImage(product)} alt="" loading="lazy" />
                      ) : (
                        <span className="admin-thumb admin-thumb--empty" aria-hidden="true" />
                      )}
                      <span>
                        <strong>{product.name}</strong>
                        <span className="admin-table__email">{product.brand}</span>
                      </span>
                    </div>
                  </td>
                  <td>{CATEGORIES.find(item => item.id === product.category)?.label || product.category}</td>
                  <td className="admin-price">
                    ${Number(product.price).toFixed(2)}
                    {product.mrp != null && product.mrp > product.price && <s> ${Number(product.mrp).toFixed(2)}</s>}
                  </td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${product.isActive !== false ? 'active' : 'off'}`}>
                      {product.isActive !== false ? 'Listed' : 'Delisted'}
                    </span>
                    {product.isFeatured && <span className="admin-badge admin-badge--featured">Featured</span>}
                  </td>
                  <td className="admin-table__actions">
                    <button type="button" className="admin-action" onClick={() => openEdit(product)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={product.isActive !== false ? 'admin-action admin-action--danger' : 'admin-action'}
                      disabled={busyId === product._id}
                      onClick={() => delist(product)}
                    >
                      {product.isActive !== false ? 'Delist' : 'Relist'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="admin-pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>
            ← Prev
          </button>
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} products
          </span>
          <button type="button" disabled={!meta.hasNext} onClick={() => setPage(current => current + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}

export default AdminProducts;
