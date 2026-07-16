import { QueryClient } from '@tanstack/react-query';
import { TmdbApiError } from '@/lib/tmdb/client';

/**
 * TTLs por semântica do dado: reflete a frequência real de mudança na TMDB.
 */
export const queryStaleTime = {
  trending: 10 * 60 * 1000,
  catalog: 45 * 60 * 1000,
  details: 12 * 60 * 60 * 1000,
  credits: 7 * 24 * 60 * 60 * 1000,
  similar: 12 * 60 * 60 * 1000,
  genres: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * gcTime alinhado ao staleTime das famílias longas.
 */
export const queryGcTime = {
  default: 30 * 60 * 1000,
  details: queryStaleTime.details,
  detailsSmartCache: queryStaleTime.details,
  credits: queryStaleTime.credits,
  genres: queryStaleTime.genres,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //dentro disso, reusa cache sem bater na rede.
      staleTime: 5 * 60 * 1000,
      // 30 min em memória antes de coletar o cache inativo.
      gcTime: queryGcTime.default,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Falhas de 401 e 404 não dão retry, apenas outros tenta 2x.
        if (error instanceof TmdbApiError) {
          if (error.status === 401 || error.status === 404) return false;
        }
        return failureCount < 2;
      },
    },
  },
});

queryClient.setQueryDefaults(['genres'], {
  staleTime: queryStaleTime.genres,
  gcTime: queryGcTime.genres,
});

queryClient.setQueryDefaults(['credits'], {
  staleTime: queryStaleTime.credits,
  gcTime: queryGcTime.credits,
});

queryClient.setQueryDefaults(['details'], {
  staleTime: queryStaleTime.details,
  gcTime: queryGcTime.details,
});

queryClient.setQueryDefaults(['detailsBase'], {
  staleTime: queryStaleTime.details,
  gcTime: queryGcTime.detailsSmartCache,
});

queryClient.setQueryDefaults(['detailsText'], {
  staleTime: queryStaleTime.details,
  gcTime: queryGcTime.detailsSmartCache,
});

queryClient.setQueryDefaults(['season'], {
  staleTime: queryStaleTime.details,
  gcTime: queryGcTime.details,
});
