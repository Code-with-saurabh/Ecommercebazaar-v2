import React from 'react';

import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './assets/styles/index.css';
import App from './App';

import { Provider } from 'react-redux';
import { Store } from './Components/Store/Store.jsx';

import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary.jsx';
import { ToastProvider } from './Components/Toast/Toast.jsx';

import * as serviceWorker from './serviceWorker';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Provider store={Store}>
            <App />
          </Provider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

serviceWorker.unregister();
