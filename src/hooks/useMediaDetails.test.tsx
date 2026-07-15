import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useMediaDetails,
  usePrefetchMediaDetails,
  useWarmAlternateLanguageMediaDetails,
} from './useMediaDetails';
import { writeMediaDetailsSmartCache } from './mediaDetailsSmartCache';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';
import type { TmdbMovieDetails, TmdbTvDetails } from '@/types/tmdb';

const { getMovieDetailsMock, getTvDetailsMock } = vi.hoisted(() => ({
  getMovieDetailsMock: vi.fn(),
  getTvDetailsMock: vi.fn(),
}));

vi.mock('@/lib/tmdb/endpoints', () => ({
  getMovieDetails: getMovieDetailsMock,
  getTvDetails: getTvDetailsMock,
}));

const movieDetails = {
  id: 1,
  title: 'Movie',
  original_title: 'Movie',
  overview: 'Overview',
  poster_path: null,
  backdrop_path: null,
  vote_average: 7,
  popularity: 10,
  release_date: '2026-01-01',
  genre_ids: [],
  genres: [],
  runtime: 100,
  tagline: null,
  status: 'Released',
} satisfies TmdbMovieDetails;

const tvDetails = {
  id: 2,
  name: 'Series',
  original_name: 'Series',
  overview: 'Overview',
  poster_path: null,
  backdrop_path: null,
  vote_average: 8,
  popularity: 20,
  first_air_date: '2026-01-01',
  genre_ids: [],
  genres: [],
  episode_run_time: [45],
  number_of_seasons: 1,
  number_of_episodes: 8,
  tagline: null,
  status: 'Returning Series',
} satisfies TmdbTvDetails;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <I18nProvider>{children}</I18nProvider>
    </QueryClientProvider>
  );
}

function wrapperWithClient(client: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <I18nProvider>{children}</I18nProvider>
      </QueryClientProvider>
    );
  };
}

describe('useMediaDetails', () => {
  beforeEach(() => {
    localStorage.setItem('movies-catalog:language', 'en-US');
    getMovieDetailsMock.mockResolvedValue(movieDetails);
    getTvDetailsMock.mockResolvedValue(tvDetails);
  });

  it('fetches movie details with the active language in the query function', async () => {
    const { result } = renderHook(() => useMediaDetails('movie', 1), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(movieDetails));

    expect(getMovieDetailsMock).toHaveBeenCalledWith(1, 'en-US');
    expect(getTvDetailsMock).not.toHaveBeenCalled();
  });

  it('uses smart cached details as placeholder data when the target language is warm', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    writeMediaDetailsSmartCache(client, 'movie', 1, 'pt-BR', {
      ...movieDetails,
      title: 'Filme em portugues',
      overview: 'Texto em portugues',
      genres: [{ id: 1, name: 'Acao' }],
    });
    writeMediaDetailsSmartCache(client, 'movie', 1, 'en-US', {
      ...movieDetails,
      title: 'Cached English movie',
      overview: 'Cached English text',
      genres: [{ id: 1, name: 'Action' }],
    });

    const { result } = renderHook(() => useMediaDetails('movie', 1), {
      wrapper: wrapperWithClient(client),
    });

    expect(result.current.data).toMatchObject({
      title: 'Cached English movie',
      overview: 'Cached English text',
      poster_path: movieDetails.poster_path,
      genres: [{ id: 1, name: 'Action' }],
    });
    expect(result.current.isPlaceholderData).toBe(true);
  });

  it('fetches TV details through the TV endpoint', async () => {
    const { result } = renderHook(() => useMediaDetails('tv', 2), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(tvDetails));

    expect(getTvDetailsMock).toHaveBeenCalledWith(2, 'en-US');
  });

  it('does not fetch details when disabled or when id is invalid', async () => {
    renderHook(() => useMediaDetails('movie', 0, true), { wrapper });
    renderHook(() => useMediaDetails('movie', 1, false), { wrapper });

    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(getMovieDetailsMock).not.toHaveBeenCalled();
  });

  it('prefetches details using the same key and active language', async () => {
    const { result } = renderHook(() => usePrefetchMediaDetails(), { wrapper });

    result.current('movie', 1);

    await waitFor(() => expect(getMovieDetailsMock).toHaveBeenCalledWith(1, 'en-US'));
  });

  it('ignores invalid prefetch ids', async () => {
    const { result } = renderHook(() => usePrefetchMediaDetails(), { wrapper });

    result.current('movie', 0);
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(getMovieDetailsMock).not.toHaveBeenCalled();
  });

  it('warms the alternate language details cache', async () => {
    renderHook(() => useWarmAlternateLanguageMediaDetails('movie', 1), { wrapper });

    await waitFor(() => expect(getMovieDetailsMock).toHaveBeenCalledWith(1, 'pt-BR'));
  });

  it('does not warm alternate language details when disabled or id is invalid', async () => {
    renderHook(() => useWarmAlternateLanguageMediaDetails('movie', 0), { wrapper });
    renderHook(() => useWarmAlternateLanguageMediaDetails('movie', 1, false), { wrapper });

    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(getMovieDetailsMock).not.toHaveBeenCalled();
  });
});
