import React from 'react';

import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './assets/styles/index.css';
import App from './App';

import { Provider } from 'react-redux';
import { Store } from './store/Store.jsx';

import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';
import { ToastProvider } from './components/Toast/Toast.jsx';

import registerServiceWorker from './pwa/registerSW';

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

registerServiceWorker();
