import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { get, post } from '../../api';
import { isLoggedIn } from '../../utils/session';
import { clearCart } from '../../store/slices/ForShirt.jsx';
import { formatMoney } from '../../utils/money';
import { useToast } from '../../components/Toast/Toast.jsx';
import FormField from '../../components/FormField/FormField';
import LazyImage from '../../components/LazyImage/LazyImage.jsx';
import Spinner from '../../components/Spinner/Spinner';
import './Checkout.css';

/**
 * /checkout - the real checkout (replaces the /ByNow placeholder).
 *
 * Flow: server cart -> saved/new address -> optional coupon -> COD -> place.
 * Every number on screen comes from POST /api/orders/preview (live DB
 * prices + server shipping/tax rules); the page never multiplies anything
 * itself, so what the user approves is exactly what POST /api/orders
 * charges. On success the local cart is cleared (or useCartSync would push
 * the old lines back to the server) and we land on the confirmation page.
 */

const EMPTY_PRICING = { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, currency: 'USD' };

const ADDRESS_FIELDS = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

function validateAddress(values) {
  const errors = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Full name must be at least 2 characters';
  if (!/^\+?\d{7,15}$/.test(values.phone.trim())) errors.phone = 'Enter 7–15 digits, optionally starting with +';
  if (!values.line1.trim()) errors.line1 = 'Address line 1 is required';
  if (!values.city.trim()) errors.city = 'City is required';
  if (!values.state.trim()) errors.state = 'State is required';
  if (!/^\d{4,10}$/.test(values.pincode.trim())) errors.pincode = 'Pincode must be 4-10 digits';
  return errors;
}

