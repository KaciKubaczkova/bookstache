import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function ViewportManager() {\n  useEffect(() => {\n    const viewport = window.visualViewport;\n    const updateViewport = () => {\n      const height = viewport?.height || window.innerHeight;\n      document.documentElement.style.setProperty('--app-viewport-height', `${height}px`);\n    };\n    updateViewport();\n    viewport?.addEventListener('resize', updateViewport);\n    viewport?.addEventListener('scroll', updateViewport);\n    window.addEventListener('resize', updateViewport);\n    window.addEventListener('orientationchange', updateViewport);\n    return () => {\n      viewport?.removeEventListener('resize', updateViewport);\n      viewport?.removeEventListener('scroll', updateViewport);\n      window.removeEventListener('resize', updateViewport);\n      window.removeEventListener('orientationchange', updateViewport);\n    };\n  }, []);\n  return null;\n}\n\nReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>\n      <ViewportManager />
      <App />
    </AuthProvider>
  </React.StrictMode>
);
