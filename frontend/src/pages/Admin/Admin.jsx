import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { get, patch, raw } from '../../api';
import { isLoggedIn, isAdmin } from '../../utils/session';
import { useToast } from '../../components/Toast/Toast.jsx';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { ListSkeleton } from '../../components/Skeleton/Skeleton';
import './Admin.css';

/**
 * /admin - users management + headline stats.
 *
 * Guarding happens twice on purpose: this page bounces non-admins to /login
 * (UX), and every endpoint it calls sits behind requireRole('admin') on the
 * API (security - a modified client cannot talk its way in).
 */
const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function Admin() {
  const history = useHistory();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // search fires 300ms after typing stops, not per keystroke
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const allowed = isLoggedIn() && isAdmin();

  useEffect(() => {
    if (!allowed) history.replace('/login');
  }, [allowed, history]);

  const loadStats = useCallback(() => {
    get('/admin/stats')
      .then(setStats)
      .catch(() => {
        /* stats are decoration - never block the table on them */
      });
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // raw keeps `meta` (the get() helper unwraps to data only)
      const envelope = await raw.get('/admin/users', {
        params: { query: debouncedQuery, page, role, status, limit: PAGE_SIZE },
      });
      setUsers(Array.isArray(envelope.data) ? envelope.data : []);
      setMeta(envelope.meta || null);
    } catch (err) {
      setUsers([]);
      setError(err.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, role, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // new filter -> back to page 1 (avoids an empty page 2)
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, role, status]);

  const runAction = async (user, action, message) => {
    setBusyId(user.id);
    try {
      const updated = await action();
      setUsers(prev => prev.map(item => (item.id === updated.id ? { ...item, ...updated } : item)));
      toast.success(message);
      loadStats(); // disable/promote move the counters
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = user =>
    runAction(
      user,
      () => patch(`/admin/users/${user.id}/status`, { isActive: !user.isActive }),
      user.isActive ? `@${user.username} disabled` : `@${user.username} enabled`
    );

  const toggleRole = user =>
    runAction(
      user,
      () => patch(`/admin/users/${user.id}/role`, { role: user.role === 'admin' ? 'user' : 'admin' }),
      user.role === 'admin' ? `@${user.username} is now a user` : `@${user.username} is now an admin`
    );

  if (!allowed) return null; // redirecting to /login

  const statCards = stats
    ? [
        { label: 'Users', value: stats.users.total },
        { label: 'Admins', value: stats.users.admins },
        { label: 'Disabled', value: stats.users.disabled },
        { label: 'New (7d)', value: stats.users.newLast7d },
        { label: 'Orders', value: stats.orders.total },
        { label: 'Products', value: stats.products },
      ]
    : [];

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <button
          type="button"
          className="admin-refresh"
          onClick={() => {
            loadUsers();
            loadStats();
          }}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      {stats && (
        <div className="admin-stats">
          {statCards.map(card => (
            <div className="stat-card" key={card.label}>
              <span className="stat-card__value">{card.value}</span>
              <span className="stat-card__label">{card.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Search username or email…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          aria-label="Search users"
        />
        <select value={role} onChange={event => setRole(event.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadUsers}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : users.length === 0 ? (
        <div className="NFT_CC">
          <h2 className="NTF">No users found.</h2>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.username}</strong>
                    <span className="admin-table__email">{user.email}</span>
                  </td>
                  <td>{user.phone || '—'}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`admin-badge admin-badge--${user.isActive ? 'active' : 'off'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>{formatDate(user.lastLoginAt)}</td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className={user.isActive ? 'admin-action admin-action--danger' : 'admin-action'}
                      disabled={busyId === user.id}
                      onClick={() => toggleStatus(user)}
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="admin-action"
                      disabled={busyId === user.id}
                      onClick={() => toggleRole(user)}
                    >
                      {user.role === 'admin' ? 'Demote' : 'Promote'}
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
            Page {meta.page} of {meta.totalPages} · {meta.total} users
          </span>
          <button type="button" disabled={!meta.hasNext} onClick={() => setPage(current => current + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default Admin;
