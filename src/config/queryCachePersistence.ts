import {
  dehydrate,
  hydrate,
  type DehydratedState,
  type Query,
  type QueryCacheNotifyEvent,
  type QueryClient,
} from '@tanstack/react-query';
import { queryGcTime, queryStaleTime } from './queryClient';

/**
 * Persistência seletiva do cache do React Query em localStorage.
 */

const persistedQueryRoots = new Set(['genres', 'detailsBase', 'detailsText', 'credits']);
const persistedQueryMaxAge: Record<string, number> = {
  genres: queryStaleTime.genres,
  detailsBase: queryStaleTime.details,
  detailsText: queryStaleTime.details,
  credits: queryStaleTime.credits,
};
const QUERY_CACHE_STORAGE_KEY = 'movies-catalog:react-query-cache:v2';
const QUERY_CACHE_PERSIST_QUIET_MS = 1000;
const QUERY_CACHE_PERSIST_MAX_WAIT_MS = 5000;

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

/**
 * Só eventos que mudam dados de queries persistíveis agendam gravação.
 * Eventos de observer (mount/unmount de componentes) e de queries de lista
 * não mexem no que vai pro localStorage.
 */
function shouldSchedulePersist(event: QueryCacheNotifyEvent) {
  if (event.type === 'updated') {
    if (event.action.type !== 'success') return false;
  } else if (event.type !== 'added' && event.type !== 'removed') {
    return false;
  }

  if (event.query.state.data === undefined) return false;

  const root = getQueryRoot(event.query.queryKey);
  return Boolean(root && persistedQueryRoots.has(root));
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

/**
 * Assina o cache e agenda gravações no localStorage. Não restaura nada.
 */
export function installQueryCachePersistence(client: QueryClient) {
  if (!canUseBrowserStorage()) return () => {};

  let quietTimer: number | undefined;
  let maxWaitTimer: number | undefined;

  const flushPersist = () => {
    window.clearTimeout(quietTimer);
    window.clearTimeout(maxWaitTimer);
    quietTimer = undefined;
    maxWaitTimer = undefined;
    persistQueryCache(client);
  };

  const schedulePersist = () => {
    window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(flushPersist, QUERY_CACHE_PERSIST_QUIET_MS);
    if (maxWaitTimer === undefined) {
      maxWaitTimer = window.setTimeout(
        flushPersist,
        QUERY_CACHE_PERSIST_MAX_WAIT_MS,
      );
    }
  };

  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (shouldSchedulePersist(event)) schedulePersist();
  });

  const persistBeforeUnload = () => persistQueryCache(client);
  window.addEventListener('pagehide', persistBeforeUnload);

  return () => {
    window.clearTimeout(quietTimer);
    window.clearTimeout(maxWaitTimer);
    window.removeEventListener('pagehide', persistBeforeUnload);
    unsubscribe();
  };
}
