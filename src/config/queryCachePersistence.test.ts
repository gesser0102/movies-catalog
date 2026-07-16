import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  installQueryCachePersistence,
  persistQueryCache,
  queryPersistence,
  restorePersistedQueryCache,
} from './queryCachePersistence';
import { queryStaleTime } from './queryClient';
import { queryKeys } from './queryKeys';

describe('query cache persistence', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('persists only stable React Query cache families', () => {
    const client = new QueryClient();

    client.setQueryData(queryKeys.genres('movie', 'pt-BR'), [{ id: 28, name: 'Acao' }]);
    client.setQueryData(queryKeys.detailsBase('movie', 1), { id: 1, title: 'Base' });
    client.setQueryData(queryKeys.detailsText('movie', 1, 'pt-BR'), {
      title: 'Titulo',
    });
    client.setQueryData(queryKeys.credits('movie', 1), { cast: [], crew: [] });
    client.setQueryData(queryKeys.popular('movie', 'pt-BR'), { results: [] });

    persistQueryCache(client);

    const raw = localStorage.getItem(queryPersistence.storageKey);
    expect(raw).not.toBeNull();

    const persisted = JSON.parse(raw ?? '{}') as {
      state: { queries: Array<{ queryKey: unknown[] }> };
    };
    const roots = persisted.state.queries.map((query) => query.queryKey[0]);

    expect(roots).toEqual(
      expect.arrayContaining(['genres', 'detailsBase', 'detailsText', 'credits']),
    );
    expect(roots).not.toContain('popular');
  });

  it('restores persisted stable caches and prunes expired entries', () => {
    const client = new QueryClient();
    client.setQueryData(queryKeys.genres('movie', 'pt-BR'), [{ id: 28, name: 'Acao' }]);
    client.setQueryData(queryKeys.detailsBase('movie', 1), { id: 1, title: 'Base' });
    persistQueryCache(client);

    const restored = new QueryClient();
    restorePersistedQueryCache(restored);

    expect(restored.getQueryData(queryKeys.genres('movie', 'pt-BR'))).toEqual([
      { id: 28, name: 'Acao' },
    ]);
    expect(restored.getQueryData(queryKeys.detailsBase('movie', 1))).toEqual({
      id: 1,
      title: 'Base',
    });

    const raw = localStorage.getItem(queryPersistence.storageKey);
    const persisted = JSON.parse(raw ?? '{}') as {
      state: { queries: Array<{ state: { dataUpdatedAt: number } }> };
    };
    for (const query of persisted.state.queries) {
      query.state.dataUpdatedAt = Date.now() - queryStaleTime.genres - 1;
    }
    localStorage.setItem(queryPersistence.storageKey, JSON.stringify(persisted));

    const expired = new QueryClient();
    restorePersistedQueryCache(expired);

    expect(expired.getQueryData(queryKeys.genres('movie', 'pt-BR'))).toBeUndefined();
    expect(localStorage.getItem(queryPersistence.storageKey)).toBeNull();
  });

  it('persists after a quiet window following a persistable change', () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    const uninstall = installQueryCachePersistence(client);

    try {
      client.setQueryData(queryKeys.genres('movie', 'pt-BR'), [
        { id: 28, name: 'Acao' },
      ]);

      vi.advanceTimersByTime(999);
      expect(localStorage.getItem(queryPersistence.storageKey)).toBeNull();

      vi.advanceTimersByTime(1);
      expect(localStorage.getItem(queryPersistence.storageKey)).not.toBeNull();
    } finally {
      uninstall();
      vi.useRealTimers();
    }
  });

  it('persists within the max wait window even under continuous cache activity', () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    const uninstall = installQueryCachePersistence(client);

    try {
      // Eventos a cada 500ms nunca deixam o debounce de 1s vencer;
      // o teto de 5s garante a gravação mesmo assim.
      for (let id = 1; id <= 10; id += 1) {
        client.setQueryData(queryKeys.detailsBase('movie', id), { id });
        vi.advanceTimersByTime(500);
      }

      expect(localStorage.getItem(queryPersistence.storageKey)).not.toBeNull();
    } finally {
      uninstall();
      vi.useRealTimers();
    }
  });

  it('does not schedule persistence when only non-persisted queries change', () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    const uninstall = installQueryCachePersistence(client);

    try {
      client.setQueryData(queryKeys.popular('movie', 'pt-BR'), { results: [] });
      client.setQueryData(queryKeys.trending('movie', 'pt-BR', 'week'), {
        results: [],
      });

      vi.advanceTimersByTime(10_000);
      expect(localStorage.getItem(queryPersistence.storageKey)).toBeNull();
    } finally {
      uninstall();
      vi.useRealTimers();
    }
  });
});
