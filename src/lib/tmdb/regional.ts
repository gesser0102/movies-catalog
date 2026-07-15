import {
  CONTENT_RATING_FALLBACK_REGION,
  DEFAULT_REGION,
  DEFAULT_TIMEZONE,
  MOVIE_RELEASE_TYPE_PRIORITY,
} from './constants';
import type { CatalogCollection } from './types';
import type {
  MediaType,
  MovieReleaseDatesResponse,
  TvContentRatingsResponse,
} from '@/types/tmdb';

export function movieRegionParams(
  mediaType: MediaType,
  collection?: CatalogCollection,
): Record<string, string> {
  return mediaType === 'movie' && collection !== 'trending'
    ? { region: DEFAULT_REGION }
    : {};
}

export function tvTimezoneParams(
  mediaType: MediaType,
  collection?: CatalogCollection,
): Record<string, string> {
  return mediaType === 'tv' &&
    (collection === 'airing_today' || collection === 'on_the_air')
    ? { timezone: DEFAULT_TIMEZONE }
    : {};
}

function normalizeReleaseDate(releaseDate: string): string | null {
  const dateOnly = releaseDate.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null;
}

export function pickRegionalMovieReleaseDate(
  response: MovieReleaseDatesResponse,
): string | null {
  const country = response.results.find(
    (entry) => entry.iso_3166_1 === DEFAULT_REGION,
  );
  if (!country) return null;

  const validDates = country.release_dates
    .map((release) => ({
      date: normalizeReleaseDate(release.release_date),
      type: release.type,
    }))
    .filter((release): release is { date: string; type: number } =>
      Boolean(release.date),
    );

  for (const type of MOVIE_RELEASE_TYPE_PRIORITY) {
    const candidates = validDates
      .filter((release) => release.type === type)
      .map((release) => release.date)
      .sort();
    if (candidates[0]) return candidates[0];
  }

  return validDates.map((release) => release.date).sort()[0] ?? null;
}

function normalizeContentRating(rating: string | undefined): string | null {
  const normalized = rating?.trim().toUpperCase();
  return normalized ? normalized : null;
}

export function pickRegionalMovieContentRating(
  response: MovieReleaseDatesResponse,
): string | null {
  const countries = [
    response.results.find((entry) => entry.iso_3166_1 === DEFAULT_REGION),
    response.results.find(
      (entry) => entry.iso_3166_1 === CONTENT_RATING_FALLBACK_REGION,
    ),
    ...response.results,
  ].filter(
    (country): country is MovieReleaseDatesResponse['results'][number] =>
      Boolean(country),
  );

  for (const country of countries) {
    for (const type of MOVIE_RELEASE_TYPE_PRIORITY) {
      const rating = country.release_dates.find(
        (release) => release.type === type && release.certification.trim(),
      )?.certification;
      const normalized = normalizeContentRating(rating);
      if (normalized) return normalized;
    }

    const fallback = normalizeContentRating(
      country.release_dates.find((release) => release.certification.trim())
        ?.certification,
    );
    if (fallback) return fallback;
  }

  return null;
}

export function pickRegionalTvContentRating(
  response: TvContentRatingsResponse,
): string | null {
  const ratings = [
    response.results.find((entry) => entry.iso_3166_1 === DEFAULT_REGION)?.rating,
    response.results.find(
      (entry) => entry.iso_3166_1 === CONTENT_RATING_FALLBACK_REGION,
    )?.rating,
    response.results.find((entry) => entry.rating.trim())?.rating,
  ];

  for (const rating of ratings) {
    const normalized = normalizeContentRating(rating);
    if (normalized) return normalized;
  }

  return null;
}
