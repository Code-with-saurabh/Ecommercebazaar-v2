// src/App.jsx
import { Suspense, lazy, useEffect } from 'react';
import { Switch, Route } from 'react-router-dom';

import Header from './layout/Header/main';
import Footer from './layout/Footer/main';
import ScrollToTop from './components/ScrollToTop';
import {
  HomeSkeleton,
  ProductGridSkeleton,
  FormSkeleton,
  CartSkeleton,
  PageSkeleton,
} from './components/Skeleton/Skeleton';
import { Seo } from './seo';
import { startCartSync } from './store/cartSync';
import './assets/styles/App.css';

// Route-level code splitting: each page is its own chunk, so the initial
// bundle only carries the shell + Home (lazy chunks load in parallel).
const Home = lazy(() => import(/* webpackChunkName: "home" */ './pages/Home/Home'));
const About = lazy(() => import('./pages/About/About'));
const Products = lazy(() => import('./pages/Products/Products'));
const ErrorPage = lazy(() => import('./pages/Error/ErrorPage'));
const SignUp = lazy(() => import('./pages/SignUp/Signup'));
const Login = lazy(() => import('./pages/Login/Login'));
const Cart = lazy(() => import('./pages/Cart/Cart'));
const Help = lazy(() => import('./pages/Help/Help'));
const Contact = lazy(() => import('./pages/Contact/Contact'));
const SearchPage = lazy(() => import('./pages/SearchPage/SearchPage'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation/OrderConfirmation'));
const Account = lazy(() => import('./pages/Account/Account'));
const Wishlist = lazy(() => import('./pages/Wishlist/Wishlist'));
const Admin = lazy(() => import('./pages/Admin/Admin'));
const ProductDetail = lazy(() => import('./pages/ProductDetail/ProductDetail'));

/**
 * LazyRoute — a route whose page chunk is loaded on demand, showing a
 * skeleton shaped like that page while the chunk downloads.
 *
 * (A single app-wide <Suspense> fallback was one spinner for everything;
 * per-route fallbacks show the grid/form/cart the user is waiting for.)
 *
 *   <LazyRoute path="/products" component={Products} fallback={<ProductGridSkeleton />} />
 *   <LazyRoute path="/products/tshirt" component={Products}
 *              componentProps={{ category: 'T-shirts' }} />
 */
function LazyRoute({ component: Component, componentProps, fallback, ...routeProps }) {
  return (
    <Route
      {...routeProps}
      render={props => (
        <Suspense fallback={fallback || <PageSkeleton />}>
          <Component {...props} {...componentProps} />
        </Suspense>
      )}
    />
  );
}

function App() {
  // local cart <-> server cart (guest cookie / account), see hooks/useCartSync
  useEffect(startCartSync, []);

  return (
    <>
      <Seo />
      <ScrollToTop />
      <a className="skip-content" href="#store-content">Skip to content</a>
      {/* `sticky` (not `Header` alone) is what header/main.css styles -
          position:sticky + white bar so the nav survives long grids */}
      <div className="Header sticky">
        <Header />
      </div>
      <main className="mainPage" id="store-content" tabIndex={-1}>
        <Switch>
          <LazyRoute exact path="/" component={Home} fallback={<HomeSkeleton />} />
          <LazyRoute path="/about" component={About} />
          <LazyRoute exact path="/products" component={Products} fallback={<ProductGridSkeleton />} />
          <LazyRoute
            path="/products/tshirt"
            component={Products}
            componentProps={{ category: 'T-shirts' }}
            fallback={<ProductGridSkeleton />}
          />
          <LazyRoute
            path="/products/shoes"
            component={Products}
            componentProps={{ category: 'Shoes' }}
            fallback={<ProductGridSkeleton />}
          />
          {/* after the literal category routes so /products/tshirt keeps its meaning;
              slug + mongo id both work - the API accepts either */}
          <LazyRoute
            path="/products/:id"
            component={ProductDetail}
            fallback={<PageSkeleton sections={3} />}
          />
          <LazyRoute path="/login" component={Login} fallback={<FormSkeleton fields={2} />} />
          <LazyRoute path="/signup" component={SignUp} fallback={<FormSkeleton fields={4} />} />
          <LazyRoute path="/error" component={ErrorPage} />
          <LazyRoute path="/cart" component={Cart} fallback={<CartSkeleton />} />
          <LazyRoute path="/help" component={Help} />
          <LazyRoute path="/contact" component={Contact} />
          <LazyRoute path="/search" component={SearchPage} fallback={<ProductGridSkeleton count={6} />} />
          {/* checkout is the real flow; /ByNow stays as a legacy alias so old
              links and bookmarks land on it instead of the dead placeholder */}
          <LazyRoute path="/checkout" component={Checkout} fallback={<PageSkeleton sections={3} />} />
          <LazyRoute path="/ByNow" component={Checkout} fallback={<PageSkeleton sections={3} />} />
          <LazyRoute
            path="/order/:id/confirmed"
            component={OrderConfirmation}
            fallback={<PageSkeleton sections={3} />}
          />
          <LazyRoute path="/account" component={Account} fallback={<PageSkeleton sections={3} />} />
          <LazyRoute path="/wishlist" component={Wishlist} fallback={<ProductGridSkeleton count={4} />} />
          {/* role guard lives inside the page (redirects non-admins to /login) */}
          <LazyRoute path="/admin" component={Admin} fallback={<PageSkeleton sections={4} />} />
          {/* Unknown URLs used to render a blank page - now an explicit 404 */}
          <LazyRoute component={ErrorPage} />
        </Switch>
      </main>
      <div className="FDIV">
        <Footer />
      </div>
    </>
  );
}

export default App;
