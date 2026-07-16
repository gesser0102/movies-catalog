import { describe, expect, it } from 'vitest';
import { queryKeys } from './queryKeys';

describe('query keys', () => {
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
    expect(queryKeys.season(42, 2, 'pt-BR')).toEqual([
      'season',
      'tv',
      42,
      2,
      'pt-BR',
    ]);
    expect(queryKeys.genres('movie', 'pt-BR')).toEqual([
      'genres',
      'movie',
      'pt-BR',
    ]);
  });
});
