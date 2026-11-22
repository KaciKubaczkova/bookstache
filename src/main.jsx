import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function ViewportManager() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const updateViewport = () => {
      const root = document.documentElement;
      const height = viewport?.height || window.innerHeight;
      const top = viewport?.offsetTop || 0;
      root.style.setProperty('--app-viewport-height', `${Math.round(height)}px`);
      root.style.setProperty('--app-viewport-top', `${Math.round(top)}px`);
    };

    const keepFocusedFieldVisible = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches('input, textarea, select')) return;
      if (!target.closest('.app-dialog-panel')) return;

      window.setTimeout(() => {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }, 120);
    };

    updateViewport();
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    document.addEventListener('focusin', keepFocusedFieldVisible);

    return () => {
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      document.removeEventListener('focusin', keepFocusedFieldVisible);
    };
  }, []);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ViewportManager />
      <App />
    </AuthProvider>
  </React.StrictMode>
);
