import { tmdbClient } from './client';
import { BASE_LANGUAGE, VIDEO_FALLBACK_LANGUAGE } from './constants';
import {
  pickRegionalMovieContentRating,
  pickRegionalMovieReleaseDate,
  pickRegionalTvContentRating,
} from './regional';
import type { TmdbLanguage } from './types';
import type {
  MediaType,
  MovieReleaseDatesResponse,
  TmdbMovieDetails,
  TmdbTvDetails,
  TmdbVideo,
  TmdbVideosResponse,
  TvContentRatingsResponse,
} from '@/types/tmdb';

function pickBestTrailer(videos: TmdbVideo[]): TmdbVideo | null {
  const trailers = videos
    .filter(
      (video) =>
        video.site.toLowerCase() === 'youtube' &&
        video.type.toLowerCase() === 'trailer' &&
        video.key,
    )
    .sort((a, b) => {
      if (a.official !== b.official) return a.official ? -1 : 1;
      return b.published_at.localeCompare(a.published_at);
    });

  return trailers[0] ?? null;
}

async function overrideImages<
  T extends { id: number; poster_path: string | null; backdrop_path: string | null },
>(
  detail: T,
  mediaType: MediaType,
  language: TmdbLanguage,
): Promise<T> {
  if (language === BASE_LANGUAGE) return detail;

  const { data } = await tmdbClient.get<{
    poster_path: string | null;
    backdrop_path: string | null;
  }>(`/${mediaType}/${detail.id}`, {
    params: { language: BASE_LANGUAGE },
  });
  return { ...detail, poster_path: data.poster_path, backdrop_path: data.backdrop_path };
}

async function withRegionalMovieReleaseDate(
  detail: TmdbMovieDetails,
): Promise<TmdbMovieDetails> {
  try {
    const data =
      detail.release_dates ??
      (
        await tmdbClient.get<MovieReleaseDatesResponse>(
          `/movie/${detail.id}/release_dates`,
        )
      ).data;
    const releaseDate = pickRegionalMovieReleaseDate(data);
    const contentRating = pickRegionalMovieContentRating(data);
    return {
      ...detail,
      ...(releaseDate ? { release_date: releaseDate } : {}),
      content_rating: contentRating,
    };
  } catch {
    return detail;
  }
}

async function withRegionalTvContentRating(
  detail: TmdbTvDetails,
): Promise<TmdbTvDetails> {
  try {
    const data =
      detail.content_ratings ??
      (
        await tmdbClient.get<TvContentRatingsResponse>(
          `/tv/${detail.id}/content_ratings`,
        )
      ).data;
    return { ...detail, content_rating: pickRegionalTvContentRating(data) };
  } catch {
    return detail;
  }
}

async function withTrailer<T extends TmdbMovieDetails | TmdbTvDetails>(
  detail: T,
  mediaType: MediaType,
  language: TmdbLanguage,
): Promise<T> {
  const trailer = detail.videos ? pickBestTrailer(detail.videos.results) : null;
  if (trailer || language === VIDEO_FALLBACK_LANGUAGE) {
    return { ...detail, trailer };
  }

  try {
    const { data } = await tmdbClient.get<TmdbVideosResponse>(
      `/${mediaType}/${detail.id}/videos`,
      { params: { language: VIDEO_FALLBACK_LANGUAGE } },
    );
    return { ...detail, trailer: pickBestTrailer(data.results) };
  } catch {
    return { ...detail, trailer: null };
  }
}

function stripAppendedDetailFields<T extends TmdbMovieDetails | TmdbTvDetails>(
  detail: T,
): T {
  const { videos, release_dates, content_ratings, ...rest } = detail as T & {
    release_dates?: unknown;
    content_ratings?: unknown;
  };
  return rest as T;
}

export async function getMovieDetails(
  id: number,
  language: TmdbLanguage,
): Promise<TmdbMovieDetails> {
  const { data } = await tmdbClient.get<TmdbMovieDetails>(`/movie/${id}`, {
    params: { language, append_to_response: 'release_dates,videos' },
  });
  const detail = await withTrailer(data, 'movie', language);
  const detailWithImages = await overrideImages(detail, 'movie', language);
  return stripAppendedDetailFields(await withRegionalMovieReleaseDate(detailWithImages));
}

export async function getTvDetails(
  id: number,
  language: TmdbLanguage,
): Promise<TmdbTvDetails> {
  const { data } = await tmdbClient.get<TmdbTvDetails>(`/tv/${id}`, {
    params: { language, append_to_response: 'content_ratings,videos' },
  });
  const detail = await withTrailer(data, 'tv', language);
  const detailWithImages = await overrideImages(detail, 'tv', language);
  return stripAppendedDetailFields(await withRegionalTvContentRating(detailWithImages));
}
