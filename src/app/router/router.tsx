import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { HomePage } from '@/features/catalog/pages/HomePage';
import { CatalogPage } from '@/features/catalog/pages/CatalogPage';
import { DetailsPage } from '@/features/details/pages/DetailsPage';
import { NotFoundPage } from '@/components/feedback/NotFoundPage';

/**
 * Definição de rotas.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Entrada da app cai direto no catálogo de filmes.
      { index: true, element: <Navigate to="/movies" replace /> },

      // ---- Filmes ----
      { path: 'movies', element: <HomePage mediaType="movie" /> },
      { path: 'movies/catalog', element: <CatalogPage mediaType="movie" /> },
      { path: 'movies/:id', element: <DetailsPage mediaType="movie" /> },

      // ---- Séries ----
      { path: 'series', element: <HomePage mediaType="tv" /> },
      { path: 'series/catalog', element: <CatalogPage mediaType="tv" /> },
      { path: 'series/:id', element: <DetailsPage mediaType="tv" /> },

      // Qualquer rota desconhecida cai no 404.
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