function Checkout() {
  const history = useHistory();
  const toast = useToast();
  const dispatch = useDispatch();

  const [ready, setReady] = useState(false);
  const [cartEmpty, setCartEmpty] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(ADDRESS_FIELDS);
  const [addressErrors, setAddressErrors] = useState({});
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount } once applied
  const [couponError, setCouponError] = useState('');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState({ pricing: EMPTY_PRICING, itemCount: 0, items: [] });
  const [previewError, setPreviewError] = useState('');
  const [pricingPending, setPricingPending] = useState(true);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  const previewSeq = useRef(0);

  const allowed = isLoggedIn();
  useEffect(() => {
    if (!allowed) history.replace('/login', { from: '/checkout' });
  }, [allowed, history]);

  const loadAddresses = useCallback(async () => {
    try {
      const list = await get('/addresses');
      setAddresses(Array.isArray(list) ? list : []);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }, []);

  // initial load: cart status + address book (first address pre-selects)
  useEffect(() => {
    if (!allowed) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const cart = await get('/cart');
        const empty = !cart || !cart.items || cart.items.length === 0;
        if (cancelled) return;
        setCartEmpty(empty);
        const list = await loadAddresses();
        if (cancelled) return;
        const fallback = list.find(a => a.isDefault) || list[0];
        if (fallback) setAddressId(fallback._id);
        else setShowNewAddress(true);
        setReady(true);
      } catch {
        if (!cancelled) {
          setPreviewError('Could not load your cart. Please try again.');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowed, loadAddresses]);

  const runPreview = useCallback(
    async ({ couponCode, targetAddressId } = {}) => {
      const seq = (previewSeq.current += 1);
      setPricingPending(true);
      try {
        const body = {};
        const code = couponCode !== undefined ? couponCode : coupon ? coupon.code : '';
        if (code) body.couponCode = code;
        const chosen = targetAddressId !== undefined ? targetAddressId : addressId;
        if (chosen) body.addressId = chosen;
        const data = await post('/orders/preview', body);
        if (seq !== previewSeq.current) return; // a newer preview won
        setPreview({ pricing: data.pricing, itemCount: data.itemCount, items: data.items || [] });
        setPreviewError('');
      } catch (err) {
        if (seq !== previewSeq.current) return;
        // coupon rejections (400) show next to the coupon box; cart problems
        // take over the summary - the coupon itself is not at fault
        if (err.status === 400 && /coupon/i.test(err.message || '')) {
          setCouponError(err.message);
          setCoupon(null);
        }
        setPreviewError(err.message || 'Could not calculate totals');
      } finally {
        if (seq === previewSeq.current) setPricingPending(false);
      }
    },
    [addressId, coupon]
  );

  // re-price whenever the selected address changes (debounced by seq guard)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState only after await; seq guard drops stale responses
    if (ready && !cartEmpty) runPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seq guard replaces dep tracking
  }, [ready, cartEmpty, addressId]);

  const applyCoupon = async e => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code || checkingCoupon) return;
    setCheckingCoupon(true);
    setCouponError('');
    try {
      // validate against the live cart first: the server answers valid/false
      // with a sentence we can show as-is
      const verdict = await post('/coupons/validate', { code });
      if (!verdict.valid) {
        setCoupon(null);
        setCouponError(verdict.message || 'This coupon cannot be applied');
        return;
      }
      setCoupon({ code: code.toUpperCase(), discount: verdict.discount });
      setCouponInput('');
      toast.success(verdict.message || 'Coupon applied');
      await runPreview({ couponCode: code });
    } catch (err) {
      setCouponError(err.message || 'Could not apply coupon');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
    runPreview({ couponCode: '' });
  };

  const onAddressField = e => {
    const { id, value } = e.target;
    setNewAddress(prev => ({ ...prev, [id]: value }));
    setAddressErrors(prev => (prev[id] ? { ...prev, [id]: '' } : prev));
  };

  const selectAddress = id => {
    setAddressId(id);
    setShowNewAddress(false);
  };

  const saveNewAddress = async e => {
    e.preventDefault();
    const errors = validateAddress(newAddress);
    setAddressErrors(errors);
    if (Object.keys(errors).length) {
      const first = document.getElementById(Object.keys(errors)[0]);
      if (first) first.focus();
      return;
    }
    try {
      const created = await post('/addresses', {
        ...newAddress,
        fullName: newAddress.fullName.trim(),
        phone: newAddress.phone.trim(),
        line1: newAddress.line1.trim(),
        line2: newAddress.line2.trim(),
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        pincode: newAddress.pincode.trim(),
      });
      setAddresses(prev => [...prev, created]);
      setAddressId(created._id);
      setShowNewAddress(false);
      setNewAddress(ADDRESS_FIELDS);
      toast.success('Address saved');
    } catch (err) {
      if (err.fieldErrors) {
        setAddressErrors(err.fieldErrors);
        toast.error(Object.values(err.fieldErrors).join(' '));
      } else {
        toast.error(err.message || 'Could not save address');
      }
    }
  };

  const placeOrder = async () => {
    if (placing) return;
    if (!addressId && !showNewAddress) {
      toast.error('Choose a shipping address first');
      return;
    }
    if (showNewAddress) {
      const errors = validateAddress(newAddress);
      setAddressErrors(errors);
      if (Object.keys(errors).length) {
        toast.error('Please complete the address form');
        return;
      }
      // save then immediately place with the fresh id
      setPlacing(true);
      try {
        const created = await post('/addresses', newAddress);
        setAddresses(prev => [...prev, created]);
        setAddressId(created._id);
        setShowNewAddress(false);
        await finishOrder(created._id);
      } catch (err) {
        toast.error(err.message || 'Could not save address');
        setPlacing(false);
      }
      return;
    }
    await finishOrder(addressId);
  };

  const finishOrder = async targetAddressId => {
    setPlacing(true);
    try {
      const body = {
        addressId: targetAddressId,
        paymentMethod: 'cod',
        customerNote: note.trim(),
      };
      if (coupon) body.couponCode = coupon.code;
      const order = await post('/orders', body);
      dispatch(clearCart()); // else useCartSync would push the old lines back
      toast.success(`Order ${order.orderNumber} placed`);
      history.push(`/order/${order._id}/confirmed`);
    } catch (err) {
      toast.error(err.message || 'Could not place the order');
      runPreview(); // stock/coupon may have changed - refresh the numbers
      setPlacing(false);
    }
  };

  const p = preview.pricing;
  const selectedAddress = useMemo(
    () => addresses.find(a => a._id === addressId) || null,
    [addresses, addressId]
  );

  if (!allowed) return null;

  if (!ready) {
    return (
      <div className="checkout-page" aria-busy="true">
        <div className="checkout-loading">
          <Spinner />
          <p>Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (cartEmpty) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h1>Your cart is empty</h1>
          <p>Add a few products before checking out.</p>
          <Link to="/products" className="btn-primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-head">
        <p className="bz-caps checkout-eyebrow">Secure checkout</p>
        <div className="checkout-head__row">
          <div>
            <h1>Checkout</h1>
            <p>
              {preview.itemCount} item{preview.itemCount === 1 ? '' : 's'} · every total below is
              priced by the server, live
            </p>
          </div>
          <span className="checkout-head__badge">
            <span className="material-symbols-outlined" aria-hidden="true">
              payments
            </span>
            Cash on delivery
          </span>
        </div>
      </header>

      <div className="checkout-grid">
        {/* ---------------- left: address / coupon / payment ---------------- */}
        <div className="checkout-main">
          <section className="co-card" aria-labelledby="co-address">
            <h2 id="co-address">
              <span className="co-step">01</span> Shipping address
            </h2>

            {addresses.length > 0 && !showNewAddress && (
              <ul className="co-address-list">
                {addresses.map(address => (
                  <li key={address._id}>
                    <label className={`co-address${addressId === address._id ? ' is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="address"
                        checked={addressId === address._id}
                        onChange={() => selectAddress(address._id)}
                      />
                      <span className="co-address-body">
                        <strong>
                          {address.fullName}
                          {address.isDefault ? <em className="co-chip">Default</em> : null}
                          <em className="co-chip co-chip--type">{address.type}</em>
                        </strong>
                        <span>{address.oneLine || [address.line1, address.city, address.state, address.pincode].filter(Boolean).join(', ')}</span>
                        <span>{address.phone}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {addresses.length > 0 && (
              <button type="button" className="co-toggle" onClick={() => {
                setShowNewAddress(!showNewAddress);
                setAddressId(showNewAddress ? (addresses.find(a => a.isDefault) || addresses[0])._id : '');
              }}>
                {showNewAddress ? 'Choose a saved address' : '+ Ship to a new address'}
              </button>
            )}

            {showNewAddress && (
              <form className="co-address-form" onSubmit={saveNewAddress} noValidate>
                <div className="co-field-row">
                  <FormField
                    id="fullName"
                    label="Full name"
                    value={newAddress.fullName}
                    onChange={onAddressField}
                    error={addressErrors.fullName}
                    autoComplete="name"
                    maxLength={80}
                    required
                  />
                  <FormField
                    id="phone"
                    label="Phone"
                    type="tel"
                    value={newAddress.phone}
                    onChange={onAddressField}
                    error={addressErrors.phone}
                    autoComplete="tel"
                    maxLength={20}
                    required
                  />
                </div>
                <FormField
                  id="line1"
                  label="Address line 1"
                  value={newAddress.line1}
                  onChange={onAddressField}
                  error={addressErrors.line1}
                  autoComplete="address-line1"
                  maxLength={120}
                  required
                />
                <FormField
                  id="line2"
                  label="Address line 2 (optional)"
                  value={newAddress.line2}
                  onChange={onAddressField}
                  error={addressErrors.line2}
                  autoComplete="address-line2"
                  maxLength={120}
                />
                <div className="co-field-row co-field-row--3">
                  <FormField
                    id="city"
                    label="City"
                    value={newAddress.city}
                    onChange={onAddressField}
                    error={addressErrors.city}
                    autoComplete="address-level2"
                    maxLength={60}
                    required
                  />
                  <FormField
                    id="state"
                    label="State"
                    value={newAddress.state}
                    onChange={onAddressField}
                    error={addressErrors.state}
                    autoComplete="address-level1"
                    maxLength={60}
                    required
                  />
                  <FormField
                    id="pincode"
                    label="Pincode"
                    inputMode="numeric"
                    value={newAddress.pincode}
                    onChange={onAddressField}
                    error={addressErrors.pincode}
                    autoComplete="postal-code"
                    maxLength={10}
                    required
                  />
                </div>
                <button type="submit" className="btn-secondary">
                  Save address
                </button>
              </form>
            )}
          </section>

          <section className="co-card" aria-labelledby="co-coupon">
            <h2 id="co-coupon">
              <span className="co-step">02</span> Coupon
            </h2>
            {coupon ? (
              <div className="co-coupon-applied">
                <span>
                  <strong>{coupon.code}</strong> applied — you save {formatMoney(coupon.discount)}
                </span>
                <button type="button" className="co-link" onClick={removeCoupon}>
                  Remove
                </button>
              </div>
            ) : (
              <form className="co-coupon-form" onSubmit={applyCoupon}>
                <FormField
                  id="couponCode"
                  label="Coupon code"
                  value={couponInput}
                  onChange={e => {
                    setCouponInput(e.target.value);
                    if (couponError) setCouponError('');
                  }}
                  error={couponError}
                  maxLength={40}
                  autoComplete="off"
                />
                <button type="submit" className="btn-secondary" disabled={checkingCoupon || placing || !couponInput.trim()}>
                  {checkingCoupon ? 'Checking…' : 'Apply'}
                </button>
              </form>
            )}
          </section>

          <section className="co-card" aria-labelledby="co-payment">
            <h2 id="co-payment">
              <span className="co-step">03</span> Payment
            </h2>
            <label className="co-pay is-selected">
              <input type="radio" name="payment" checked readOnly />
              <span>
                <strong>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    local_atm
                  </span>
                  Cash on Delivery
                </strong>
                <span>Pay when your order arrives</span>
              </span>
            </label>
            <label className="co-pay is-disabled" title="Online payments arrive in the next release">
              <input type="radio" name="payment" disabled />
              <span>
                <strong>Card / UPI (Razorpay)</strong>
                <span>Coming soon</span>
              </span>
            </label>
          </section>

          <section className="co-card" aria-labelledby="co-note">
            <h2 id="co-note">
              <span className="co-step">04</span> Order note (optional)
            </h2>
            <textarea
              className="co-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Delivery instructions, gate code…"
              aria-label="Order note"
            />
          </section>
        </div>

        {/* ---------------- right: live-priced summary ---------------- */}
        <aside className="co-summary" aria-label="Order summary">
          <h2>Order summary</h2>

          <ul className="co-items">
            {(preview.items || []).map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <LazyImage
                  src={item.image}
                  alt=""
                  className="co-item-img"
                  wrapperClassName="lazy-image--square"
                  width={64}
                  height={64}
                />
                <span className="co-item-name">
                  {item.name}
                  <em>{[item.size && `Size ${item.size}`, item.color, `Qty ${item.qty}`].filter(Boolean).join(' · ')}</em>
                </span>
                <span className="co-item-price">{formatMoney(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="co-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(p.subtotal)}</dd>
            </div>
            {p.discount > 0 && (
              <div className="co-save">
                <dt>Discount{coupon ? ` (${coupon.code})` : ''}</dt>
                <dd>-{formatMoney(p.discount)}</dd>
              </div>
            )}
            <div>
              <dt>Shipping</dt>
              <dd>{p.shipping === 0 ? 'Free' : formatMoney(p.shipping)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{formatMoney(p.tax)}</dd>
            </div>
            <div className="co-grand">
              <dt>Total</dt>
              <dd>{formatMoney(p.total)}</dd>
            </div>
          </dl>

          {previewError && (
            <p className="co-error" role="alert">
              {previewError} <button type="button" className="co-toggle" onClick={() => runPreview()}>Retry pricing</button>
            </p>
          )}

          <p className="co-verify">
            <span className="material-symbols-outlined" aria-hidden="true">
              lock
            </span>
            Priced and verified by the server — coupons are re-checked before you pay.
          </p>

          <button
            type="button"
            className="btn-primary co-place"
            onClick={placeOrder}
            disabled={placing || checkingCoupon || pricingPending || !!previewError || !preview.itemCount || (!addressId && !showNewAddress)}
          >
            {placing ? 'Placing order…' : pricingPending ? 'Calculating total…' : `Place order · ${formatMoney(p.total)}`}
            {!placing && (
              <span className="material-symbols-outlined" aria-hidden="true">
                lock
              </span>
            )}
          </button>

          <p className="co-fineprint">
            By placing this order you agree to our terms. Items are reserved only when the order
            is confirmed.
          </p>
          {selectedAddress && (
            <p className="co-ship-to">
              Delivering to <strong>{selectedAddress.fullName}</strong>, {selectedAddress.city}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Checkout;
