import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { additems } from '../../store/slices/ForShirt.jsx';
import { useProduct, useProducts } from '../../hooks/useProducts';
import { useToast } from '../../components/Toast/Toast.jsx';
import LazyImage from '../../components/LazyImage/LazyImage.jsx';
import Card from '../../components/ProductCard/ProductCard.jsx';
import VirtualGrid from '../../components/VirtualGrid/VirtualGrid';
import { Skeleton, SkeletonText } from '../../components/Skeleton/Skeleton';
import './ProductDetail.css';

const MIN_QTY = 1;
const MAX_QTY = 10;

/** Gallery + buy box. `key={id}` on the wrapper resets all local state per product. */
function Detail({ id }) {
  const { data: product, loading, error, refetch } = useProduct(id);
  const dispatch = useDispatch();
  const toast = useToast();

  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(MIN_QTY);
  const [activeImage, setActiveImage] = useState(0);

  const alreadyInCart = useSelector(state =>
    product && state.Shirt.products.some(item => item.id === product._id)
  );

  // Related loads only after we know the category (avoids a request with an
  // empty filter that would return the whole catalog).
  const { items: relatedItems } = useProducts(
    { category: product ? product.category : '', limit: 6 },
    { enabled: Boolean(product) }
  );
  const related = (relatedItems || []).filter(item => item._id !== product?._id).slice(0, 4);

  if (loading) {
    return (
      <div className="pd" aria-busy="true">
        <div className="pd-gallery">
          <Skeleton height={380} radius={16} />
          <SkeletonText lines={2} />
        </div>
        <div className="pd-info">
          <Skeleton width="45%" height={18} />
          <Skeleton width="90%" height={30} />
          <Skeleton width="35%" height={34} />
          <SkeletonText lines={5} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    const notFound = error && error.status === 404;
    return (
      <div className="NFT_CC pd-missing">
        <h1 className="NTF">{notFound ? 'Product not found' : 'Could not load product'}</h1>
        <p>
          {notFound
            ? 'It may have been removed or the link is wrong.'
            : 'The API did not respond. Check that the backend is running.'}
        </p>
        <div className="pd-missing-actions">
          <button type="button" onClick={refetch}>
            Retry
          </button>
          <Link to="/products" className="pd-link">
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
  const selectedSize = size || (product.sizes && product.sizes[0]) || '';
  const selectedColor = color || (product.colors && product.colors[0]) || '';

  const handleAdd = () => {
    if (!product.inStock) return;
    if (alreadyInCart) {
      toast.info('This item is already in your cart');
      return;
    }
    dispatch(
      additems({
        id: product._id,
        Bname: product.brand,
        name: product.name,
        price: product.price,
        image: product.thumbnail,
      })
    );
    toast.success(`Added to cart${selectedSize ? ` (size ${selectedSize})` : ''}`);
  };

  return (
    <div className="pd">
      <nav className="pd-crumbs" aria-label="Breadcrumb">
        <Link to="/products">Products</Link>
        <span aria-hidden="true"> / </span>
        <span>{product.category}</span>
      </nav>

      <div className="pd-main">
        <div className="pd-gallery">
          <div className="pd-main-image">
            <LazyImage
              src={gallery}
              alt={product.name}
              className="pd-image"
              width="1100"
              height="1100"
            />
          </div>
          {images.length > 1 && (
            <div className="pd-thumbs" role="list">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.url}
                  role="listitem"
                  className={`pd-thumb${index === activeImage ? ' pd-thumb--active' : ''}`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={image.url} alt="" loading="lazy" width="70" height="70" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <span className="pd-brand">{product.brand}</span>
          <h1 className="pd-name">{product.name}</h1>

          <div
            className="pd-rating"
            aria-label={`Rated ${(product.rating?.avg ?? 0).toFixed(1)} out of 5`}
          >
            <span className="pd-stars" aria-hidden="true">
              {[0, 1, 2, 3, 4].map(index => (
                <span
                  key={index}
                  className={`pd-star${index < Math.round(product.rating?.avg ?? 0) ? ' pd-star--on' : ''}`}
                >
                  ★
                </span>
              ))}
            </span>
            <span className="pd-rating-text">
              {product.rating?.count
                ? `${(product.rating.avg ?? 0).toFixed(1)} (${product.rating.count} review${product.rating.count === 1 ? '' : 's'})`
                : 'No reviews yet'}
            </span>
          </div>

          <div className="pd-price">
            <span className="pd-price-now">{Number(product.price).toFixed(2)}$</span>
            {product.mrp && product.mrp > product.price ? (
              <>
                <s className="pd-price-mrp">{Number(product.mrp).toFixed(2)}$</s>
                <em className="pd-price-off">{product.discountPercent}% off</em>
              </>
            ) : null}
          </div>

          <p className={`pd-stock${product.inStock ? '' : ' pd-stock--out'}`}>
            {!product.inStock
              ? 'Out of stock'
              : product.isLowStock
                ? `Only ${product.stock} left - order soon`
                : 'In stock'}
          </p>

          {product.sizes && product.sizes.length > 0 && (
            <div className="pd-option">
              <span className="pd-option-label">Size</span>
              <div className="pd-chips" role="group" aria-label="Choose a size">
                {product.sizes.map(option => (
                  <button
                    type="button"
                    key={option}
                    className={`pd-chip${option === selectedSize ? ' pd-chip--active' : ''}`}
                    onClick={() => setSize(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="pd-option">
              <span className="pd-option-label">Color</span>
              <div className="pd-chips" role="group" aria-label="Choose a color">
                {product.colors.map(option => (
                  <button
                    type="button"
                    key={option}
                    className={`pd-chip${option === selectedColor ? ' pd-chip--active' : ''}`}
                    onClick={() => setColor(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pd-option">
            <span className="pd-option-label">Quantity</span>
            <div className="pd-qty">
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
          </div>

          <div className="pd-actions">
            <button
              type="button"
              className="pd-add"
              onClick={handleAdd}
              disabled={!product.inStock}
            >
              {!product.inStock ? 'Out of stock' : alreadyInCart ? 'In Cart' : 'Add to Cart'}
            </button>
            <Link to="/cart" className="pd-link">
              View cart
            </Link>
          </div>

          <div className="pd-description">
            <h2>Description</h2>
            <p>{product.description}</p>
            <dl className="pd-meta">
              <div>
                <dt>SKU</dt>
                <dd>{product.sku}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{product.category}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pd-related">
          <h2>You may also like</h2>
          <VirtualGrid
            className="GridStyle"
            layout="grid"
            minColumnWidth={230}
            gap={20}
            items={related}
            itemKey={item => item._id}
            renderItem={item => <Card product={item} />}
          />
        </section>
      )}
    </div>
  );
}

/** Route entry: `key` remounts Detail on navigation between products. */
function ProductDetail() {
  const { id } = useParams();
  return <Detail key={id} id={id} />;
}

export default ProductDetail;
