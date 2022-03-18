import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import './i18n';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

Sentry.init({
  dsn: 'https://62a9b7e687d2478e8c83f606c1c9711a@o1170947.ingest.sentry.io/6264934',
  integrations: [new BrowserTracing()],
  release: process.env.REACT_APP_SENTRY_RELEASE,
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.2,
});

ReactDOM.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
