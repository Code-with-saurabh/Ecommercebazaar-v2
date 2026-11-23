import { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { get, post, patch, del, raw } from '../../api';
import { getUser, isLoggedIn, clearSession, updateUser } from '../../utils/session';
import { formatMoney } from '../../utils/money';
import { useToast } from '../../components/Toast/Toast.jsx';
import FormField from '../../components/FormField/FormField';
import Spinner from '../../components/Spinner/Spinner';
import { ORDER_STATUS } from '../OrderConfirmation/OrderConfirmation';
import './Account.css';

/**
 * /account - profile, order history and the address book behind one guard.
 *
 * The tab lives in ?tab= so a link like /account?tab=orders is shareable
 * and the back button walks tabs instead of leaving the page. Every write
 * goes straight to the API (PATCH /users/me, /orders/:id/cancel,
 * /addresses/*); this file never keeps a private copy of the truth.
 */

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'orders', label: 'Orders' },
  { id: 'addresses', label: 'Addresses' },
];

const ADDRESS_FIELDS = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function validateAddress(values) {
  const errors = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Full name must be at least 2 characters';
  if (!/^\d{7,15}$/.test(values.phone.trim())) errors.phone = 'Phone must be 7-15 digits';
  if (!values.line1.trim()) errors.line1 = 'Address line 1 is required';
  if (!values.city.trim()) errors.city = 'City is required';
  if (!values.state.trim()) errors.state = 'State is required';
  if (!/^\d{4,10}$/.test(values.pincode.trim())) errors.pincode = 'Pincode must be 4-10 digits';
  return errors;
}

/* ------------------------------------------------------------------ profile */

