import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router/router';

/**
 * Componente raiz. Fica propositalmente magro: só planta o roteador. Toda a
 * configuração de contexto/tema/query vive no AppProviders (ver main.tsx), o que
 * mantém a árvore de composição fácil de ler.
 */
export function App() {
  return <RouterProvider router={router} />;
}
