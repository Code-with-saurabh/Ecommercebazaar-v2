// src/App.js

import React from 'react';
 
  
import {Switch, Route } from 'react-router-dom';
import Header from './Components/Header/main';
import Footer from './Components/Footer/main';
import About from './Components/Pages/About/About';
import Home from './Components/Pages/Home/Home';
import Products from './Components/Pages/Products/Products';
import ErrorPage from './Components/Pages/Error/ErrorPage';
import SignUp from './Components/Pages/SignUp/Signup';
import Login from './Components/Pages/Login/Login';
import Cart from './Components/Pages/Cart/Cart';
import Help from './Components/Pages/Help/Help';
import Contact from './Components/Pages/Contact/Contact';
import SearchPage  from './Components/Pages/SearchPage/SearchPage';
import ByNow from './Components/Pages/ByNow/ByNow';
import './assets/styles/App.css';
 
function App() {
   
  return (
    <>
        <div className="Header">
        <Header />
      </div>
      <div className="mainPage">
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/products" component={Products} />
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
        </Switch>
		
      </div>
      <div className="FDIV">
        <Footer />
      </div>
    </>
  );
}

export default App;

 