import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import {
  persistQueryCache,
  queryClient,
  queryKeys,
  queryPersistence,
  queryStaleTime,
  restorePersistedQueryCache,
} from './queryClient';
import { TmdbApiError } from '@/lib/tmdb/client';

describe('query client configuration', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('keeps stable query keys with language and filters included', () => {
    expect(queryKeys.trending('movie', 'pt-BR', 'week')).toEqual([
      'trending',
      'movie',
      'pt-BR',
      'week',
    ]);
    expect(queryKeys.discover('tv', 'en-US', 'alphabetical', 3, 35)).toEqual([
      'discover',
      'tv',
      'en-US',
      'alphabetical',
      3,
      35,
      'all',
    ]);
    expect(queryKeys.details('movie', 42, 'en-US')).toEqual([
      'details',
      'movie',
      42,
      'en-US',
    ]);
    expect(queryKeys.detailsBase('movie', 42)).toEqual([
      'detailsBase',
      'movie',
      42,
    ]);
    expect(queryKeys.detailsText('movie', 42, 'pt-BR')).toEqual([
      'detailsText',
      'movie',
      42,
      'pt-BR',
    ]);
    expect(queryKeys.genres('movie', 'pt-BR')).toEqual([
      'genres',
      'movie',
      'pt-BR',
    ]);
  });

  it('uses longer stale times for catalog and detail data', () => {
    expect(queryStaleTime.trending).toBe(10 * 60 * 1000);
    expect(queryStaleTime.catalog).toBe(45 * 60 * 1000);
    expect(queryStaleTime.details).toBe(12 * 60 * 60 * 1000);
    expect(queryStaleTime.genres).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('does not retry permanent TMDB errors but retries transient failures', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe('function');

    if (typeof retry !== 'function') {
      throw new Error('Retry option should be a function.');
    }

    expect(retry(0, new TmdbApiError('Unauthorized', 401))).toBe(false);
    expect(retry(0, new TmdbApiError('Not found', 404))).toBe(false);
    expect(retry(1, new TmdbApiError('Server error', 500))).toBe(true);
    expect(retry(2, new Error('Network'))).toBe(false);
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
});
