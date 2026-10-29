import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useSettings } from './store/settings';
import './styles/app.css';

// Set before the first engine call, which carries the language along.
document.documentElement.lang = useSettings.getState().locale;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
