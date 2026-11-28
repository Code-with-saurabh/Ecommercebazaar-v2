import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { isLoggedIn, isAdmin } from '../../utils/session';
import { ListSkeleton } from '../../components/Skeleton/Skeleton';
import './Admin.css';

/**
 * /admin - admin shell: shared header + stats entry, shareable sub-views.
 *
 * The active view lives in ?view= (users | orders | products | coupons |
 * reviews) so every section is deep-linkable, exactly like /account?tab=.
 * Each view fetches its own data; `bump` re-triggers a reload without
 * resetting the view's filters or page.
 *
 * Guarding happens twice on purpose: this page bounces non-admins to /login
 * (UX), and every endpoint the views call sits behind requireRole('admin')
 * on the API (security - a modified client cannot talk its way in).
 */
const AdminUsers = lazy(() => import('./AdminUsers'));
const AdminOrders = lazy(() => import('./AdminOrders'));
const AdminProducts = lazy(() => import('./AdminProducts'));
const AdminCoupons = lazy(() => import('./AdminCoupons'));
const AdminReviews = lazy(() => import('./AdminReviews'));

const VIEWS = [
  { id: 'users', label: 'Users', title: 'Account directory' },
  { id: 'orders', label: 'Orders', title: 'Order queue' },
  { id: 'products', label: 'Products', title: 'Catalog' },
  { id: 'coupons', label: 'Coupons', title: 'Coupons' },
  { id: 'reviews', label: 'Reviews', title: 'Review moderation' },
];

function Admin() {
  const history = useHistory();
  const location = useLocation();
  const [bump, setBump] = useState(0);

  const allowed = isLoggedIn() && isAdmin();

  useEffect(() => {
    if (!allowed) history.replace('/login');
  }, [allowed, history]);

  const queryView = new URLSearchParams(location.search).get('view');
  const view = VIEWS.some(item => item.id === queryView) ? queryView : 'users';
  const current = VIEWS.find(item => item.id === view);

  if (!allowed) return null; // redirecting to /login

  return (
    <div className="bz-shell bz-page admin-page">
      <header className="bz-lead admin-header">
        <div>
          <p className="bz-caps">Store administration</p>
          <h1>{current.title}</h1>
        </div>
        <button type="button" className="bz-btn bz-btn--outline" onClick={() => setBump(value => value + 1)}>
          Refresh
        </button>
      </header>

      <nav className="admin-nav" aria-label="Admin sections">
        {VIEWS.map(item => (
          <Link
            key={item.id}
            to={`/admin?view=${item.id}`}
            className={`admin-nav__link${item.id === view ? ' is-active' : ''}`}
            aria-current={item.id === view ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Suspense fallback={<ListSkeleton rows={6} />}>
        {view === 'users' && <AdminUsers bump={bump} />}
        {view === 'orders' && <AdminOrders bump={bump} />}
        {view === 'products' && <AdminProducts bump={bump} />}
        {view === 'coupons' && <AdminCoupons bump={bump} />}
        {view === 'reviews' && <AdminReviews bump={bump} />}
      </Suspense>
    </div>
  );
}

export default Admin;
