import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCatalogListing,
  useCollection,
  useDiscover,
  useGenres,
  usePopular,
  useTopRated,
  useTrending,
  useWarmAlternateLanguageHomeQueries,
} from './queries';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';

const {
  discoverMediaMock,
  getGenresMock,
  getMediaCollectionMock,
  getPopularMock,
  getTopRatedMock,
  getTrendingMock,
} = vi.hoisted(() => ({
  discoverMediaMock: vi.fn(),
  getGenresMock: vi.fn(),
  getMediaCollectionMock: vi.fn(),
  getPopularMock: vi.fn(),
  getTopRatedMock: vi.fn(),
  getTrendingMock: vi.fn(),
}));

vi.mock('@/lib/tmdb/endpoints', () => ({
  discoverMedia: discoverMediaMock,
  getGenres: getGenresMock,
  getMediaCollection: getMediaCollectionMock,
  getPopular: getPopularMock,
  getTopRated: getTopRatedMock,
  getTrending: getTrendingMock,
  HOME_GENRES: {
    movie: [{ id: 28, key: 'action' }],
    tv: [{ id: 35, key: 'comedy' }],
  },
}));

const emptyPage = { page: 1, results: [], total_pages: 1, total_results: 0 };

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <I18nProvider>{children}</I18nProvider>
      </QueryClientProvider>
    );
  };
}

describe('catalog api queries', () => {
  beforeEach(() => {
    localStorage.setItem('movies-catalog:language', 'en-US');
    discoverMediaMock.mockReset().mockResolvedValue(emptyPage);
    getGenresMock.mockReset().mockResolvedValue([]);
    getMediaCollectionMock.mockReset().mockResolvedValue(emptyPage);
    getPopularMock.mockReset().mockResolvedValue(emptyPage);
    getTopRatedMock.mockReset().mockResolvedValue(emptyPage);
    getTrendingMock.mockReset().mockResolvedValue(emptyPage);
  });

  it('fetches trending with the active language and time window', async () => {
    const { result } = renderHook(() => useTrending('movie', 'day'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTrendingMock).toHaveBeenCalledWith({
      mediaType: 'movie',
      language: 'en-US',
      timeWindow: 'day',
    });
  });

  it('fetches genres, popular and top rated for the active language', async () => {
    const wrapper = createWrapper();
    const genres = renderHook(() => useGenres('tv'), { wrapper });
    const popular = renderHook(() => usePopular('movie'), { wrapper });
    const topRated = renderHook(() => useTopRated('tv'), { wrapper });

    await waitFor(() => expect(genres.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(popular.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(topRated.result.current.isSuccess).toBe(true));

    expect(getGenresMock).toHaveBeenCalledWith('tv', 'en-US');
    expect(getPopularMock).toHaveBeenCalledWith({
      mediaType: 'movie',
      language: 'en-US',
    });
    expect(getTopRatedMock).toHaveBeenCalledWith({
      mediaType: 'tv',
      language: 'en-US',
    });
  });

  it('fetches a paginated collection', async () => {
    const { result } = renderHook(() => useCollection('movie', 'now_playing', 2), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMediaCollectionMock).toHaveBeenCalledWith({
      mediaType: 'movie',
      language: 'en-US',
      collection: 'now_playing',
      page: 2,
    });
  });

  it('fetches discover pages with sort, genre and collection filters', async () => {
    const { result } = renderHook(
      () => useDiscover('movie', 'rating', 3, 28, 'top_rated'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(discoverMediaMock).toHaveBeenCalledWith({
      mediaType: 'movie',
      language: 'en-US',
      sort: 'rating',
      page: 3,
      genreId: 28,
      collection: 'top_rated',
    });
  });

  it('routes trending listings to the collection endpoint and warms the alternate language', async () => {
    const { result } = renderHook(
      () =>
        useCatalogListing({
          mediaType: 'movie',
          sort: 'popularity',
          page: 1,
          collection: 'trending',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMediaCollectionMock).toHaveBeenCalledWith({
      mediaType: 'movie',
      language: 'en-US',
      collection: 'trending',
      page: 1,
    });
    await waitFor(() =>
      expect(getMediaCollectionMock).toHaveBeenCalledWith({
        mediaType: 'movie',
        language: 'pt-BR',
        collection: 'trending',
        page: 1,
      }),
    );
    expect(discoverMediaMock).not.toHaveBeenCalled();
  });

  it('routes non-trending listings to discover and warms the alternate language', async () => {
    const { result } = renderHook(
      () =>
        useCatalogListing({
          mediaType: 'tv',
          sort: 'rating',
          page: 2,
          genreId: 35,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(discoverMediaMock).toHaveBeenCalledWith({
      mediaType: 'tv',
      language: 'en-US',
      sort: 'rating',
      page: 2,
      genreId: 35,
      collection: undefined,
    });
    await waitFor(() =>
      expect(discoverMediaMock).toHaveBeenCalledWith({
        mediaType: 'tv',
        language: 'pt-BR',
        sort: 'rating',
        page: 2,
        genreId: 35,
        collection: undefined,
      }),
    );
  });

  it('warms every home query in the alternate language', async () => {
    renderHook(() => useWarmAlternateLanguageHomeQueries('movie'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getTrendingMock).toHaveBeenCalledWith({
        mediaType: 'movie',
        language: 'pt-BR',
        timeWindow: 'day',
      });
      expect(getTrendingMock).toHaveBeenCalledWith({
        mediaType: 'movie',
        language: 'pt-BR',
        timeWindow: 'week',
      });
      expect(getPopularMock).toHaveBeenCalledWith({
        mediaType: 'movie',
        language: 'pt-BR',
      });
      expect(getTopRatedMock).toHaveBeenCalledWith({
        mediaType: 'movie',
        language: 'pt-BR',
      });
      expect(getGenresMock).toHaveBeenCalledWith('movie', 'pt-BR');
      expect(getMediaCollectionMock).toHaveBeenCalledWith({
        mediaType: 'movie',
        language: 'pt-BR',
        collection: 'now_playing',
        page: 1,
      });
      expect(getMediaCollectionMock).toHaveBeenCalledWith({
        mediaType: 'movie',
        language: 'pt-BR',
        collection: 'upcoming',
        page: 1,
      });
      expect(discoverMediaMock).toHaveBeenCalledWith({
        mediaType: 'movie',
        language: 'pt-BR',
        sort: 'popularity',
        page: 1,
        genreId: 28,
      });
    });
  });
});
