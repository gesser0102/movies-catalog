import type { MediaItem, MediaType, TmdbMovie, TmdbTv } from '@/types/tmdb';

export type RawMediaItem = TmdbMovie | TmdbTv;

function yearFromDate(date: string | undefined): number | null {
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

function normalizeMovie(movie: TmdbMovie): MediaItem {
  return {
    id: movie.id,
    mediaType: 'movie',
    title: movie.title,
    overview: movie.overview,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    rating: movie.vote_average,
    popularity: movie.popularity,
    year: yearFromDate(movie.release_date),
  };
}

function normalizeTv(tv: TmdbTv): MediaItem {
  return {
    id: tv.id,
    mediaType: 'tv',
    title: tv.name,
    overview: tv.overview,
    posterPath: tv.poster_path,
    backdropPath: tv.backdrop_path,
    rating: tv.vote_average,
    popularity: tv.popularity,
    year: yearFromDate(tv.first_air_date),
  };
}

export function normalize(mediaType: MediaType, raw: RawMediaItem): MediaItem {
  return mediaType === 'movie'
    ? normalizeMovie(raw as TmdbMovie)
    : normalizeTv(raw as TmdbTv);
}
