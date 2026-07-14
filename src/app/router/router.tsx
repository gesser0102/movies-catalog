import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { LoadingState } from '@/components/feedback/LoadingState';

const HomePage = lazy(() =>
  import('@/features/catalog/pages/HomePage').then((module) => ({
    default: module.HomePage,
  })),
);

const CatalogPage = lazy(() =>
  import('@/features/catalog/pages/CatalogPage').then((module) => ({
    default: module.CatalogPage,
  })),
);

const DetailsPage = lazy(() =>
  import('@/features/details/pages/DetailsPage').then((module) => ({
    default: module.DetailsPage,
  })),
);

const NotFoundPage = lazy(() =>
  import('@/components/feedback/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);

function routeElement(element: ReactNode) {
  return <Suspense fallback={<LoadingState />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/movies" replace /> },

      { path: 'movies', element: routeElement(<HomePage mediaType="movie" />) },
      { path: 'movies/catalog', element: routeElement(<CatalogPage mediaType="movie" />) },
      { path: 'movies/:id', element: routeElement(<DetailsPage mediaType="movie" />) },

      { path: 'series', element: routeElement(<HomePage mediaType="tv" />) },
      { path: 'series/catalog', element: routeElement(<CatalogPage mediaType="tv" />) },
      { path: 'series/:id', element: routeElement(<DetailsPage mediaType="tv" />) },

      { path: '*', element: routeElement(<NotFoundPage />) },
    ],
  },
]);
