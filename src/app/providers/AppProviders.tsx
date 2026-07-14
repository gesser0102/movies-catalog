import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/config/queryClient';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';
import { ColorModeProvider } from '@/contexts/theme/ColorModeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeProvider>
        <I18nProvider>
          {children}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </I18nProvider>
      </ColorModeProvider>
    </QueryClientProvider>
  );
}
