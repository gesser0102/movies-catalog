import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys, queryStaleTime } from '@/config/queryClient';
import { useI18n } from '@/contexts/i18n/useI18n';
import { getMovieDetails, getTvDetails } from '@/lib/tmdb/endpoints';
import {
  readMediaDetailsSmartCache,
  writeMediaDetailsSmartCache,
} from './mediaDetailsSmartCache';
import type { Language } from '@/contexts/i18n/translations';
import type { MediaType, TmdbMovieDetails, TmdbTvDetails } from '@/types/tmdb';

/** Constrói a queryFn de detalhes conforme o tipo de mídia. */
function detailsQueryFn(
  mediaType: MediaType,
  id: number,
  language: Language,
  queryClient: QueryClient,
): () => Promise<TmdbMovieDetails | TmdbTvDetails> {
  return async () => {
    const detail =
      mediaType === 'movie'
        ? await getMovieDetails(id, language)
        : await getTvDetails(id, language);

    writeMediaDetailsSmartCache(queryClient, mediaType, id, language, detail);
    return detail;
  };
}

function getAlternateLanguage(language: Language): Language {
  return language === 'pt-BR' ? 'en-US' : 'pt-BR';
}

/**
 * Hook compartilhado de detalhes de um título.
 *
 * Fica em hooks/ (e não dentro de features/details) porque é usado tanto pela
 * página de detalhes quanto pelo hover preview dos cards. O ponto-chave é que
 * ambos usam a MESMA query key (queryKeys.details): ao passar o mouse num card,
 * já pré-carregamos os detalhes, e quando o usuário clica pra abrir a tela cheia
 * o dado já está cacheado.
 */
export function useMediaDetails(mediaType: MediaType, id: number, enabled = true) {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  return useQuery<TmdbMovieDetails | TmdbTvDetails>({
    queryKey: queryKeys.details(mediaType, id, language),
    queryFn: detailsQueryFn(mediaType, id, language, queryClient),
    enabled: enabled && id > 0,
    staleTime: queryStaleTime.details,
    placeholderData: () =>
      readMediaDetailsSmartCache(queryClient, mediaType, id, language),
  });
}

export function useWarmAlternateLanguageMediaDetails(
  mediaType: MediaType,
  id: number,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const { language } = useI18n();

  useEffect(() => {
    if (!enabled || id <= 0) return;

    const alternateLanguage = getAlternateLanguage(language);
    void queryClient.prefetchQuery({
      queryKey: queryKeys.details(mediaType, id, alternateLanguage),
      queryFn: detailsQueryFn(mediaType, id, alternateLanguage, queryClient),
      staleTime: queryStaleTime.details,
    });
  }, [enabled, id, language, mediaType, queryClient]);
}

/**
 * Devolve uma função pra pré-carregar os detalhes de um título.
 *
 * Usado no hover do card: disparamos o fetch ANTES de o preview abrir, então
 * quando ele monta os gêneros/duração já estão no cache e renderizam.
 */
export function usePrefetchMediaDetails() {
  const queryClient = useQueryClient();
  const { language } = useI18n();

  return useCallback(
    (mediaType: MediaType, id: number) => {
      if (id <= 0) return;
      queryClient.prefetchQuery({
        queryKey: queryKeys.details(mediaType, id, language),
        queryFn: detailsQueryFn(mediaType, id, language, queryClient),
        staleTime: queryStaleTime.details,
      });
    },
    [queryClient, language],
  );
}
