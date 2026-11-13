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
import { useScenario } from './lib/store';

import { startLogging, summary } from './lib/log';

startLogging();

// Dev only: lets test scripts read and drive the scenario store.
if (import.meta.env.DEV) Object.assign(window, { __pmr: useScenario, __pmrSummary: summary });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
