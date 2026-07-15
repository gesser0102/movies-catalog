import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/config/queryClient';
import {
  readMediaDetailsSmartCache,
  writeMediaDetailsSmartCache,
} from './mediaDetailsSmartCache';
import type { TmdbMovieDetails, TmdbTvDetails } from '@/types/tmdb';

const moviePt = {
  id: 1,
  title: 'A Odisseia',
  original_title: 'The Odyssey',
  overview: 'Texto em portugues.',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  vote_average: 5.4,
  popularity: 100,
  release_date: '2026-07-16',
  genre_ids: [12],
  genres: [{ id: 12, name: 'Aventura' }],
  runtime: 180,
  tagline: 'Desafie os deuses.',
  status: 'Released',
  content_rating: '14',
  trailer: null,
} satisfies TmdbMovieDetails;

const movieEn = {
  ...moviePt,
  title: 'The Odyssey',
  overview: 'English text.',
  genres: [{ id: 12, name: 'Adventure' }],
  tagline: 'Defy the gods.',
} satisfies TmdbMovieDetails;

const tvPt = {
  id: 2,
  name: 'A Serie',
  original_name: 'The Series',
  overview: 'Serie em portugues.',
  poster_path: null,
  backdrop_path: null,
  vote_average: 8,
  popularity: 80,
  first_air_date: '2026-01-01',
  genre_ids: [18],
  genres: [{ id: 18, name: 'Drama' }],
  episode_run_time: [45],
  number_of_seasons: 2,
  number_of_episodes: 16,
  tagline: null,
  status: 'Returning Series',
  content_rating: '16',
  trailer: null,
} satisfies TmdbTvDetails;

describe('mediaDetailsSmartCache', () => {
  it('stores stable movie fields once and keeps translated text by language', () => {
    const queryClient = new QueryClient();

    writeMediaDetailsSmartCache(queryClient, 'movie', 1, 'pt-BR', moviePt);
    writeMediaDetailsSmartCache(queryClient, 'movie', 1, 'en-US', movieEn);

    const merged = readMediaDetailsSmartCache(queryClient, 'movie', 1, 'en-US');

    expect(merged).toMatchObject({
      title: 'The Odyssey',
      original_title: 'The Odyssey',
      overview: 'English text.',
      poster_path: '/poster.jpg',
      release_date: '2026-07-16',
      genres: [{ id: 12, name: 'Adventure' }],
      content_rating: '14',
    });
    expect(queryClient.getQueryData(queryKeys.detailsBase('movie', 1))).toMatchObject({
      poster_path: '/poster.jpg',
      release_date: '2026-07-16',
    });
  });

  it('does not return stale text when the requested language text is missing', () => {
    const queryClient = new QueryClient();

    writeMediaDetailsSmartCache(queryClient, 'movie', 1, 'pt-BR', moviePt);

    expect(readMediaDetailsSmartCache(queryClient, 'movie', 1, 'en-US')).toBeUndefined();
  });

  it('merges TV stable fields with localized TV text', () => {
    const queryClient = new QueryClient();

    writeMediaDetailsSmartCache(queryClient, 'tv', 2, 'pt-BR', tvPt);

    expect(readMediaDetailsSmartCache(queryClient, 'tv', 2, 'pt-BR')).toMatchObject({
      name: 'A Serie',
      original_name: 'The Series',
      number_of_seasons: 2,
      episode_run_time: [45],
      genres: [{ id: 18, name: 'Drama' }],
    });
  });
});
