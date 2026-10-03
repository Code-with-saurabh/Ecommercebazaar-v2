// src/App.jsx
import React, { Suspense, lazy } from 'react';
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
const ByNow = lazy(() => import('./pages/ByNow/ByNow'));
const Admin = lazy(() => import('./pages/Admin/Admin'));

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
  return (
    <>
      <Seo />
      <ScrollToTop />
      {/* `sticky` (not `Header` alone) is what header/main.css styles -
          position:sticky + white bar so the nav survives long grids */}
      <div className="Header sticky">
        <Header />
      </div>
      <div className="mainPage">
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
          <LazyRoute path="/login" component={Login} fallback={<FormSkeleton fields={2} />} />
          <LazyRoute path="/signup" component={SignUp} fallback={<FormSkeleton fields={4} />} />
          <LazyRoute path="/error" component={ErrorPage} />
          <LazyRoute path="/cart" component={Cart} fallback={<CartSkeleton />} />
          <LazyRoute path="/help" component={Help} />
          <LazyRoute path="/contact" component={Contact} />
          <LazyRoute path="/search" component={SearchPage} fallback={<ProductGridSkeleton count={6} />} />
          <LazyRoute path="/ByNow" component={ByNow} />
          {/* role guard lives inside the page (redirects non-admins to /login) */}
          <LazyRoute path="/admin" component={Admin} fallback={<PageSkeleton sections={4} />} />
          {/* Unknown URLs used to render a blank page - now an explicit 404 */}
          <LazyRoute component={ErrorPage} />
        </Switch>
      </div>
      <div className="FDIV">
        <Footer />
      </div>
    </>
  );
}

export default App;
