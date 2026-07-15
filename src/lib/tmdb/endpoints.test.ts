import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  discoverMedia,
  getCredits,
  getGenres,
  getMediaCollection,
  getMovieDetails,
  getPopular,
  getSimilar,
  getTopRated,
  getTrending,
  getTvDetails,
} from './endpoints';
import type {
  MovieReleaseDatesResponse,
  Paginated,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbTv,
  TmdbTvDetails,
  TvContentRatingsResponse,
} from '@/types/tmdb';

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock('./client', () => ({
  tmdbClient: {
    get: getMock,
  },
}));

function movie(overrides: Partial<TmdbMovie> = {}): TmdbMovie {
  return {
    id: 1,
    title: 'Título PT',
    original_title: 'Original Title',
    overview: 'Sinopse PT',
    poster_path: '/poster-pt.jpg',
    backdrop_path: '/backdrop-pt.jpg',
    vote_average: 7.2,
    popularity: 99,
    release_date: '2026-07-14',
    genre_ids: [28],
    ...overrides,
  };
}

function tv(overrides: Partial<TmdbTv> = {}): TmdbTv {
  return {
    id: 1,
    name: 'Série PT',
    original_name: 'Original Series',
    overview: 'Sinopse PT',
    poster_path: '/poster-pt.jpg',
    backdrop_path: '/backdrop-pt.jpg',
    vote_average: 8,
    popularity: 120,
    first_air_date: '2025-01-10',
    genre_ids: [35],
    ...overrides,
  };
}

function page<T>(results: T[]): Paginated<T> {
  return {
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length,
  };
}

