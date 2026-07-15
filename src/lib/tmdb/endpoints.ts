import { tmdbClient } from './client';
import type {
  Credits,
  Genre,
  GenreListResponse,
  MediaItem,
  MediaType,
  MovieReleaseDatesResponse,
  Paginated,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbTv,
  TmdbTvDetails,
  TmdbVideo,
  TmdbVideosResponse,
  TvContentRatingsResponse,
} from '@/types/tmdb';

/**
 * Camada de acesso a TMDB.
 *
 * aqui apenas fazemos a request e normalizamos
 * sem cache ou estado pois isto eh funcao do React Query
 */

// Idioma no formato que a TMDB espera (ISO 639-1 + regiao).
export type TmdbLanguage = 'en-US' | 'pt-BR';

/**
 * Idioma de REFERENCIA: a fonte da verdade para tudo que deve ser estavel ao
 * trocar de idioma: ordem da lista, quais itens aparecem e a arte dos posteres.
 *
 * A regra entao e: a resposta em `BASE_LANGUAGE` define ordem + membros +
 * imagens;
 * a resposta no idioma do usuario serve so pra sobrepor o TEXTO
 * (titulo/sinopse), casando por id. Ver `fetchMediaList` e `overrideImages`.
 */
const BASE_LANGUAGE: TmdbLanguage = 'pt-BR';
const PERSON_LANGUAGE: TmdbLanguage = 'en-US';
const DEFAULT_REGION = 'BR';
const CONTENT_RATING_FALLBACK_REGION = 'US';
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
const MOVIE_RELEASE_TYPE_PRIORITY = [3, 2, 1, 4, 5, 6];
const VIDEO_FALLBACK_LANGUAGE: TmdbLanguage = 'en-US';

/**
 * Opcoes de ordenacao expostas na tela de catalogo.
 *
 * Ordenamos no servidor (via /discover) e nao no cliente.
 */
export type SortOption = 'popularity' | 'rating' | 'alphabetical';
export type TrendingWindow = 'day' | 'week';

export type CatalogCollection =
  | 'trending'
  | 'popular'
  | 'top_rated'
  | 'now_playing'
  | 'upcoming'
  | 'airing_today'
  | 'on_the_air';

export interface GenreOption {
  id: number;
  key: 'action' | 'comedy' | 'drama' | 'horror' | 'sciFi' | 'animation' | 'crime';
}

export const HOME_GENRES: Record<MediaType, GenreOption[]> = {
  movie: [
    { id: 28, key: 'action' },
    { id: 35, key: 'comedy' },
    { id: 18, key: 'drama' },
    { id: 27, key: 'horror' },
    { id: 878, key: 'sciFi' },
    { id: 16, key: 'animation' },
  ],
  tv: [
    { id: 10759, key: 'action' },
    { id: 35, key: 'comedy' },
    { id: 18, key: 'drama' },
    { id: 10765, key: 'sciFi' },
    { id: 16, key: 'animation' },
    { id: 80, key: 'crime' },
  ],
};

export async function getGenres(
  mediaType: MediaType,
  language: TmdbLanguage,
): Promise<Genre[]> {
  const genreType = mediaType === 'movie' ? 'movie' : 'tv';
  const { data } = await tmdbClient.get<GenreListResponse>(`/genre/${genreType}/list`, {
    params: { language },
  });
  return data.genres;
}

const SORT_BY_MAP: Record<SortOption, string> = {
  popularity: 'popularity.desc',
  rating: 'vote_average.desc',
  alphabetical: 'title.asc',
};

function movieRegionParams(
  mediaType: MediaType,
  collection?: CatalogCollection,
): Record<string, string> {
  return mediaType === 'movie' && collection !== 'trending'
    ? { region: DEFAULT_REGION }
    : {};
}

function tvTimezoneParams(
  mediaType: MediaType,
  collection?: CatalogCollection,
): Record<string, string> {
  return mediaType === 'tv' &&
    (collection === 'airing_today' || collection === 'on_the_air')
    ? { timezone: DEFAULT_TIMEZONE }
    : {};
}

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

