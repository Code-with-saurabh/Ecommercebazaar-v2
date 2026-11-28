import { useCallback, useEffect, useState } from 'react';
import { patch, raw } from '../../api';
import { useToast } from '../../components/Toast/Toast.jsx';
import { ListSkeleton } from '../../components/Skeleton/Skeleton';

/**
 * /admin?view=orders - order queue.
 *
 * The status buttons come from each order's `nextStatuses` virtual (the
 * Order model's ORDER_TRANSITIONS), so the UI can only offer moves the
 * state machine allows; the API answers 409 for anything else anyway.
 * Cancelling restocks inventory server-side.
 */
const PAGE_SIZE = 20;

const STATUS_LABELS = {
  placed: 'Placed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const NEXT_LABELS = {
  packed: 'Mark packed',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function money(value) {
  return typeof value === 'number' ? `$${value.toFixed(2)}` : '—';
}

function AdminOrders({ bump }) {
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const envelope = await raw.get('/admin/orders', {
        params: { status: status || undefined, page, limit: PAGE_SIZE },
      });
      setOrders(Array.isArray(envelope.data) ? envelope.data : []);
      setMeta(envelope.meta || null);
    } catch (err) {
      setOrders([]);
      setError(err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- spinner flag only; list lands after await
    load();
  }, [load, bump]);

  // new filter -> back to page 1 (adjusted during render, not in an effect)
  const filterKey = String(status);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const advance = async (order, next) => {
    if (next === 'cancelled' && !window.confirm(`Cancel ${order.orderNumber}? Inventory will be restocked.`)) {
      return;
    }
    setBusyId(order._id);
    try {
      const updated = await patch(`/admin/orders/${order._id}/status`, { status: next });
      setOrders(prev => prev.map(item => (item._id === updated._id ? { ...item, ...updated } : item)));
      toast.success(`Order ${order.orderNumber} marked ${STATUS_LABELS[next].toLowerCase()}`);
    } catch (err) {
      // 409 = illegal transition; the message explains why
      toast.error(err.message || 'Status update failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

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
      ) : error ? null : orders.length === 0 ? (
        <div className="bz-empty">
          <h2>No orders found.</h2>
        </div>
      ) : (
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Order queue">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.qty || 0), 0) : 0;
                const isOpen = openId === order._id;
                return (
                  <OrderRow
                    key={order._id}
                    order={order}
                    itemCount={itemCount}
                    isOpen={isOpen}
                    busy={busyId === order._id}
                    onToggle={() => setOpenId(isOpen ? null : order._id)}
                    onAdvance={advance}
                  />
                );
              })}
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
            Page {meta.page} of {meta.totalPages} · {meta.total} orders
          </span>
          <button type="button" disabled={!meta.hasNext} onClick={() => setPage(current => current + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}

function OrderRow({ order, itemCount, isOpen, busy, onToggle, onAdvance }) {
  const next = Array.isArray(order.nextStatuses) ? order.nextStatuses : [];

  return (
    <>
      <tr>
        <td>
          <strong>{order.orderNumber}</strong>
          <span className="admin-table__email">{formatDate(order.createdAt)}</span>
        </td>
        <td>
          {order.user ? (
            <>
              <strong>{order.user.username}</strong>
              <span className="admin-table__email">{order.user.email}</span>
            </>
          ) : (
            <span className="admin-muted">Guest</span>
          )}
        </td>
        <td>
          <button type="button" className="admin-action" onClick={onToggle} aria-expanded={isOpen}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} {isOpen ? '▾' : '▸'}
          </button>
        </td>
        <td>
          {money(order.total)}
          <span className="admin-table__email">{order.payment?.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
        </td>
        <td>
          <span className={`admin-badge admin-badge--status-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
        </td>
        <td className="admin-table__actions">
          {next.length === 0 ? (
            <span className="admin-muted">No moves</span>
          ) : (
            next.map(target => (
              <button
                key={target}
                type="button"
                className={target === 'cancelled' ? 'admin-action admin-action--danger' : 'admin-action'}
                disabled={busy}
                onClick={() => onAdvance(order, target)}
              >
                {NEXT_LABELS[target] || target}
              </button>
            ))
          )}
        </td>
      </tr>
      {isOpen && (
        <tr className="admin-detail">
          <td colSpan={6}>
            <ul className="admin-detail-list">
              {(order.items || []).map((item, index) => (
                <li key={`${item.sku || item.name}-${index}`}>
                  <strong>{item.brand ? `${item.brand} · ` : ''}{item.name}</strong>
                  {item.size ? ` · size ${item.size}` : ''}
                  {item.color ? ` · ${item.color}` : ''} — {item.qty} × {money(item.price)}
                </li>
              ))}
            </ul>
            {order.shippingAddress && (
              <p className="admin-muted">
                Ship to: {order.shippingAddress.fullName}, {order.shippingAddress.line1}, {order.shippingAddress.city}{' '}
                {order.shippingAddress.pincode}
              </p>
            )}
            {order.coupon?.code && <p className="admin-muted">Coupon: {order.coupon.code}</p>}
          </td>
        </tr>
      )}
    </>
  );
}

export default AdminOrders;
