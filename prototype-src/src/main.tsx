import './lib/reset'; // must run before the store hydrates from localStorage
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/red-hat-text/latin-400.css';
import '@fontsource/red-hat-text/latin-500.css';
import '@fontsource/red-hat-text/latin-600.css';
import '@fontsource/red-hat-text/latin-700.css';
import '@fontsource/red-hat-mono/latin-400.css';
import '@fontsource/red-hat-mono/latin-500.css';
import '@vscode/codicons/dist/codicon.css';
import '../../shared/tokens.css';
import './app.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