function ProfileTab({ onLoggedOut }) {
  const toast = useToast();
  const history = useHistory();
  const stored = getUser() || {};
  const [profile, setProfile] = useState({
    name: stored.name || '',
    email: stored.email || '',
    phone: stored.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const onProfileField = e => {
    const { id, value } = e.target;
    setProfile(prev => ({ ...prev, [id]: value }));
  };

  const saveProfile = async e => {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const updated = await patch('/users/me', {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      });
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      if (err.fieldErrors) toast.error(Object.values(err.fieldErrors).join(' '));
      else toast.error(err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async e => {
    e.preventDefault();
    if (savingPw) return;
    const errors = {};
    if (!pw.currentPassword) errors.currentPassword = 'Enter your current password';
    if (pw.newPassword.length < 8) errors.newPassword = 'New password must be at least 8 characters';
    if (pw.confirm !== pw.newPassword) errors.confirm = 'Passwords do not match';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPw(true);
    try {
      await post('/users/me/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      // server bumped tokenVersion: every session is dead, including ours
      clearSession();
      toast.success('Password changed - please sign in again');
      onLoggedOut();
      history.push('/login');
    } catch (err) {
      if (err.status === 401) setPwErrors({ currentPassword: err.message });
      else if (err.fieldErrors) setPwErrors(err.fieldErrors);
      else toast.error(err.message || 'Could not change password');
    } finally {
      setSavingPw(false);
    }
  };

  const logout = async () => {
    clearSession();
    post('/auth/logout').catch(() => {});
    toast.info('Logged out');
    onLoggedOut();
    history.push('/login');
  };

  return (
    <div className="acc-sections">
      <section className="acc-card" aria-labelledby="acc-profile">
        <h2 id="acc-profile">Profile</h2>
        <p className="acc-muted">
          Signed in as <strong>{stored.username}</strong>
          {stored.role === 'admin' ? <span className="acc-role">admin</span> : null}
        </p>
        <form className="acc-form" onSubmit={saveProfile}>
          <FormField
            id="name"
            label="Full name"
            value={profile.name}
            onChange={onProfileField}
            autoComplete="name"
            maxLength={80}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={profile.email}
            onChange={onProfileField}
            autoComplete="email"
            maxLength={254}
            required
          />
          <FormField
            id="phone"
            label="Phone"
            type="tel"
            value={profile.phone}
            onChange={onProfileField}
            autoComplete="tel"
            maxLength={20}
            required
          />
          <button type="submit" className="acc-btn acc-btn--primary" disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="acc-card" aria-labelledby="acc-password">
        <h2 id="acc-password">Change password</h2>
        <form className="acc-form" onSubmit={savePassword}>
          <FormField
            id="currentPassword"
            label="Current password"
            type="password"
            reveal
            value={pw.currentPassword}
            onChange={e => setPw(prev => ({ ...prev, currentPassword: e.target.value }))}
            error={pwErrors.currentPassword}
            autoComplete="current-password"
            required
          />
          <FormField
            id="newPassword"
            label="New password"
            type="password"
            reveal
            value={pw.newPassword}
            onChange={e => setPw(prev => ({ ...prev, newPassword: e.target.value }))}
            error={pwErrors.newPassword}
            autoComplete="new-password"
            required
          />
          <FormField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            reveal
            value={pw.confirm}
            onChange={e => setPw(prev => ({ ...prev, confirm: e.target.value }))}
            error={pwErrors.confirm}
            autoComplete="new-password"
            required
          />
          <button type="submit" className="acc-btn" disabled={savingPw}>
            {savingPw ? 'Updating…' : 'Change password'}
          </button>
          <p className="acc-fineprint">Changing your password signs you out on every device.</p>
        </form>
      </section>

      <section className="acc-card acc-card--danger" aria-labelledby="acc-session">
        <h2 id="acc-session">Session</h2>
        <p className="acc-muted">End this session on this device.</p>
        <button type="button" className="acc-btn acc-btn--danger" onClick={logout}>
          Log out
        </button>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------- orders */

function OrdersTab() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async targetPage => {
    setLoading(true);
    setError('');
    try {
      const res = await raw.get('/orders/me', { params: { page: targetPage, limit: 10 } });
      setOrders((res.data && res.data.data) || []);
      setMeta((res.data && res.data.meta) || null);
    } catch (err) {
      setError(err.message || 'Could not load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- spinner flag only; data lands after await
    load(page);
  }, [load, page]);

  const cancel = async order => {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return;
    setBusyId(order._id);
    try {
      const updated = await post(`/orders/${order._id}/cancel`);
      setOrders(prev => prev.map(item => (item._id === order._id ? updated : item)));
      toast.info('Order cancelled');
    } catch (err) {
      toast.error(err.message || 'Could not cancel the order');
    } finally {
      setBusyId(null);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="acc-loading" aria-busy="true">
        <Spinner label="Loading orders…" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="acc-error" role="alert">
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="acc-empty">
        <h2>No orders yet</h2>
        <p>When you place an order it shows up here with live tracking.</p>
        <Link to="/products" className="acc-btn acc-btn--primary">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="acc-orders">
        {orders.map(order => {
          const status = ORDER_STATUS[order.status] || { label: order.status };
          const itemCount = (order.items || []).reduce((sum, item) => sum + item.qty, 0);
          const canCancel = order.status === 'placed' && order.payment?.status !== 'paid';
          return (
            <li key={order._id} className="acc-order">
              <div className="acc-order-top">
                <div>
                  <Link to={`/order/${order._id}/confirmed`} className="acc-order-number">
                    {order.orderNumber}
                  </Link>
                  <span className="acc-muted">{formatDate(order.createdAt)}</span>
                </div>
                <span className={`status-pill status-pill--${order.status}`}>{status.label}</span>
              </div>
              <div className="acc-order-mid">
                <span>
                  {itemCount} item{itemCount === 1 ? '' : 's'} · {formatMoney(order.total)}
                </span>
                <span className="acc-muted">
                  {(order.items || [])
                    .slice(0, 2)
                    .map(item => item.name)
                    .join(', ')}
                  {(order.items || []).length > 2 ? '…' : ''}
                </span>
              </div>
              <div className="acc-order-actions">
                <Link to={`/order/${order._id}/confirmed`} className="acc-btn acc-btn--small">
                  View details
                </Link>
                {canCancel && (
                  <button
                    type="button"
                    className="acc-btn acc-btn--small acc-btn--danger"
                    onClick={() => cancel(order)}
                    disabled={busyId === order._id}
                  >
                    {busyId === order._id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {meta && meta.totalPages > 1 && (
        <nav className="acc-pagination" aria-label="Order pages">
          <button type="button" className="acc-btn acc-btn--small" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ? Previous
          </button>
          <span>
            Page {page} of {meta.totalPages}
          </span>
          <button
            type="button"
            className="acc-btn acc-btn--small"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next ?
          </button>
        </nav>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- addresses */

function AddressesTab() {
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(ADDRESS_FIELDS);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await get('/addresses');
      setAddresses(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err.message || 'Could not load addresses');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- spinner flag only; list arrives after await
    load();
  }, [load]);

  const onField = e => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
    setErrors(prev => (prev[id] ? { ...prev, [id]: '' } : prev));
  };

  const save = async e => {
    e.preventDefault();
    const found = validateAddress(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const created = await post('/addresses', form);
      setAddresses(prev => [...prev, created]);
      setForm(ADDRESS_FIELDS);
      setShowForm(false);
      toast.success('Address saved');
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      else toast.error(err.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async id => {
    setBusyId(id);
    try {
      await post(`/addresses/${id}/default`);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
      toast.success('Default address updated');
    } catch (err) {
      toast.error(err.message || 'Could not set default');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async address => {
    if (!window.confirm('Delete this address?')) return;
    setBusyId(address._id);
    try {
      await del(`/addresses/${address._id}`);
      setAddresses(prev => prev.filter(a => a._id !== address._id));
      toast.info('Address removed');
    } catch (err) {
      toast.error(err.message || 'Could not remove address');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="acc-loading" aria-busy="true">
        <Spinner label="Loading addresses…" />
      </div>
    );
  }

  return (
    <div>
      {addresses.length > 0 && (
        <ul className="acc-addresses">
          {addresses.map(address => (
            <li key={address._id} className={`acc-address${address.isDefault ? ' is-default' : ''}`}>
              <div className="acc-address-body">
                <strong>
                  {address.fullName}
                  {address.isDefault ? <span className="acc-role">Default</span> : null}
                </strong>
                <span>{[address.line1, address.line2].filter(Boolean).join(', ')}</span>
                <span>
                  {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                </span>
                <span>{address.phone}</span>
              </div>
              <div className="acc-address-actions">
                {!address.isDefault && (
                  <button
                    type="button"
                    className="acc-btn acc-btn--small"
                    onClick={() => makeDefault(address._id)}
                    disabled={busyId === address._id}
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  className="acc-btn acc-btn--small acc-btn--danger"
                  onClick={() => remove(address)}
                  disabled={busyId === address._id}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {addresses.length === 0 && !showForm && (
        <div className="acc-empty">
          <h2>No addresses yet</h2>
          <p>Save one and checkout becomes a two-click affair.</p>
        </div>
      )}

      <button type="button" className="acc-btn acc-btn--primary acc-add" onClick={() => setShowForm(v => !v)}>
        {showForm ? 'Cancel' : '+ Add address'}
      </button>

      {showForm && (
        <form className="acc-form acc-address-form" onSubmit={save} noValidate>
          <div className="acc-row">
            <FormField
              id="fullName"
              label="Full name"
              value={form.fullName}
              onChange={onField}
              error={errors.fullName}
              autoComplete="name"
              maxLength={80}
              required
            />
            <FormField
              id="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={onField}
              error={errors.phone}
              autoComplete="tel"
              maxLength={20}
              required
            />
          </div>
          <FormField
            id="line1"
            label="Address line 1"
            value={form.line1}
            onChange={onField}
            error={errors.line1}
            autoComplete="address-line1"
            maxLength={120}
            required
          />
          <FormField
            id="line2"
            label="Address line 2 (optional)"
            value={form.line2}
            onChange={onField}
            error={errors.line2}
            autoComplete="address-line2"
            maxLength={120}
          />
          <div className="acc-row acc-row--3">
            <FormField
              id="city"
              label="City"
              value={form.city}
              onChange={onField}
              error={errors.city}
              autoComplete="address-level2"
              maxLength={60}
              required
            />
            <FormField
              id="state"
              label="State"
              value={form.state}
              onChange={onField}
              error={errors.state}
              autoComplete="address-level1"
              maxLength={60}
              required
            />
            <FormField
              id="pincode"
              label="Pincode"
              inputMode="numeric"
              value={form.pincode}
              onChange={onField}
              error={errors.pincode}
              autoComplete="postal-code"
              maxLength={10}
              required
            />
          </div>
          <button type="submit" className="acc-btn acc-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save address'}
          </button>
        </form>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- page */

function Account() {
  const history = useHistory();
  const location = useLocation();
  const [bump, setBump] = useState(0); // re-mounts children after logout

  const allowed = isLoggedIn();
  useEffect(() => {
    if (!allowed) history.replace('/login', { from: '/account' });
  }, [allowed, history]);

  const queryTab = new URLSearchParams(location.search).get('tab');
  const tab = TABS.some(t => t.id === queryTab) ? queryTab : 'profile';

  const setTab = id => {
    history.replace(`/account?tab=${id}`);
  };

  if (!allowed) return null;

  return (
    <div className="account-page">
      <header className="acc-head">
        <h1>My Account</h1>
      </header>

      <div className="acc-layout">
        <nav className="acc-tabs" aria-label="Account sections">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              className={`acc-tab${tab === item.id ? ' is-active' : ''}`}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="acc-panel" key={`${tab}-${bump}`}>
          {tab === 'profile' && <ProfileTab onLoggedOut={() => setBump(v => v + 1)} />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'addresses' && <AddressesTab />}
        </div>
      </div>
    </div>
  );
}

export default Account;
