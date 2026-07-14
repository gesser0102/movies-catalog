import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './Header';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { ErrorState } from '@/components/feedback/ErrorState';

export function RootLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ErrorBoundary key={pathname} fallback={<ErrorState />}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
