// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { Switch, Route } from 'react-router-dom';

import Header from './layout/Header/main';
import Footer from './layout/Footer/main';
import ScrollToTop from './components/ScrollToTop';
import { SpinnerBlock } from './components/Spinner/Spinner';
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

function App() {
  return (
    <>
      <ScrollToTop />
      <div className="Header">
        <Header />
      </div>
      <div className="mainPage">
        <Suspense fallback={<SpinnerBlock label="Loading page…" />}>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route exact path="/products" component={Products} />
            <Route path="/products/tshirt">
              <Products category="T-shirts" />
            </Route>
            <Route path="/products/shoes">
              <Products category="Shoes" />
            </Route>
            <Route path="/login" component={Login} />
            <Route path="/signup" component={SignUp} />
            <Route path="/error" component={ErrorPage} />
            <Route path="/cart" component={Cart} />
            <Route path="/help" component={Help} />
            <Route path="/contact" component={Contact} />
            <Route path="/search" component={SearchPage} />
            <Route path="/ByNow" component={ByNow} />
            {/* Unknown URLs used to render a blank page - now an explicit 404 */}
            <Route component={ErrorPage} />
          </Switch>
        </Suspense>
      </div>
      <div className="FDIV">
        <Footer />
      </div>
    </>
  );
}

export default App;
