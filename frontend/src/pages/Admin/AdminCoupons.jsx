import { useCallback, useEffect, useState } from 'react';
import { del, patch, post, raw } from '../../api';
import { useToast } from '../../components/Toast/Toast.jsx';
import { ListSkeleton } from '../../components/Skeleton/Skeleton';

/**
 * /admin?view=coupons - coupon manager.
 *
 * Checkout validates codes server-side (POST /coupons/validate), so this
 * view only manages definitions. Delete is a kill switch: DELETE flips
 * `active=false` and keeps redemptions for audit - never a hard remove.
 */
const PAGE_SIZE = 20;

const CATEGORIES = [
  { id: 'tshirts', label: 'T-shirts' },
  { id: 'shirts', label: 'Shirts' },
  { id: 'pants', label: 'Pants' },
  { id: 'shoes', label: 'Shoes' },
];

const EMPTY_FORM = {
  code: '',
  description: '',
  type: 'percent',
  value: '',
  minCart: '',
  maxDiscount: '',
  startsAt: '',
  expiresAt: '',
  usageLimit: '',
  perUserLimit: '1',
  applicableCategories: [],
  active: true,
};

// ISO string -> value for <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
function toLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = num => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toISO(local) {
  if (!local) return undefined;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function toForm(coupon) {
  if (!coupon) return { ...EMPTY_FORM };
  return {
    code: coupon.code || '',
    description: coupon.description || '',
    type: coupon.type || 'percent',
    value: coupon.value == null ? '' : String(coupon.value),
    minCart: coupon.minCart == null ? '' : String(coupon.minCart),
    maxDiscount: coupon.maxDiscount == null ? '' : String(coupon.maxDiscount),
    startsAt: toLocalInput(coupon.startsAt),
    expiresAt: toLocalInput(coupon.expiresAt),
    usageLimit: coupon.usageLimit == null ? '' : String(coupon.usageLimit),
    perUserLimit: coupon.perUserLimit == null ? '1' : String(coupon.perUserLimit),
    applicableCategories: coupon.applicableCategories || [],
    active: coupon.active !== false,
  };
}

function AdminCoupons({ bump }) {
  const toast = useToast();

  const [coupons, setCoupons] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const envelope = await raw.get('/admin/coupons', { params: { page, limit: PAGE_SIZE } });
      setCoupons(Array.isArray(envelope.data) ? envelope.data : []);
      setMeta(envelope.meta || null);
    } catch (err) {
      setCoupons([]);
      setError(err.message || 'Could not load coupons.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- spinner flag only; list lands after await
    load();
  }, [load, bump]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = coupon => {
    setEditing(coupon);
    setForm(toForm(coupon));
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFormError('');
  };

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleCategory = id =>
    setForm(prev => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(id)
        ? prev.applicableCategories.filter(item => item !== id)
        : [...prev.applicableCategories, id],
    }));

  const submit = async event => {
    event.preventDefault();

    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    if (code.length < 3 || !/^[A-Za-z0-9_-]+$/.test(code)) {
      return setFormError('Code must be 3+ characters (letters, numbers, _ and - only).');
    }
    if (!Number.isFinite(value) || value < 0) return setFormError('Value must be 0 or more.');
    if (form.type === 'percent' && (value <= 0 || value > 100)) {
      return setFormError('Percent coupons must be between 1 and 100.');
    }
    const startsAt = toISO(form.startsAt);
    const expiresAt = toISO(form.expiresAt);
    if (form.expiresAt && !expiresAt) return setFormError('Expiry date is not a valid date.');
    if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
      return setFormError('Expiry must be after the start date.');
    }

    const payload = {
      code,
      description: form.description.trim(),
      type: form.type,
      value,
      minCart: form.minCart === '' ? 0 : Number(form.minCart),
      perUserLimit: form.perUserLimit === '' ? 1 : parseInt(form.perUserLimit, 10),
      applicableCategories: form.applicableCategories,
      active: form.active,
    };
    if (form.maxDiscount !== '') payload.maxDiscount = Number(form.maxDiscount);
    if (form.usageLimit !== '') payload.usageLimit = parseInt(form.usageLimit, 10);
    if (startsAt) payload.startsAt = startsAt;
    payload.expiresAt = expiresAt || null;

    setSaving(true);
    try {
      if (editing) {
        const updated = await patch(`/admin/coupons/${editing._id}`, payload);
        setCoupons(prev => prev.map(item => (item._id === updated._id ? updated : item)));
        toast.success('Coupon updated');
      } else {
        const created = await post('/admin/coupons', payload);
        setCoupons(prev => [created, ...prev]);
        toast.success('Coupon created');
      }
      closeForm();
    } catch (err) {
      setFormError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async coupon => {
    const deactivating = coupon.active !== false;
    if (deactivating && !window.confirm(`Deactivate "${coupon.code}"? Existing redemptions stay for audit.`)) return;
    setBusyId(coupon._id);
    try {
      if (deactivating) {
        await del(`/admin/coupons/${coupon._id}`);
        setCoupons(prev => prev.map(item => (item._id === coupon._id ? { ...item, active: false } : item)));
        toast.info('Coupon deactivated');
      } else {
        const updated = await patch(`/admin/coupons/${coupon._id}`, { active: true });
        setCoupons(prev => prev.map(item => (item._id === updated._id ? updated : item)));
        toast.success('Coupon reactivated');
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
        <button type="button" className="admin-action admin-action--new" onClick={openCreate}>
          + New coupon
        </button>
      </div>

      {formOpen && (
        <form className="admin-form" onSubmit={submit} aria-label={editing ? 'Edit coupon' : 'New coupon'}>
          <div className="admin-form__row">
            <label htmlFor="cf-code">Code</label>
            <input
              id="cf-code"
              value={form.code}
              onChange={event => setField('code', event.target.value.toUpperCase())}
              placeholder="WELCOME10"
              required
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="cf-type">Type</label>
            <select id="cf-type" value={form.type} onChange={event => setField('type', event.target.value)}>
              <option value="percent">Percent off</option>
              <option value="flat">Flat amount off</option>
            </select>
          </div>
          <div className="admin-form__row">
            <label htmlFor="cf-value">{form.type === 'percent' ? 'Percent (1–100)' : 'Amount ($)'}</label>
            <input
              id="cf-value"
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={event => setField('value', event.target.value)}
              required
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="cf-mincart">Min cart ($)</label>
            <input id="cf-mincart" type="number" min="0" step="0.01" value={form.minCart} onChange={event => setField('minCart', event.target.value)} />
          </div>
          <div className="admin-form__row">
            <label htmlFor="cf-maxdisc">Max discount ($) — optional</label>
            <input
              id="cf-maxdisc"
              type="number"
              min="0"
              step="0.01"
              value={form.maxDiscount}
              onChange={event => setField('maxDiscount', event.target.value)}
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="cf-starts">Starts — optional</label>
            <input id="cf-starts" type="datetime-local" value={form.startsAt} onChange={event => setField('startsAt', event.target.value)} />
          </div>
          <div className="admin-form__row">
            <label htmlFor="cf-expires">Expires — optional</label>
            <input
              id="cf-expires"
              type="datetime-local"
              value={form.expiresAt}
              onChange={event => setField('expiresAt', event.target.value)}
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="cf-usage">Total usage limit — optional</label>
            <input
              id="cf-usage"
              type="number"
              min="0"
              step="1"
              value={form.usageLimit}
              onChange={event => setField('usageLimit', event.target.value)}
              placeholder="unlimited"
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="cf-peruser">Per-user limit</label>
            <input
              id="cf-peruser"
              type="number"
              min="1"
              step="1"
              value={form.perUserLimit}
              onChange={event => setField('perUserLimit', event.target.value)}
            />
          </div>
          <fieldset className="admin-form__row admin-form__fieldset">
            <legend>Applies to — none = whole cart</legend>
            {CATEGORIES.map(item => (
              <span className="admin-form__check" key={item.id}>
                <input
                  id={`cf-cat-${item.id}`}
                  type="checkbox"
                  checked={form.applicableCategories.includes(item.id)}
                  onChange={() => toggleCategory(item.id)}
                />
                <label htmlFor={`cf-cat-${item.id}`}>{item.label}</label>
              </span>
            ))}
          </fieldset>
          <div className="admin-form__row admin-form__check">
            <input id="cf-active" type="checkbox" checked={form.active} onChange={event => setField('active', event.target.checked)} />
            <label htmlFor="cf-active">Active</label>
          </div>
          <div className="admin-form__row" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="cf-desc">Description</label>
            <textarea id="cf-desc" value={form.description} onChange={event => setField('description', event.target.value)} />
          </div>
          {formError && (
            <p className="admin-form__error" role="alert">
              {formError}
            </p>
          )}
          <div className="admin-form__actions">
            <button type="submit" className="admin-action" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
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
      ) : error ? null : coupons.length === 0 ? (
        <div className="bz-empty">
          <h2>No coupons yet.</h2>
          <button type="button" className="admin-action" onClick={openCreate}>
            Create the first one
          </button>
        </div>
      ) : (
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Coupon list">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min cart</th>
                <th>Window</th>
                <th>Redemptions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon._id}>
                  <td>
                    <strong>{coupon.code}</strong>
                    {coupon.description && <span className="admin-table__email">{coupon.description}</span>}
                  </td>
                  <td>
                    {coupon.type === 'percent' ? `${coupon.value}% off` : `$${Number(coupon.value).toFixed(2)} off`}
                    {coupon.maxDiscount != null && coupon.maxDiscount > 0 && (
                      <span className="admin-table__email">up to ${Number(coupon.maxDiscount).toFixed(2)}</span>
                    )}
                  </td>
                  <td>{coupon.minCart ? `$${Number(coupon.minCart).toFixed(2)}` : '—'}</td>
                  <td>
                    {formatDate(coupon.startsAt)} → {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'never'}
                  </td>
                  <td>
                    {coupon.usedCount || 0}
                    {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ' / ∞'}
                    <span className="admin-table__email">{coupon.perUserLimit ?? 1} per user</span>
                  </td>
                  <td>
                    <span className={`admin-badge admin-badge--${coupon.active !== false ? 'active' : 'off'}`}>
                      {coupon.active !== false ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="admin-table__actions">
                    <button type="button" className="admin-action" onClick={() => openEdit(coupon)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={coupon.active !== false ? 'admin-action admin-action--danger' : 'admin-action'}
                      disabled={busyId === coupon._id}
                      onClick={() => toggleActive(coupon)}
                    >
                      {coupon.active !== false ? 'Deactivate' : 'Reactivate'}
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
            Page {meta.page} of {meta.totalPages} · {meta.total} coupons
          </span>
          <button type="button" disabled={!meta.hasNext} onClick={() => setPage(current => current + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}

export default AdminCoupons;
