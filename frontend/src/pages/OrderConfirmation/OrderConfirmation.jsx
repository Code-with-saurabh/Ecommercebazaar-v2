 import { useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { get, post } from '../../api';
import { isLoggedIn } from '../../utils/session';
import { formatMoney } from '../../utils/money';
import { useToast } from '../../components/Toast/Toast.jsx';
import Spinner from '../../components/Spinner/Spinner';
import LazyImage from '../../components/LazyImage/LazyImage.jsx';
import './OrderConfirmation.css';

/** Status -> display copy (single source for both this page and Account). */
export const ORDER_STATUS = {
  placed: { label: 'Order placed', hint: 'We have received your order' },
  packed: { label: 'Packed', hint: 'Your items are being packed' },
  shipped: { label: 'Shipped', hint: 'On its way to you' },
  delivered: { label: 'Delivered', hint: 'Handed over - enjoy!' },
  cancelled: { label: 'Cancelled', hint: 'This order was cancelled' },
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

/**
 * /order/:id/confirmed - the receipt after POST /api/orders.
 * Own orders only (the API 404s other people's ids); a 401 bounces to login.
 */
function OrderConfirmation() {
  const { id } = useParams();
  const history = useHistory();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      history.replace('/login', { from: `/order/${id}/confirmed` });
      return undefined;
    }
    let cancelled = false;
    get(`/orders/${id}`)
      .then(data => {
        if (!cancelled) setOrder(data);
      })
      .catch(err => {
        if (cancelled) return;
        if (err.status === 401) history.replace('/login', { from: `/order/${id}/confirmed` });
        else setError(err.message || 'Order not found');
      });
    return () => {
      cancelled = true;
    };
  }, [id, history]);

  const cancelOrder = async () => {
    if (cancelling || !order) return;
    // window.confirm: a destructive action deserves a deliberate yes/no,
    // and it works without JS-focus tricks on mobile
    if (!window.confirm('Cancel this order? Items go back to stock.')) return;
    setCancelling(true);
    try {
      const updated = await post(`/orders/${order._id}/cancel`);
      setOrder(updated);
      toast.info('Order cancelled');
    } catch (err) {
      toast.error(err.message || 'Could not cancel the order');
    } finally {
      setCancelling(false);
    }
  };

  if (error) {
    return (
      <div className="order-page">
        <div className="order-state">
          <h1>{error}</h1>
          <Link to="/account?tab=orders" className="btn-primary">
            View my orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-page order-loading" aria-busy="true">
        <Spinner label="Loading order…" />
      </div>
    );
  }

  const status = ORDER_STATUS[order.status] || { label: order.status, hint: '' };
  const canCancel = order.status === 'placed' && !(order.payment && order.payment.status === 'paid');

  return (
    <div className="order-page">
      <section className="order-hero" aria-labelledby="order-title">
        <div className={`order-badge order-badge--${order.status}`} aria-hidden="true">
          {order.status === 'cancelled' ? '✕' : '✓'}
        </div>
        <h1 id="order-title">
          {order.status === 'cancelled' ? 'Order cancelled' : 'Thank you! Your order is in'}
        </h1>
        <p className="order-number">
          Order <strong>{order.orderNumber}</strong>
        </p>
        <p className="order-status-line">
          <span className={`status-pill status-pill--${order.status}`}>{status.label}</span>
          <span className="order-hint">{status.hint}</span>
        </p>
        <p className="order-date">Placed {formatDate(order.createdAt)}</p>
      </section>

      <div className="order-cols">
        <section className="order-card" aria-labelledby="order-items">
          <h2 id="order-items">Items</h2>
          <ul className="order-items">
            {order.items.map((item, index) => (
              <li key={`${item.sku || item.name}-${index}`}>
                <LazyImage
                  src={item.image}
                  alt=""
                  className="order-item-img"
                  wrapperClassName="lazy-image--square"
                  width={64}
                  height={64}
                />
                <div className="order-item-body">
                  <strong>{item.name}</strong>
                  <span>
                    {item.brand} · Qty {item.qty}
                    {item.size ? ` · Size ${item.size}` : ''}
                  </span>
                </div>
                <span className="order-item-price">{formatMoney(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="order-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="order-save">
                <dt>Discount{order.coupon ? ` (${order.coupon.code})` : ''}</dt>
                <dd>−{formatMoney(order.discount)}</dd>
              </div>
            )}
            <div>
              <dt>Shipping</dt>
              <dd>{order.shipping === 0 ? 'Free' : formatMoney(order.shipping)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{formatMoney(order.tax)}</dd>
            </div>
            <div className="order-grand">
              <dt>Total</dt>
              <dd>{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="order-card" aria-labelledby="order-delivery">
          <h2 id="order-delivery">Delivery</h2>
          <address className="order-address">
            <strong>{order.shippingAddress.fullName}</strong>
            <span>{order.shippingAddress.line1}</span>
            {order.shippingAddress.line2 ? <span>{order.shippingAddress.line2}</span> : null}
            <span>
              {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode]
                .filter(Boolean)
                .join(', ')}
            </span>
            <span>{order.shippingAddress.phone}</span>
          </address>

          <h2 className="order-subhead">Payment</h2>
          <p className="order-payment">
            {order.payment && order.payment.method === 'cod' ? 'Cash on Delivery' : order.payment?.method}
            <span className={`status-pill status-pill--${order.payment?.status === 'paid' ? 'delivered' : 'placed'}`}>
              {order.payment?.status === 'paid' ? 'Paid' : 'Due on delivery'}
            </span>
          </p>

          {order.customerNote ? (
            <>
              <h2 className="order-subhead">Note</h2>
              <p className="order-note">{order.customerNote}</p>
            </>
          ) : null}

          {canCancel && (
            <button type="button" className="order-cancel" onClick={cancelOrder} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </section>
      </div>

      <div className="order-actions">
        <Link to="/account?tab=orders" className="btn-secondary">
          View my orders
        </Link>
        <Link to="/products" className="btn-primary">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmation;
