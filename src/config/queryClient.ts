import {
  QueryClient,
  dehydrate,
  hydrate,
  type DehydratedState,
  type Query,
} from '@tanstack/react-query';
import { TmdbApiError } from '@/lib/tmdb/client';

export const queryStaleTime = {
  trending: 10 * 60 * 1000,
  catalog: 45 * 60 * 1000,
  details: 12 * 60 * 60 * 1000,
  credits: 7 * 24 * 60 * 60 * 1000,
  similar: 12 * 60 * 60 * 1000,
  genres: 7 * 24 * 60 * 60 * 1000,
} as const;

const queryGcTime = {
  default: 30 * 60 * 1000,
  details: queryStaleTime.details,
  detailsSmartCache: queryStaleTime.details,
  credits: queryStaleTime.credits,
  genres: queryStaleTime.genres,
} as const;

const persistedQueryRoots = new Set(['genres', 'detailsBase', 'detailsText', 'credits']);
const persistedQueryMaxAge: Record<string, number> = {
  genres: queryStaleTime.genres,
  detailsBase: queryStaleTime.details,
  detailsText: queryStaleTime.details,
  credits: queryStaleTime.credits,
};
const QUERY_CACHE_STORAGE_KEY = 'movies-catalog:react-query-cache:v1';
const QUERY_CACHE_PERSIST_THROTTLE_MS = 1000;

interface PersistedQueryCache {
  state: DehydratedState;
}

function getQueryRoot(queryKey: readonly unknown[]) {
  const root = queryKey[0];
  return typeof root === 'string' ? root : null;
}

function shouldPersistQuery(query: Query) {
  const root = getQueryRoot(query.queryKey);
  return Boolean(
    root &&
      persistedQueryRoots.has(root) &&
      query.state.status === 'success' &&
      query.state.data !== undefined,
  );
}

function prunePersistedState(
  state: DehydratedState,
  now = Date.now(),
): DehydratedState {
  return {
    ...state,
    queries: state.queries.filter((query) => {
      const root = getQueryRoot(query.queryKey);
      if (!root || !persistedQueryRoots.has(root)) return false;

      const maxAge = persistedQueryMaxAge[root] ?? queryGcTime.default;
      const updatedAt = query.state.dataUpdatedAt;
      return updatedAt > 0 && now - updatedAt <= maxAge;
    }),
  };
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Configuracao global do React Query.
 *
 * Dados de catalogo de filme nao possuem tanta alteracao.
 * por exemplo: um elenco nao vai mudar.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 min "fresco": dentro disso, reusa cache sem bater na rede.
      staleTime: 5 * 60 * 1000,
      // 30 min em memoria antes de coletar o cache inativo.
      gcTime: queryGcTime.default,
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
  detailsBase: (mediaType: string, id: number) =>
    ['detailsBase', mediaType, id] as const,
  detailsText: (mediaType: string, id: number, language: string) =>
    ['detailsText', mediaType, id, language] as const,
  credits: (mediaType: string, id: number) =>
    ['credits', mediaType, id] as const,
  similar: (mediaType: string, id: number, language: string) =>
    ['similar', mediaType, id, language] as const,
  genres: (mediaType: string, language: string) =>
    ['genres', mediaType, language] as const,
} as const;

export const queryPersistence = {
  storageKey: QUERY_CACHE_STORAGE_KEY,
  persistedRoots: Array.from(persistedQueryRoots),
  maxAge: persistedQueryMaxAge,
} as const;

export function restorePersistedQueryCache(client: QueryClient) {
  if (!canUseBrowserStorage()) return;

  try {
    const raw = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
    if (!raw) return;

    const persisted = JSON.parse(raw) as PersistedQueryCache;
    const state = prunePersistedState(persisted.state);

    if (state.queries.length === 0) {
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return;
    }

    hydrate(client, state);
  } catch {
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
  }
}

export function persistQueryCache(client: QueryClient) {
  if (!canUseBrowserStorage()) return;

  const state = dehydrate(client, {
    shouldDehydrateQuery: shouldPersistQuery,
  });
  const prunedState = prunePersistedState(state);

  try {
    if (prunedState.queries.length === 0) {
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      QUERY_CACHE_STORAGE_KEY,
      JSON.stringify({ state: prunedState } satisfies PersistedQueryCache),
    );
  } catch {
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
  }
}

export function installQueryCachePersistence(client: QueryClient) {
  if (!canUseBrowserStorage()) return () => {};

  restorePersistedQueryCache(client);

  let persistTimer: number | undefined;
  const unsubscribe = client.getQueryCache().subscribe(() => {
    window.clearTimeout(persistTimer);
    persistTimer = window.setTimeout(
      () => persistQueryCache(client),
      QUERY_CACHE_PERSIST_THROTTLE_MS,
    );
  });

  const persistBeforeUnload = () => persistQueryCache(client);
  window.addEventListener('pagehide', persistBeforeUnload);

  return () => {
    window.clearTimeout(persistTimer);
    window.removeEventListener('pagehide', persistBeforeUnload);
    unsubscribe();
  };
}
