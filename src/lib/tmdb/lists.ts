import { tmdbClient } from './client';
import { BASE_LANGUAGE, DEFAULT_REGION, DEFAULT_TIMEZONE } from './constants';
import { normalize, type RawMediaItem } from './normalizers';
import { movieRegionParams, tvTimezoneParams } from './regional';
import type {
  CatalogCollection,
  SortOption,
  TmdbLanguage,
  TrendingWindow,
} from './types';
import type { MediaItem, MediaType, Paginated } from '@/types/tmdb';

const SORT_BY_MAP: Record<SortOption, string> = {
  popularity: 'popularity.desc',
  rating: 'vote_average.desc',
  alphabetical: 'title.asc',
};

interface ListParams {
  mediaType: MediaType;
  language: TmdbLanguage;
  page?: number;
}

async function fetchMediaTextFallback(
  mediaType: MediaType,
  id: number,
  language: TmdbLanguage,
): Promise<Pick<MediaItem, 'title' | 'overview'> | null> {
  try {
    const path = mediaType === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const { data } = await tmdbClient.get<RawMediaItem>(path, {
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

  const baseRequest = tmdbClient.get<Paginated<RawMediaItem>>(path, {
    params: { language: BASE_LANGUAGE, ...regionalParams, ...extraParams },
  });

  const needsTranslation = language !== BASE_LANGUAGE;
  const localizedRequest = needsTranslation
    ? tmdbClient.get<Paginated<RawMediaItem>>(path, {
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
