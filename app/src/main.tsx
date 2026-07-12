import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import { useUiStore } from './store/useUiStore';
import App from './App.tsx';

// Apply the persisted theme + accent to <html> before first paint.
useUiStore.getState().initAppearance();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
