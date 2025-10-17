import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logStripeConfigStatus } from './lib/stripe/validation';
import { injectSpeedInsights } from '@vercel/speed-insights';

logStripeConfigStatus();
injectSpeedInsights();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