function normalize(mediaType: MediaType, raw: TmdbMovie | TmdbTv): MediaItem {
  return mediaType === 'movie'
    ? normalizeMovie(raw as TmdbMovie)
    : normalizeTv(raw as TmdbTv);
}

function normalizeReleaseDate(releaseDate: string): string | null {
  const dateOnly = releaseDate.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null;
}

function pickRegionalMovieReleaseDate(
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

function pickRegionalMovieContentRating(
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

function pickRegionalTvContentRating(
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

type RawItem = TmdbMovie | TmdbTv;

async function fetchMediaTextFallback(
  mediaType: MediaType,
  id: number,
  language: TmdbLanguage,
): Promise<Pick<MediaItem, 'title' | 'overview'> | null> {
  try {
    const path = mediaType === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const { data } = await tmdbClient.get<RawItem>(path, {
      params: { language },
    });
    const item = normalize(mediaType, data);
    return { title: item.title, overview: item.overview };
  } catch {
    return null;
  }
}

async function fetchMediaList(
  path: string,
  mediaType: MediaType,
  language: TmdbLanguage,
  extraParams: Record<string, string | number | boolean> = {},
): Promise<Paginated<MediaItem>> {
  const regionalParams =
    mediaType === 'movie' && !path.startsWith('/trending/')
      ? { region: DEFAULT_REGION }
      : {};

  const baseRequest = tmdbClient.get<Paginated<RawItem>>(path, {
    params: { language: BASE_LANGUAGE, ...regionalParams, ...extraParams },
  });

  const needsTranslation = language !== BASE_LANGUAGE;
  const localizedRequest = needsTranslation
    ? tmdbClient.get<Paginated<RawItem>>(path, {
        params: { language, ...regionalParams, ...extraParams },
      })
    : null;

  const [base, localized] = await Promise.all([baseRequest, localizedRequest]);

  const translations = localized
    ? new Map(
        localized.data.results.map((raw) => [raw.id, normalize(mediaType, raw)]),
      )
    : null;

  const missingTranslationIds: number[] = [];
  const results = base.data.results.map((raw) => {
    const item = normalize(mediaType, raw);
    const translated = translations?.get(item.id);
    if (translated) {
      item.title = translated.title;
      item.overview = translated.overview;
    } else if (needsTranslation) {
      missingTranslationIds.push(item.id);
    }
    return item;
  });

  if (missingTranslationIds.length > 0) {
    const fallbackTexts = await Promise.all(
      missingTranslationIds.map((id) =>
        fetchMediaTextFallback(mediaType, id, language),
      ),
    );
    const fallbackTextById = new Map(
      fallbackTexts
        .map((text, index) => [missingTranslationIds[index], text] as const)
        .filter(
          (entry): entry is readonly [
            number,
            Pick<MediaItem, 'title' | 'overview'>,
          ] => Boolean(entry[1]),
        ),
    );

    for (const item of results) {
      const fallbackText = fallbackTextById.get(item.id);
      if (!fallbackText) continue;
      item.title = fallbackText.title;
      item.overview = fallbackText.overview;
    }
  }

  return { ...base.data, results };
}

interface ListParams {
  mediaType: MediaType;
  language: TmdbLanguage;
  page?: number;
}

export function getTrending({
  mediaType,
  language,
  page = 1,
  timeWindow = 'week',
}: ListParams & { timeWindow?: TrendingWindow }): Promise<Paginated<MediaItem>> {
  return fetchMediaList(`/trending/${mediaType}/${timeWindow}`, mediaType, language, {
    page,
  });
}

export function getPopular({
  mediaType,
  language,
  page = 1,
}: ListParams): Promise<Paginated<MediaItem>> {
  return fetchMediaList(`/${mediaType}/popular`, mediaType, language, {
    page,
    ...movieRegionParams(mediaType),
  });
}

export function getTopRated({
  mediaType,
  language,
  page = 1,
}: ListParams): Promise<Paginated<MediaItem>> {
  return fetchMediaList(`/${mediaType}/top_rated`, mediaType, language, {
    page,
    ...movieRegionParams(mediaType),
  });
}

export function getMediaCollection({
  mediaType,
  language,
  page = 1,
  collection,
}: ListParams & { collection: CatalogCollection }): Promise<Paginated<MediaItem>> {
  const pathByCollection: Partial<Record<CatalogCollection, string>> = {
    trending: `/trending/${mediaType}/week`,
    popular: `/${mediaType}/popular`,
    top_rated: `/${mediaType}/top_rated`,
    now_playing: mediaType === 'movie' ? '/movie/now_playing' : undefined,
    upcoming: mediaType === 'movie' ? '/movie/upcoming' : undefined,
    airing_today: mediaType === 'tv' ? '/tv/airing_today' : undefined,
    on_the_air: mediaType === 'tv' ? '/tv/on_the_air' : undefined,
  };

  const path = pathByCollection[collection];
  if (!path) {
    throw new Error(`Collection "${collection}" is not available for ${mediaType}.`);
  }

  return fetchMediaList(path, mediaType, language, {
    page,
    ...movieRegionParams(mediaType, collection),
    ...tvTimezoneParams(mediaType, collection),
  });
}

interface DiscoverParams extends ListParams {
  sort: SortOption;
  genreId?: number;
  collection?: CatalogCollection;
}

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function discoverParamsForCollection(
  mediaType: MediaType,
  collection: CatalogCollection | undefined,
): Record<string, string | number | boolean> {
  if (!collection || collection === 'popular') return {};

  if (collection === 'top_rated') {
    return {
      'vote_count.gte': 200,
      ...(mediaType === 'movie' ? { without_genres: '99,10755' } : {}),
    };
  }

  if (mediaType === 'movie') {
    if (collection === 'now_playing') {
      return {
        'release_date.gte': isoDateOffset(-30),
        'release_date.lte': isoDateOffset(14),
        with_release_type: '2|3',
        region: DEFAULT_REGION,
      };
    }

    if (collection === 'upcoming') {
      return {
        'release_date.gte': isoDateOffset(1),
        'release_date.lte': isoDateOffset(90),
        with_release_type: '2|3',
        region: DEFAULT_REGION,
      };
    }
  }

  if (mediaType === 'tv') {
    if (collection === 'airing_today') {
      const today = isoDateOffset(0);
      return {
        'air_date.gte': today,
        'air_date.lte': today,
        timezone: DEFAULT_TIMEZONE,
      };
    }

    if (collection === 'on_the_air') {
      return {
        'air_date.gte': isoDateOffset(0),
        'air_date.lte': isoDateOffset(7),
        timezone: DEFAULT_TIMEZONE,
      };
    }
  }

  return {};
}

export function discoverMedia({
  mediaType,
  language,
  page = 1,
  sort,
  genreId,
  collection,
}: DiscoverParams): Promise<Paginated<MediaItem>> {
  const sortBy =
    sort === 'alphabetical' && mediaType === 'tv'
      ? 'name.asc'
      : SORT_BY_MAP[sort];

  return fetchMediaList(`/discover/${mediaType}`, mediaType, language, {
    page,
    sort_by: sortBy,
    'vote_count.gte': sort === 'rating' ? 200 : 0,
    ...discoverParamsForCollection(mediaType, collection),
    ...(genreId ? { with_genres: genreId } : {}),
    include_adult: false,
    ...(mediaType === 'movie' ? { include_video: false, region: DEFAULT_REGION } : {}),
  });
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

export async function getCredits(mediaType: MediaType, id: number): Promise<Credits> {
  const { data } = await tmdbClient.get<Credits>(`/${mediaType}/${id}/credits`, {
    params: { language: PERSON_LANGUAGE },
  });
  return data;
}

export async function getSimilar(
  mediaType: MediaType,
  id: number,
  language: TmdbLanguage,
): Promise<MediaItem[]> {
  const { results } = await fetchMediaList(
    `/${mediaType}/${id}/similar`,
    mediaType,
    language,
  );
  return results;
}
