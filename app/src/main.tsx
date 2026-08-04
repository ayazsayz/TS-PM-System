import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import { useUiStore } from './store/useUiStore';
import { consumeImpersonationHash } from './lib/impersonation';
import App from './App.tsx';

// If the Admin Portal handed us an impersonation token via URL hash, install it
// BEFORE the auth store tries to restore a session.
consumeImpersonationHash();

// Apply the persisted theme + accent to <html> before first paint.
useUiStore.getState().initAppearance();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
