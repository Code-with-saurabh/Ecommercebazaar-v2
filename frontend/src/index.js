import React from 'react';

import { createRoot } from 'react-dom/client'; 
import {BrowserRouter} from 'react-router-dom';
import './assets/styles/index.css';  
import App from './App';
 
import {Provider} from 'react-redux';
import {Store} from './Components/Store/Store.js';

import * as serviceWorker from './serviceWorker';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
 <BrowserRouter>
 
 <Provider store={Store}>
    <App />
 </Provider>
 </BrowserRouter>
  </React.StrictMode>
);

serviceWorker.unregister();

 // or serviceWorker.register() if you want to enable service worker
/*import React from 'react';
import ReactDOM from 'react-dom';
// import './index.css';
import './assets/styles/index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
 
ReactDOM.render(<App/>, document.getElementById('root'));
 // <React.StrictMode><App /></React.StrictMode>//not compusory
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

*/
 
 // import Router from './ExampleComponent.js';
  // <Router/>

 