describe('TMDB endpoints', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('keeps trending order and images from pt-BR while overlaying English text', async () => {
    getMock
      .mockResolvedValueOnce({
        data: page([
          movie({ id: 1, title: 'Primeiro PT', overview: 'Sinopse 1 PT' }),
          movie({ id: 2, title: 'Segundo PT', overview: 'Sinopse 2 PT' }),
        ]),
      })
      .mockResolvedValueOnce({
        data: page([
          movie({ id: 2, title: 'Second EN', overview: 'Overview 2 EN' }),
          movie({ id: 1, title: 'First EN', overview: 'Overview 1 EN' }),
        ]),
      });

    const result = await getTrending({
      mediaType: 'movie',
      language: 'en-US',
      timeWindow: 'week',
    });

    expect(getMock).toHaveBeenNthCalledWith(1, '/trending/movie/week', {
      params: { language: 'pt-BR', page: 1 },
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/trending/movie/week', {
      params: { language: 'en-US', page: 1 },
    });
    expect(result.results.map((item) => item.id)).toEqual([1, 2]);
    expect(result.results[0]).toMatchObject({
      title: 'First EN',
      overview: 'Overview 1 EN',
      posterPath: '/poster-pt.jpg',
    });
    expect(result.results[1]).toMatchObject({
      title: 'Second EN',
      overview: 'Overview 2 EN',
    });
  });

  it('falls back to item details when a localized list page misses a base item', async () => {
    getMock
      .mockResolvedValueOnce({
        data: page([
          movie({ id: 1, title: 'Primeiro PT', overview: 'Sinopse 1 PT' }),
          movie({ id: 2, title: 'Todo Mundo em Pânico', overview: 'Sinopse 2 PT' }),
        ]),
      })
      .mockResolvedValueOnce({
        data: page([
          movie({ id: 1, title: 'First EN', overview: 'Overview 1 EN' }),
        ]),
      })
      .mockResolvedValueOnce({
        data: movie({ id: 2, title: 'Scary Movie', overview: 'Overview 2 EN' }),
      });

    const result = await getMediaCollection({
      mediaType: 'movie',
      language: 'en-US',
      collection: 'now_playing',
    });

    expect(getMock).toHaveBeenNthCalledWith(1, '/movie/now_playing', {
      params: { language: 'pt-BR', region: 'BR', page: 1 },
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/movie/now_playing', {
      params: { language: 'en-US', region: 'BR', page: 1 },
    });
    expect(getMock).toHaveBeenNthCalledWith(3, '/movie/2', {
      params: { language: 'en-US' },
    });
    expect(result.results.map((item) => item.title)).toEqual([
      'First EN',
      'Scary Movie',
    ]);
    expect(result.results[1].posterPath).toBe('/poster-pt.jpg');
  });

  it('fetches the official localized genre list for the selected media type', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        genres: [
          { id: 28, name: 'Ação' },
          { id: 35, name: 'Comédia' },
        ],
      },
    });

    const result = await getGenres('movie', 'pt-BR');

    expect(getMock).toHaveBeenCalledWith('/genre/movie/list', {
      params: { language: 'pt-BR' },
    });
    expect(result).toEqual([
      { id: 28, name: 'Ação' },
      { id: 35, name: 'Comédia' },
    ]);
  });

  it('always applies Brazilian region params to movie collection requests', async () => {
    getMock.mockResolvedValue({ data: page([movie()]) });

    await getPopular({ mediaType: 'movie', language: 'pt-BR' });
    await getMediaCollection({
      mediaType: 'movie',
      language: 'pt-BR',
      collection: 'now_playing',
    });

    expect(getMock).toHaveBeenNthCalledWith(1, '/movie/popular', {
      params: { language: 'pt-BR', region: 'BR', page: 1 },
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/movie/now_playing', {
      params: { language: 'pt-BR', region: 'BR', page: 1 },
    });
  });

  it('adds representative vote filters to top rated discover pages', async () => {
    getMock.mockResolvedValue({ data: page([movie()]) });

    await getTopRated({ mediaType: 'movie', language: 'pt-BR', page: 3 });
    await discoverMedia({
      mediaType: 'movie',
      language: 'pt-BR',
      sort: 'rating',
      page: 1,
    });

    expect(getMock).toHaveBeenNthCalledWith(1, '/movie/top_rated', {
      params: { language: 'pt-BR', region: 'BR', page: 3 },
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/discover/movie', {
      params: {
        language: 'pt-BR',
        page: 1,
        sort_by: 'vote_average.desc',
        'vote_count.gte': 200,
        include_adult: false,
        include_video: false,
        region: 'BR',
      },
    });
  });

  it('adds Brazil timezone params to TV airing collections', async () => {
    getMock.mockResolvedValue({ data: page([tv()]) });

    await getMediaCollection({
      mediaType: 'tv',
      language: 'pt-BR',
      collection: 'airing_today',
      page: 2,
    });

    expect(getMock).toHaveBeenCalledWith('/tv/airing_today', {
      params: {
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        page: 2,
      },
    });
  });

  it('uses discover sort parameters that TMDB supports for TV catalog pages', async () => {
    getMock.mockResolvedValue({ data: page([tv()]) });

    await discoverMedia({
      mediaType: 'tv',
      language: 'pt-BR',
      sort: 'alphabetical',
      page: 2,
      genreId: 35,
    });

    expect(getMock).toHaveBeenCalledWith('/discover/tv', {
      params: {
        language: 'pt-BR',
        page: 2,
        sort_by: 'name.asc',
        'vote_count.gte': 0,
        with_genres: 35,
        include_adult: false,
      },
    });
  });

  it('maps catalog collections to discover date filters for movies and TV', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T12:00:00.000Z'));
    getMock.mockResolvedValue({ data: page([movie()]) });

    try {
      await discoverMedia({
        mediaType: 'movie',
        language: 'pt-BR',
        sort: 'popularity',
        page: 1,
        collection: 'now_playing',
      });
      await discoverMedia({
        mediaType: 'movie',
        language: 'pt-BR',
        sort: 'popularity',
        page: 1,
        collection: 'upcoming',
      });
      await discoverMedia({
        mediaType: 'tv',
        language: 'pt-BR',
        sort: 'popularity',
        page: 1,
        collection: 'airing_today',
      });
      await discoverMedia({
        mediaType: 'tv',
        language: 'pt-BR',
        sort: 'popularity',
        page: 1,
        collection: 'on_the_air',
      });
    } finally {
      vi.useRealTimers();
    }

    expect(getMock).toHaveBeenNthCalledWith(1, '/discover/movie', {
      params: expect.objectContaining({
        'release_date.gte': '2026-06-14',
        'release_date.lte': '2026-07-28',
        with_release_type: '2|3',
        region: 'BR',
      }),
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/discover/movie', {
      params: expect.objectContaining({
        'release_date.gte': '2026-07-15',
        'release_date.lte': '2026-10-12',
        with_release_type: '2|3',
        region: 'BR',
      }),
    });
    expect(getMock).toHaveBeenNthCalledWith(3, '/discover/tv', {
      params: expect.objectContaining({
        'air_date.gte': '2026-07-14',
        'air_date.lte': '2026-07-14',
        timezone: 'America/Sao_Paulo',
      }),
    });
    expect(getMock).toHaveBeenNthCalledWith(4, '/discover/tv', {
      params: expect.objectContaining({
        'air_date.gte': '2026-07-14',
        'air_date.lte': '2026-07-21',
        timezone: 'America/Sao_Paulo',
      }),
    });
  });

  it('fetches movie details with appended release dates and videos, then resolves BR release data', async () => {
    const releaseDates: MovieReleaseDatesResponse = {
      id: 1,
      results: [
        {
          iso_3166_1: 'US',
          release_dates: [
            {
              certification: 'PG-13',
              descriptors: [],
              iso_639_1: '',
              note: '',
              release_date: '2026-07-16T00:00:00.000Z',
              type: 3,
            },
          ],
        },
        {
          iso_3166_1: 'BR',
          release_dates: [
            {
              certification: '14',
              descriptors: [],
              iso_639_1: '',
              note: '',
              release_date: '2026-07-14T00:00:00.000Z',
              type: 3,
            },
          ],
        },
      ],
    };
    const details: TmdbMovieDetails = {
      ...movie({ title: 'English Title', overview: 'English overview' }),
      genres: [{ id: 28, name: 'Action' }],
      runtime: 130,
      tagline: 'Defy the gods.',
      status: 'Released',
      release_dates: releaseDates,
      videos: {
        id: 1,
        results: [
          {
            id: 'video-1',
            key: 'official-key',
            name: 'Official trailer',
            site: 'YouTube',
            size: 1080,
            type: 'Trailer',
            official: true,
            published_at: '2026-01-02T00:00:00.000Z',
          },
        ],
      },
    };

    getMock
      .mockResolvedValueOnce({ data: details })
      .mockResolvedValueOnce({
        data: { poster_path: '/poster-pt.jpg', backdrop_path: '/backdrop-pt.jpg' },
      });

    const result = await getMovieDetails(1, 'en-US');

    expect(getMock).toHaveBeenNthCalledWith(1, '/movie/1', {
      params: { language: 'en-US', append_to_response: 'release_dates,videos' },
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/movie/1', {
      params: { language: 'pt-BR', append_to_response: 'release_dates,videos' },
    });
    expect(result.release_date).toBe('2026-07-14');
    expect(result.content_rating).toBe('14');
    expect(result.poster_path).toBe('/poster-pt.jpg');
    expect(result.trailer?.key).toBe('official-key');
    expect(result.release_dates).toBeUndefined();
    expect(result.videos).toBeUndefined();
  });

  it('fetches TV details with appended content ratings and falls back to US rating when BR is unavailable', async () => {
    const contentRatings: TvContentRatingsResponse = {
      id: 1,
      results: [
        { iso_3166_1: 'US', rating: 'TV-14' },
        { iso_3166_1: 'DE', rating: '16' },
      ],
    };
    const details: TmdbTvDetails = {
      ...tv({ name: 'English Series', overview: 'English overview' }),
      genres: [{ id: 35, name: 'Comedy' }],
      episode_run_time: [42],
      number_of_seasons: 2,
      number_of_episodes: 16,
      tagline: null,
      status: 'Returning Series',
      content_ratings: contentRatings,
      videos: { id: 1, results: [] },
    };

    getMock
      .mockResolvedValueOnce({ data: details })
      .mockResolvedValueOnce({
        data: {
          videos: {
            id: 1,
            results: [
              {
                id: 'fallback-video',
                key: 'fallback-key',
                name: 'Fallback trailer',
                site: 'YouTube',
                size: 1080,
                type: 'Trailer',
                official: false,
                published_at: '2026-01-02T00:00:00.000Z',
              },
            ],
          },
        },
      });

    const result = await getTvDetails(1, 'pt-BR');

    expect(getMock).toHaveBeenNthCalledWith(1, '/tv/1', {
      params: { language: 'pt-BR', append_to_response: 'content_ratings,videos' },
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/tv/1', {
      params: { language: 'en-US', append_to_response: 'content_ratings,videos' },
    });
    expect(result.content_rating).toBe('TV-14');
    expect(result.trailer?.key).toBe('fallback-key');
    expect(result.content_ratings).toBeUndefined();
    expect(result.videos).toBeUndefined();
  });

  it('fetches credits in English to keep person names romanized', async () => {
    getMock.mockResolvedValueOnce({ data: { cast: [], crew: [] } });

    await getCredits('movie', 99);

    expect(getMock).toHaveBeenCalledWith('/movie/99/credits', {
      params: { language: 'en-US' },
    });
  });

  it('fetches similar titles through the same localized list pipeline', async () => {
    getMock
      .mockResolvedValueOnce({
        data: page([movie({ id: 9, title: 'Similar PT', overview: 'PT' })]),
      })
      .mockResolvedValueOnce({
        data: page([movie({ id: 9, title: 'Similar EN', overview: 'EN' })]),
      });

    const result = await getSimilar('movie', 1, 'en-US');

    expect(getMock).toHaveBeenNthCalledWith(1, '/movie/1/similar', {
      params: { language: 'pt-BR', region: 'BR' },
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/movie/1/similar', {
      params: { language: 'en-US', region: 'BR' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Similar EN');
  });

  it('keeps details usable when appended release dates are missing and the fallback request fails', async () => {
    const details: TmdbMovieDetails = {
      ...movie({ release_date: '2026-01-01' }),
      genres: [],
      runtime: 90,
      tagline: null,
      status: 'Released',
      videos: {
        id: 1,
        results: [
          {
            id: 'trailer',
            key: 'trailer-key',
            name: 'Trailer',
            site: 'YouTube',
            size: 1080,
            type: 'Trailer',
            official: true,
            published_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    };

    getMock.mockResolvedValueOnce({ data: details }).mockRejectedValueOnce(new Error('fail'));

    const result = await getMovieDetails(1, 'pt-BR');

    expect(getMock).toHaveBeenNthCalledWith(2, '/movie/1/release_dates');
    expect(result.release_date).toBe('2026-01-01');
    expect(result.content_rating).toBeUndefined();
  });

  it('returns null trailer when localized and fallback trailer requests both have no usable video', async () => {
    const details: TmdbTvDetails = {
      ...tv(),
      genres: [],
      episode_run_time: [],
      number_of_seasons: 1,
      number_of_episodes: 1,
      tagline: null,
      status: 'Returning Series',
      content_ratings: { id: 1, results: [] },
      videos: { id: 1, results: [] },
    };

    getMock.mockResolvedValueOnce({ data: details }).mockRejectedValueOnce(new Error('fail'));

    const result = await getTvDetails(1, 'pt-BR');

    expect(getMock).toHaveBeenNthCalledWith(2, '/tv/1', {
      params: { language: 'en-US', append_to_response: 'content_ratings,videos' },
    });
    expect(result.trailer).toBeNull();
  });

  it('fetches TV genres from the TV genre endpoint', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }],
      },
    });

    const result = await getGenres('tv', 'en-US');

    expect(getMock).toHaveBeenCalledWith('/genre/tv/list', {
      params: { language: 'en-US' },
    });
    expect(result).toEqual([{ id: 10765, name: 'Sci-Fi & Fantasy' }]);
  });

  it('does not apply movie region params to TV popularity requests', async () => {
    getMock.mockResolvedValue({ data: page([tv()]) });

    await getPopular({ mediaType: 'tv', language: 'pt-BR' });

    expect(getMock).toHaveBeenCalledWith('/tv/popular', {
      params: { language: 'pt-BR', page: 1 },
    });
  });

  it('rejects collections that do not belong to the selected media type', async () => {
    expect(() =>
      getMediaCollection({
        mediaType: 'tv',
        language: 'pt-BR',
        collection: 'now_playing',
      }),
    ).toThrow('Collection "now_playing" is not available for tv.');

    expect(getMock).not.toHaveBeenCalled();
  });

  it('adds only the representative vote filter to top rated TV discover pages', async () => {
    getMock.mockResolvedValue({ data: page([tv()]) });

    await discoverMedia({
      mediaType: 'tv',
      language: 'pt-BR',
      sort: 'popularity',
      page: 1,
      collection: 'top_rated',
    });

    expect(getMock).toHaveBeenCalledWith('/discover/tv', {
      params: {
        language: 'pt-BR',
        page: 1,
        sort_by: 'popularity.desc',
        'vote_count.gte': 200,
        include_adult: false,
      },
    });
  });

  it('does not add collection filters for discover collections without a discover mapping', async () => {
    getMock.mockResolvedValue({ data: page([movie()]) });

    await discoverMedia({
      mediaType: 'movie',
      language: 'pt-BR',
      sort: 'popularity',
      page: 1,
      collection: 'trending',
    });

    expect(getMock).toHaveBeenCalledWith('/discover/movie', {
      params: {
        language: 'pt-BR',
        page: 1,
        sort_by: 'popularity.desc',
        'vote_count.gte': 0,
        include_adult: false,
        include_video: false,
        region: 'BR',
      },
    });
  });

  it('keeps base text when localized list fallback details cannot be fetched', async () => {
    getMock
      .mockResolvedValueOnce({
        data: page([
          movie({ id: 1, title: 'Base PT', overview: 'Base overview PT' }),
        ]),
      })
      .mockResolvedValueOnce({ data: page([]) })
      .mockRejectedValueOnce(new Error('missing fallback'));

    const result = await getTrending({
      mediaType: 'movie',
      language: 'en-US',
      timeWindow: 'day',
    });

    expect(getMock).toHaveBeenNthCalledWith(3, '/movie/1', {
      params: { language: 'en-US' },
    });
    expect(result.results[0]).toMatchObject({
      title: 'Base PT',
      overview: 'Base overview PT',
    });
  });

  it('normalizes invalid release years to null in list items', async () => {
    getMock.mockResolvedValueOnce({
      data: page([movie({ release_date: 'not-a-date' })]),
    });

    const result = await getTrending({
      mediaType: 'movie',
      language: 'pt-BR',
      timeWindow: 'day',
    });

    expect(result.results[0].year).toBeNull();
  });

  it('prefers official trailers even when unofficial trailers are newer', async () => {
    const details: TmdbMovieDetails = {
      ...movie(),
      genres: [],
      runtime: 90,
      tagline: null,
      status: 'Released',
      release_dates: {
        id: 1,
        results: [],
      },
      videos: {
        id: 1,
        results: [
          {
            id: 'unofficial',
            key: 'unofficial-key',
            name: 'Unofficial trailer',
            site: 'YouTube',
            size: 1080,
            type: 'Trailer',
            official: false,
            published_at: '2026-02-01T00:00:00.000Z',
          },
          {
            id: 'official',
            key: 'official-key',
            name: 'Official trailer',
            site: 'YouTube',
            size: 1080,
            type: 'Trailer',
            official: true,
            published_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    };

    getMock.mockResolvedValueOnce({ data: details });

    const result = await getMovieDetails(1, 'pt-BR');

    expect(result.trailer?.key).toBe('official-key');
  });

  it('uses the newest trailer when candidates have the same official flag', async () => {
    const details: TmdbMovieDetails = {
      ...movie(),
      genres: [],
      runtime: 90,
      tagline: null,
      status: 'Released',
      release_dates: {
        id: 1,
        results: [],
      },
      videos: {
        id: 1,
        results: [
          {
            id: 'old',
            key: 'old-key',
            name: 'Old trailer',
            site: 'YouTube',
            size: 1080,
            type: 'Trailer',
            official: true,
            published_at: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'new',
            key: 'new-key',
            name: 'New trailer',
            site: 'YouTube',
            size: 1080,
            type: 'Trailer',
            official: true,
            published_at: '2026-02-01T00:00:00.000Z',
          },
        ],
      },
    };

    getMock.mockResolvedValueOnce({ data: details });

    const result = await getMovieDetails(1, 'pt-BR');

    expect(result.trailer?.key).toBe('new-key');
  });

  it('uses fallback BR release date and certification when priority release types are absent', async () => {
    const details: TmdbMovieDetails = {
      ...movie({ release_date: '2026-01-01' }),
      genres: [],
      runtime: 90,
      tagline: null,
      status: 'Released',
      release_dates: {
        id: 1,
        results: [
          {
            iso_3166_1: 'BR',
            release_dates: [
              {
                certification: '16',
                descriptors: [],
                iso_639_1: '',
                note: '',
                release_date: '2026-08-20T00:00:00.000Z',
                type: 9,
              },
            ],
          },
        ],
      },
      videos: {
        id: 1,
        results: [
          {
            id: 'trailer',
            key: 'trailer-key',
            name: 'Trailer',
            site: 'YouTube',
            size: 1080,
            type: 'Trailer',
            official: true,
            published_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    };

    getMock.mockResolvedValueOnce({ data: details });

    const result = await getMovieDetails(1, 'pt-BR');

    expect(result.release_date).toBe('2026-08-20');
    expect(result.content_rating).toBe('16');
  });

  it('keeps TV details usable when content rating fallback request fails', async () => {
    const details: TmdbTvDetails = {
      ...tv(),
      genres: [],
      episode_run_time: [],
      number_of_seasons: 1,
      number_of_episodes: 1,
      tagline: null,
      status: 'Returning Series',
      videos: { id: 1, results: [] },
    };

    getMock
      .mockResolvedValueOnce({ data: details })
      .mockResolvedValueOnce({
        data: { poster_path: '/poster-pt.jpg', backdrop_path: '/backdrop-pt.jpg' },
      })
      .mockRejectedValueOnce(new Error('ratings unavailable'));

    const result = await getTvDetails(1, 'en-US');

    expect(getMock).toHaveBeenNthCalledWith(3, '/tv/1/content_ratings');
    expect(result.content_rating).toBeUndefined();
    expect(result.poster_path).toBe('/poster-pt.jpg');
  });
});
