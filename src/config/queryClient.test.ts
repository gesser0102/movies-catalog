import { describe, expect, it } from 'vitest';
import { queryClient, queryKeys, queryStaleTime } from './queryClient';
import { TmdbApiError } from '@/lib/tmdb/client';

describe('query client configuration', () => {
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
    expect(queryStaleTime.genres).toBe(30 * 24 * 60 * 60 * 1000);
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
});
