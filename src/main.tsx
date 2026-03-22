import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from "@vercel/analytics/react";
import AppWrapper from './App.tsx';
import './index.css';

// Register service worker for PWA (only in production to avoid dev issues)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Function to detect if app is running in standalone mode
const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

// Log standalone mode status for debugging
console.log('Running in standalone mode:', isStandalone());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Analytics />
    <AppWrapper />
  </StrictMode>,
);
