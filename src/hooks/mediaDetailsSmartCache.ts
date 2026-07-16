import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryClient';
import type { Language } from '@/contexts/i18n/translations';
import type {
  Genre,
  MediaType,
  TmdbMovieDetails,
  TmdbSeasonSummary,
  TmdbTvDetails,
  TmdbVideo,
} from '@/types/tmdb';

type MediaDetails = TmdbMovieDetails | TmdbTvDetails;

type SeasonStable = Omit<TmdbSeasonSummary, 'name' | 'overview'>;

interface SeasonText {
  season_number: number;
  name: string;
  overview: string;
}

interface SharedStableDetails {
  id: number;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  popularity: number;
  genre_ids: number[];
  status: string;
  content_rating?: string | null;
  trailer?: TmdbVideo | null;
}

interface MovieStableDetails extends SharedStableDetails {
  mediaType: 'movie';
  original_title: string;
  release_date: string;
  runtime: number | null;
}

interface TvStableDetails extends SharedStableDetails {
  mediaType: 'tv';
  original_name: string;
  first_air_date: string;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  seasons?: SeasonStable[];
}

type StableDetails = MovieStableDetails | TvStableDetails;

interface MovieTextDetails {
  mediaType: 'movie';
  title: string;
  overview: string;
  tagline: string | null;
  genres: Genre[];
}

interface TvTextDetails {
  mediaType: 'tv';
  name: string;
  overview: string;
  tagline: string | null;
  genres: Genre[];
  seasonTexts?: SeasonText[];
}

type TextDetails = MovieTextDetails | TvTextDetails;

function isMovieDetails(
  mediaType: MediaType,
  detail: MediaDetails,
): detail is TmdbMovieDetails {
  return mediaType === 'movie' && 'title' in detail;
}

function toStableDetails(mediaType: MediaType, detail: MediaDetails): StableDetails {
  const shared = {
    id: detail.id,
    poster_path: detail.poster_path,
    backdrop_path: detail.backdrop_path,
    vote_average: detail.vote_average,
    popularity: detail.popularity,
    genre_ids: detail.genre_ids,
    status: detail.status,
    content_rating: detail.content_rating,
    trailer: detail.trailer,
  };

  if (isMovieDetails(mediaType, detail)) {
    return {
      ...shared,
      mediaType: 'movie',
      original_title: detail.original_title,
      release_date: detail.release_date,
      runtime: detail.runtime,
    };
  }

  const tv = detail as TmdbTvDetails;
  return {
    ...shared,
    mediaType: 'tv',
    original_name: tv.original_name,
    first_air_date: tv.first_air_date,
    episode_run_time: tv.episode_run_time,
    number_of_seasons: tv.number_of_seasons,
    number_of_episodes: tv.number_of_episodes,
    seasons: tv.seasons?.map(({ name, overview, ...stable }) => stable),
  };
}

function toTextDetails(mediaType: MediaType, detail: MediaDetails): TextDetails {
  if (isMovieDetails(mediaType, detail)) {
    return {
      mediaType: 'movie',
      title: detail.title,
      overview: detail.overview,
      tagline: detail.tagline,
      genres: detail.genres,
    };
  }

  const tv = detail as TmdbTvDetails;
  return {
    mediaType: 'tv',
    name: tv.name,
    overview: tv.overview,
    tagline: tv.tagline,
    genres: tv.genres,
    seasonTexts: tv.seasons?.map((season) => ({
      season_number: season.season_number,
      name: season.name,
      overview: season.overview,
    })),
  };
}

function mergeDetails(base: StableDetails, text: TextDetails): MediaDetails | undefined {
  if (base.mediaType !== text.mediaType) return undefined;

  if (base.mediaType === 'movie' && text.mediaType === 'movie') {
    return {
      id: base.id,
      title: text.title,
      original_title: base.original_title,
      overview: text.overview,
      poster_path: base.poster_path,
      backdrop_path: base.backdrop_path,
      vote_average: base.vote_average,
      popularity: base.popularity,
      release_date: base.release_date,
      genre_ids: base.genre_ids,
      genres: text.genres,
      runtime: base.runtime,
      tagline: text.tagline,
      status: base.status,
      content_rating: base.content_rating,
      trailer: base.trailer,
    };
  }

  if (base.mediaType === 'tv' && text.mediaType === 'tv') {
    const seasonTextByNumber = new Map(
      (text.seasonTexts ?? []).map((season) => [season.season_number, season]),
    );
    const seasons = base.seasons?.map((season) => {
      const seasonText = seasonTextByNumber.get(season.season_number);
      return {
        ...season,
        name: seasonText?.name ?? '',
        overview: seasonText?.overview ?? '',
      };
    });

    return {
      id: base.id,
      name: text.name,
      seasons,
      original_name: base.original_name,
      overview: text.overview,
      poster_path: base.poster_path,
      backdrop_path: base.backdrop_path,
      vote_average: base.vote_average,
      popularity: base.popularity,
      first_air_date: base.first_air_date,
      genre_ids: base.genre_ids,
      genres: text.genres,
      episode_run_time: base.episode_run_time,
      number_of_seasons: base.number_of_seasons,
      number_of_episodes: base.number_of_episodes,
      tagline: text.tagline,
      status: base.status,
      content_rating: base.content_rating,
      trailer: base.trailer,
    };
  }

  return undefined;
}

export function writeMediaDetailsSmartCache(
  queryClient: QueryClient,
  mediaType: MediaType,
  id: number,
  language: Language,
  detail: MediaDetails,
) {
  queryClient.setQueryData(
    queryKeys.detailsBase(mediaType, id),
    toStableDetails(mediaType, detail),
  );
  queryClient.setQueryData(
    queryKeys.detailsText(mediaType, id, language),
    toTextDetails(mediaType, detail),
  );
}

export function readMediaDetailsSmartCache(
  queryClient: QueryClient,
  mediaType: MediaType,
  id: number,
  language: Language,
): MediaDetails | undefined {
  const base = queryClient.getQueryData<StableDetails>(
    queryKeys.detailsBase(mediaType, id),
  );
  const text = queryClient.getQueryData<TextDetails>(
    queryKeys.detailsText(mediaType, id, language),
  );

  if (!base || !text) return undefined;
  return mergeDetails(base, text);
}

export function readMediaDetailsSmartCacheUpdatedAt(
  queryClient: QueryClient,
  mediaType: MediaType,
  id: number,
  language: Language,
): number | undefined {
  const baseUpdatedAt = queryClient.getQueryState(
    queryKeys.detailsBase(mediaType, id),
  )?.dataUpdatedAt;
  const textUpdatedAt = queryClient.getQueryState(
    queryKeys.detailsText(mediaType, id, language),
  )?.dataUpdatedAt;

  if (!baseUpdatedAt || !textUpdatedAt) return undefined;
  return Math.min(baseUpdatedAt, textUpdatedAt);
}
