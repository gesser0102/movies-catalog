import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppProviders } from '@/app/providers/AppProviders';
import './index.css';

// Ponto de entrada. StrictMode só roda em desenvolvimento e ajuda a pegar
// efeitos colaterais mal comportados cedo — não afeta o bundle de produção.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
