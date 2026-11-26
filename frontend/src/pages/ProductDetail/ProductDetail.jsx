import { useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { additems } from '../../store/slices/ForShirt.jsx';
import { useProduct, useProducts } from '../../hooks/useProducts';
import { post } from '../../api';
import { isLoggedIn } from '../../utils/session';
import { formatMoney } from '../../utils/money';
import { useToast } from '../../components/Toast/Toast.jsx';
import LazyImage from '../../components/LazyImage/LazyImage.jsx';
import Card from '../../components/ProductCard/ProductCard.jsx';
import VirtualGrid from '../../components/VirtualGrid/VirtualGrid';
import { Skeleton, SkeletonText } from '../../components/Skeleton/Skeleton';
import RecentlyViewed from '../../components/RecentlyViewed/RecentlyViewed';
import ProductReviews from '../../components/ProductReviews/ProductReviews';
import './ProductDetail.css';

const MIN_QTY = 1;
const MAX_QTY = 10;

const CATEGORY_LABEL = {
  tshirts: 'T-Shirts',
  shirts: 'Shirts',
  pants: 'Pants',
  shoes: 'Shoes',
};

const categoryLabel = value =>
  (value && CATEGORY_LABEL[value]) ||
  (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

const Stars = ({ avg = 0, count = 0 }) => (
  <span className="bz-pdp__rating" aria-label={`Rated ${avg.toFixed(1)} out of 5`}>
    <span className="bz-pdp__stars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(index => (
        <span
          key={index}
          className={`material-symbols-outlined${index < Math.round(avg) ? ' is-on' : ''}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </span>
    <span className="bz-pdp__rating-text">
      {count ? `${avg.toFixed(1)} · ${count} review${count === 1 ? '' : 's'}` : 'No reviews yet'}
    </span>
  </span>
);

/** Gallery + sticky buy rail. `key={id}` on the wrapper resets all local state per product. */
function Detail({ id }) {
  const { data: product, loading, error, refetch } = useProduct(id);
  const dispatch = useDispatch();
  const history = useHistory();
  const toast = useToast();

  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(MIN_QTY);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [reviewRating, setReviewRating] = useState(null);

  const selectedSize = size || product?.sizes?.[0] || '';
  const selectedColor = color || product?.colors?.[0] || '';
  const alreadyInCart = useSelector(state => product && state.Shirt.products.some(item =>
    item.id === product._id && (item.size || '') === selectedSize && (item.color || '') === selectedColor
  ));

  // Related loads only after we know the category (avoids a request with an
  // empty filter that would return the whole catalog).
  const { items: relatedItems } = useProducts(
    { category: product ? product.category : '', limit: 6 },
    { enabled: Boolean(product) }
  );
  const related = (relatedItems || []).filter(item => item._id !== product?._id).slice(0, 4);

  if (loading) {
    return (
      <div className="bz-pdp" aria-busy="true">
        <div className="bz-pdp__bar">
          <div className="bz-shell bz-pdp__bar-inner">
            <Skeleton width="240px" height={13} radius={4} />
          </div>
        </div>
        <div className="bz-shell bz-pdp__spread">
          <div className="bz-pdp__stage">
            <Skeleton height={560} radius={2} />
            <div className="bz-pdp__thumbs">
              {[0, 1, 2, 3].map(index => (
                <Skeleton key={index} height={null} radius={2} />
              ))}
            </div>
            <div className="bz-pdp__dossier">
              <Skeleton width="40%" height={22} radius={4} />
              <SkeletonText lines={3} />
            </div>
          </div>
          <div className="bz-pdp__rail">
            <Skeleton width="35%" height={12} radius={4} />
            <Skeleton width="92%" height={34} radius={4} />
            <Skeleton width="60%" height={16} radius={4} />
            <Skeleton height={92} radius={2} />
            <Skeleton width="50%" height={14} radius={4} />
            <Skeleton height={48} radius={2} />
            <Skeleton height={48} radius={2} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    const notFound = error && error.status === 404;
    return (
      <div className="bz-pdp__missing">
        <p className="bz-caps">Catalogue</p>
        <h1>{notFound ? 'Product not found' : 'Could not load product'}</h1>
        <p>
          {notFound
            ? 'It may have been removed or the link is wrong.'
            : 'The API did not respond. Check that the backend is running.'}
        </p>
        <div className="bz-pdp__missing-actions">
          <button type="button" className="bz-btn bz-btn--primary" onClick={refetch}>
            Retry
          </button>
          <Link to="/products" className="bz-btn bz-btn--outline">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length ? product.images : [];
  const currentImage = images[activeImage] || null;
  const gallery = currentImage ? currentImage.url : product.thumbnail;
  const maxQty = Math.min(MAX_QTY, Math.max(product.stock || 1, 1));
  const avg = reviewRating?.avg ?? product.rating?.avg ?? 0;
  const count = reviewRating?.count ?? product.rating?.count ?? 0;
  const category = categoryLabel(product.category);

  const handleAdd = () => {
    if (!product.inStock) return;
    // slice bumps qty when the line already exists
    dispatch(
      additems({
        id: product._id,
        Bname: product.brand,
        name: product.name,
        price: product.price,
        image: product.thumbnail,
        size: selectedSize,
        color: selectedColor,
        qty,
      })
    );
    const suffix = selectedSize ? ` (size ${selectedSize})` : '';
    if (alreadyInCart) {
      toast.success(`Quantity updated in cart${suffix}`);
    } else {
      toast.success(`Added to cart${suffix}`);
    }
  };

  const handleSave = async () => {
    if (!isLoggedIn()) {
      toast.info('Sign in to save items');
      history.push('/login', { from: `/products/${id}` });
      return;
    }
    try {
      await post('/wishlist', { productId: product._id });
      setSaved(true);
      toast.success('Saved to wishlist');
    } catch (err) {
      toast.error(err.message || 'Could not save to wishlist');
    }
  };

  return (
    <div className="bz-pdp">
      <div className="bz-pdp__bar">
        <div className="bz-shell bz-pdp__bar-inner">
          <nav className="bz-pdp__crumbs" aria-label="Breadcrumb">
            <Link to="/products">Products</Link>
            <span className="bz-pdp__sep" aria-hidden="true">
              /
            </span>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{category}</Link>
            <span className="bz-pdp__sep" aria-hidden="true">
              /
            </span>
            <span className="bz-pdp__current">{product.name}</span>
          </nav>
          <div className="bz-pdp__assurance">
            <span>Free shipping over $100</span>
            <span aria-hidden="true">·</span>
            <span>Cash on delivery</span>
          </div>
        </div>
      </div>

      <div className="bz-shell bz-pdp__spread">
        <section className="bz-pdp__stage">
          <figure className="bz-pdp__frame">
            <div className="bz-pdp__badges">
              {product.discountPercent > 0 && (
                <span className="bz-badge bz-badge--sale">Save {product.discountPercent}%</span>
              )}
              {!product.inStock && <span className="bz-pdp__badge-oos">Out of stock</span>}
            </div>
            <LazyImage
              src={gallery}
              alt={product.name}
              className="bz-pdp__figure-img"
              wrapperClassName="bz-pdp__figure"
              width="1100"
              height="1375"
              eager
            />
            {images.length > 1 && (
              <figcaption className="bz-pdp__plate">
                Plate {String(activeImage + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
              </figcaption>
            )}
          </figure>

          {images.length > 1 && (
            <div className="bz-pdp__thumbs" role="group" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.url}
                  className={`bz-pdp__thumb${index === activeImage ? ' is-active' : ''}`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-current={index === activeImage}
                >
                  <img src={image.url} alt="" loading="lazy" width="120" height="120" />
                  <span className="bz-caps" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="bz-pdp__dossier">
            <div className="bz-pdp__dossier-head">
              <div>
                <p className="bz-caps bz-pdp__eyebrow">Atelier dossier</p>
                <h2 className="bz-pdp__dossier-title">{product.name}</h2>
              </div>
              <span className="bz-pdp__dossier-sku bz-caps">SKU {product.sku}</span>
            </div>
            <div className="bz-pdp__desc">
              <p>{product.description}</p>
            </div>
            <dl className="bz-pdp__meta">
              <div>
                <dt>Brand</dt>
                <dd>{product.brand}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{category}</dd>
              </div>
            </dl>
          </div>
        </section>

        <aside className="bz-pdp__rail">
          <div className="bz-pdp__brandrow">
            <span className="bz-caps">{product.brand}</span>
            <span className="bz-caps bz-pdp__cat">{category}</span>
          </div>

          <h1 className="bz-pdp__name">{product.name}</h1>

          <Stars avg={avg} count={count} />

          <div className="bz-pdp__price">
            <div className="bz-pdp__price-row">
              <span className="bz-pdp__now">{formatMoney(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <>
                  <s className="bz-pdp__mrp">{formatMoney(product.mrp)}</s>
                  <span className="bz-badge bz-badge--save">
                    Save {product.discountPercent}%
                  </span>
                </>
              )}
            </div>
            <p className="bz-pdp__verify">
              <span className="material-symbols-outlined" aria-hidden="true">
                lock
              </span>
              Totals are re-priced and verified server-side at checkout.
            </p>
          </div>

          <p
            className={`bz-pdp__stock${
              !product.inStock ? ' is-out' : product.isLowStock ? ' is-low' : ''
            }`}
          >
            {!product.inStock
              ? 'Out of stock'
              : product.isLowStock
                ? `Only ${product.stock} left — order soon`
                : `In stock · ${product.stock} available`}
          </p>

          {product.sizes && product.sizes.length > 0 && (
            <div className="bz-pdp__option">
              <div className="bz-pdp__option-head">
                <span className="bz-pdp__option-label">Size</span>
                <span className="bz-pdp__option-value">{selectedSize}</span>
              </div>
              <div className="bz-pdp__sizes" role="group" aria-label="Choose a size">
                {product.sizes.map(option => (
                  <button
                    type="button"
                    key={option}
                    className={`bz-pdp__size${option === selectedSize ? ' is-active' : ''}`}
                    onClick={() => setSize(option)}
                    aria-pressed={option === selectedSize}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="bz-pdp__option">
              <div className="bz-pdp__option-head">
                <span className="bz-pdp__option-label">Color</span>
                <span className="bz-pdp__option-value">{selectedColor}</span>
              </div>
              <div className="bz-pdp__colors" role="group" aria-label="Choose a color">
                {product.colors.map(option => (
                  <button
                    type="button"
                    key={option}
                    className={`bz-chip${option === selectedColor ? ' is-active' : ''}`}
                    onClick={() => setColor(option)}
                    aria-pressed={option === selectedColor}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bz-pdp__option">
            <div className="bz-pdp__option-head">
              <span className="bz-pdp__option-label">Quantity</span>
              {product.inStock && <span className="bz-pdp__option-value">Add up to {maxQty}</span>}
            </div>
            <div className="bz-pdp__buy">
              <div className="bz-pdp__qty">
                <button
                  type="button"
                  onClick={() => setQty(value => Math.max(MIN_QTY, value - 1))}
                  disabled={qty <= MIN_QTY}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  min={MIN_QTY}
                  max={maxQty}
                  value={qty}
                  onChange={event => {
                    const parsed = parseInt(event.target.value, 10);
                    if (!Number.isNaN(parsed)) setQty(Math.min(maxQty, Math.max(MIN_QTY, parsed)));
                  }}
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  onClick={() => setQty(value => Math.min(maxQty, value + 1))}
                  disabled={qty >= maxQty}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="bz-pdp__add"
                onClick={handleAdd}
                disabled={!product.inStock}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  shopping_bag
                </span>
                {!product.inStock
                  ? 'Out of stock'
                  : `Add to Bag — ${formatMoney(product.price * qty)}`}
              </button>
            </div>
          </div>

          <div className="bz-pdp__secondary">
            <button
              type="button"
              className={`bz-pdp__save${saved ? ' is-saved' : ''}`}
              onClick={handleSave}
              aria-pressed={saved}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                favorite
              </span>
              {saved ? 'Saved to Wishlist' : 'Save to Wishlist'}
            </button>
            <Link to="/cart" className="bz-pdp__bag">
              <span className="material-symbols-outlined" aria-hidden="true">
                shopping_cart
              </span>
              View Bag
            </Link>
          </div>

          <div className="bz-pdp__trust">
            <div className="bz-pdp__trust-item">
              <span className="material-symbols-outlined" aria-hidden="true">
                local_shipping
              </span>
              <div>
                <strong>Free shipping</strong>
                <span>Over $100 · $10 flat below</span>
              </div>
            </div>
            <div className="bz-pdp__trust-item">
              <span className="material-symbols-outlined" aria-hidden="true">
                payments
              </span>
              <div>
                <strong>Cash on delivery</strong>
                <span>Pay when it arrives</span>
              </div>
            </div>
            <div className="bz-pdp__trust-item">
              <span className="material-symbols-outlined" aria-hidden="true">
                price_check
              </span>
              <div>
                <strong>Server-priced</strong>
                <span>Recomputed at checkout</span>
              </div>
            </div>
            <div className="bz-pdp__trust-item">
              <span className="material-symbols-outlined" aria-hidden="true">
                verified
              </span>
              <div>
                <strong>Coupons verified</strong>
                <span>Validated server-side</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bz-pdp__related">
          <div className="bz-shell">
            <div className="bz-pdp__related-head">
              <div>
                <p className="bz-caps bz-pdp__eyebrow">More {category}</p>
                <h2 className="bz-pdp__related-title">You may also like</h2>
              </div>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="bz-link">
                View all {category}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
            <VirtualGrid
              className="bz-pdp__related-grid"
              layout="grid"
              minColumnWidth={230}
              gap={24}
              items={related}
              itemKey={item => item._id}
              renderItem={item => <Card product={item} />}
            />
          </div>
        </section>
      )}
      <ProductReviews productId={product._id} onRatingChange={setReviewRating} />
      <RecentlyViewed currentProductId={product._id} />
    </div>
  );
}

/** Route entry: `key` remounts Detail on navigation between products. */
function ProductDetail() {
  const { id } = useParams();
  return <Detail key={id} id={id} />;
}

export default ProductDetail;
