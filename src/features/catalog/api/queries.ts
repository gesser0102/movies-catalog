import { useEffect } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryStaleTime } from '@/config/queryClient';
import { useI18n } from '@/contexts/i18n/useI18n';
import {
  discoverMedia,
  getMediaCollection,
  getPopular,
  getTopRated,
  getTrending,
  HOME_GENRES,
  type CatalogCollection,
  type SortOption,
  type TrendingWindow,
} from '@/lib/tmdb/endpoints';
import type { Language } from '@/contexts/i18n/translations';
import type { MediaType } from '@/types/tmdb';

/**
 * Hooks de dados do catálogo.
 *
 * Encapsular cada endpoint num hook próprio (em vez de chamar useQuery solto nas
 * páginas) tem dois ganhos: a página não precisa saber de query keys nem do
 * idioma atual, e a lógica de cache fica num lugar só. O idioma vem do i18n e
 * entra tanto na key quanto no request — trocar de idioma revalida com o dado
 * traduzido, de forma automática.
 */

const HOME_COLLECTIONS: Record<MediaType, CatalogCollection[]> = {
  movie: ['now_playing', 'upcoming'],
  tv: ['airing_today', 'on_the_air'],
};

const HOME_TRENDING_WINDOWS: TrendingWindow[] = ['day', 'week'];

function getAlternateLanguage(language: Language): Language {
  return language === 'pt-BR' ? 'en-US' : 'pt-BR';
}

export function useWarmAlternateLanguageHomeQueries(mediaType: MediaType) {
  const queryClient = useQueryClient();
  const { language } = useI18n();

  useEffect(() => {
    const alternateLanguage = getAlternateLanguage(language);

    for (const timeWindow of HOME_TRENDING_WINDOWS) {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.trending(mediaType, alternateLanguage, timeWindow),
        queryFn: () => getTrending({ mediaType, language: alternateLanguage, timeWindow }),
        staleTime: queryStaleTime.trending,
      });
    }

    void queryClient.prefetchQuery({
      queryKey: queryKeys.popular(mediaType, alternateLanguage),
      queryFn: () => getPopular({ mediaType, language: alternateLanguage }),
      staleTime: queryStaleTime.catalog,
    });

    void queryClient.prefetchQuery({
      queryKey: queryKeys.topRated(mediaType, alternateLanguage),
      queryFn: () => getTopRated({ mediaType, language: alternateLanguage }),
      staleTime: queryStaleTime.catalog,
    });

    for (const collection of HOME_COLLECTIONS[mediaType]) {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.collection(mediaType, alternateLanguage, collection, 1),
        queryFn: () =>
          getMediaCollection({
            mediaType,
            language: alternateLanguage,
            collection,
            page: 1,
          }),
        staleTime: queryStaleTime.catalog,
      });
    }

    for (const genre of HOME_GENRES[mediaType]) {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.discover(
          mediaType,
          alternateLanguage,
          'popularity',
          1,
          genre.id,
        ),
        queryFn: () =>
          discoverMedia({
            mediaType,
            language: alternateLanguage,
            sort: 'popularity',
            page: 1,
            genreId: genre.id,
          }),
        staleTime: queryStaleTime.catalog,
      });
    }
  }, [language, mediaType, queryClient]);
}

export function useTrending(mediaType: MediaType, timeWindow: TrendingWindow = 'week') {
  const { language } = useI18n();
  return useQuery({
    queryKey: queryKeys.trending(mediaType, language, timeWindow),
    queryFn: () => getTrending({ mediaType, language, timeWindow }),
    staleTime: queryStaleTime.trending,
  });
}

export function usePopular(mediaType: MediaType) {
  const { language } = useI18n();
  return useQuery({
    queryKey: queryKeys.popular(mediaType, language),
    queryFn: () => getPopular({ mediaType, language }),
    staleTime: queryStaleTime.catalog,
  });
}

export function useTopRated(mediaType: MediaType) {
  const { language } = useI18n();
  return useQuery({
    queryKey: queryKeys.topRated(mediaType, language),
    queryFn: () => getTopRated({ mediaType, language }),
    staleTime: queryStaleTime.catalog,
  });
}

export function useCollection(
  mediaType: MediaType,
  collection: CatalogCollection,
  page = 1,
) {
  const { language } = useI18n();
  return useQuery({
    queryKey: queryKeys.collection(mediaType, language, collection, page),
    queryFn: () => getMediaCollection({ mediaType, language, collection, page }),
    staleTime: queryStaleTime.catalog,
    placeholderData: keepPreviousData,
  });
}

/**
 * Catálogo paginado e ordenável.
 *
 * `keepPreviousData` é o detalhe que deixa a paginação suaveao trocar de page.
 * Então cada combinação sort+página tem seu cache.
 */
export function useDiscover(
  mediaType: MediaType,
  sort: SortOption,
  page: number,
  genreId?: number,
  collection?: CatalogCollection,
) {
  const { language } = useI18n();
  return useQuery({
    queryKey: queryKeys.discover(
      mediaType,
      language,
      sort,
      page,
      genreId,
      collection,
    ),
    queryFn: () => discoverMedia({ mediaType, language, sort, page, genreId, collection }),
    staleTime: queryStaleTime.catalog,
    placeholderData: keepPreviousData,
  });
}

interface CatalogListingParams {
  mediaType: MediaType;
  sort: SortOption;
  page: number;
  genreId?: number;
  collection?: CatalogCollection;
}

export function useCatalogListing({
  mediaType,
  sort,
  page,
  genreId,
  collection,
}: CatalogListingParams) {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const directCollection = collection === 'trending' ? collection : undefined;

  const query = useQuery({
    queryKey: directCollection
      ? queryKeys.collection(mediaType, language, directCollection, page)
      : queryKeys.discover(mediaType, language, sort, page, genreId, collection),
    queryFn: () =>
      directCollection
        ? getMediaCollection({ mediaType, language, collection: directCollection, page })
        : discoverMedia({ mediaType, language, sort, page, genreId, collection }),
    staleTime: directCollection ? queryStaleTime.trending : queryStaleTime.catalog,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const alternateLanguage = getAlternateLanguage(language);

    void queryClient.prefetchQuery({
      queryKey: directCollection
        ? queryKeys.collection(mediaType, alternateLanguage, directCollection, page)
        : queryKeys.discover(
            mediaType,
            alternateLanguage,
            sort,
            page,
            genreId,
            collection,
          ),
      queryFn: () =>
        directCollection
          ? getMediaCollection({
              mediaType,
              language: alternateLanguage,
              collection: directCollection,
              page,
            })
          : discoverMedia({
              mediaType,
              language: alternateLanguage,
              sort,
              page,
              genreId,
              collection,
            }),
      staleTime: directCollection ? queryStaleTime.trending : queryStaleTime.catalog,
    });
  }, [
    collection,
    directCollection,
    genreId,
    language,
    mediaType,
    page,
    queryClient,
    sort,
  ]);

  return query;
}
