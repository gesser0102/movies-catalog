import { QueryClient } from '@tanstack/react-query';
import { TmdbApiError } from '@/lib/tmdb/client';

export const queryStaleTime = {
  trending: 10 * 60 * 1000,
  catalog: 45 * 60 * 1000,
  details: 12 * 60 * 60 * 1000,
  credits: 7 * 24 * 60 * 60 * 1000,
  similar: 12 * 60 * 60 * 1000,
  genres: 30 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Configuração global do React Query.
 *
 * Dados de catálogo de filme nao possuem tanta alteracao.
 * por exemplo: um elenco nao vai mudar.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 min "fresco": dentro disso, reusa cache sem bater na rede.
      staleTime: 5 * 60 * 1000,
      // 30 min em memória antes de coletar o cache inativo.
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Falhas de 401 e 404 nao dao retry, apenas erros de servidor.
        if (error instanceof TmdbApiError) {
          if (error.status === 401 || error.status === 404) return false;
        }
        return failureCount < 2;
      },
    },
  },
});

/**
 * Centrilar keys, para evitar que sejam invalidads em outro lugar por uma escrita diferente.
 */
export const queryKeys = {
  trending: (mediaType: string, language: string, timeWindow: string) =>
    ['trending', mediaType, language, timeWindow] as const,
  popular: (mediaType: string, language: string) =>
    ['popular', mediaType, language] as const,
  topRated: (mediaType: string, language: string) =>
    ['topRated', mediaType, language] as const,
  collection: (mediaType: string, language: string, collection: string, page: number) =>
    ['collection', mediaType, language, collection, page] as const,
  discover: (
    mediaType: string,
    language: string,
    sort: string,
    page: number,
    genreId?: number,
    collection?: string,
  ) =>
    [
      'discover',
      mediaType,
      language,
      sort,
      page,
      genreId ?? 'all',
      collection ?? 'all',
    ] as const,
  details: (mediaType: string, id: number, language: string) =>
    ['details', mediaType, id, language] as const,
  credits: (mediaType: string, id: number) =>
    ['credits', mediaType, id] as const,
  similar: (mediaType: string, id: number, language: string) =>
    ['similar', mediaType, id, language] as const,
  genres: (mediaType: string, language: string) =>
    ['genres', mediaType, language] as const,
} as const;
