import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryStaleTime } from '@/config/queryClient';
import { useI18n } from '@/contexts/i18n/useI18n';
import { getCredits, getSeasonEpisodes, getSimilar } from '@/lib/tmdb/endpoints';
import { useMediaDetails } from '@/hooks/useMediaDetails';
import { getAlternateLanguage } from '@/contexts/i18n/translations';
import type { MediaType } from '@/types/tmdb';

/**
 * Hooks da tela de detalhes.
 *
 * São três queries independentes (detalhe, créditos, similares). Deixá-las
 * separadas, em vez de um único request com `append_to_response`. faz cada
 * bloco da tela carregar e revalidar no seu ritmo, e cada uma pode falhar sem
 * derrubar as outras. `enabled: id > 0` protege contra um id inválido na URL.
 */

export const useDetails = useMediaDetails;

export function useCredits(mediaType: MediaType, id: number) {
  // Sem idioma aqui de propósito: nomes de pessoas vêm sempre do idioma-base
  return useQuery({
    queryKey: queryKeys.credits(mediaType, id),
    queryFn: () => getCredits(mediaType, id),
    enabled: id > 0,
    staleTime: queryStaleTime.credits,
  });
}

export function useSimilar(mediaType: MediaType, id: number) {
  const { language } = useI18n();
  return useQuery({
    queryKey: queryKeys.similar(mediaType, id, language),
    queryFn: () => getSimilar(mediaType, id, language),
    enabled: id > 0,
    staleTime: queryStaleTime.similar,
  });
}

/** Episódios da temporada selecionada. `seasonNumber` null desabilita a query. */
export function useSeasonEpisodes(tvId: number, seasonNumber: number | null) {
  const { language } = useI18n();
  return useQuery({
    queryKey: queryKeys.season(tvId, seasonNumber ?? 0, language),
    queryFn: () => getSeasonEpisodes(tvId, seasonNumber ?? 0, language),
    enabled: tvId > 0 && seasonNumber !== null,
    staleTime: queryStaleTime.details,
  });
}

export function useWarmAlternateLanguageSeasonEpisodes(
  tvId: number,
  seasonNumber: number | null,
) {
  const queryClient = useQueryClient();
  const { language } = useI18n();

  useEffect(() => {
    if (tvId <= 0 || seasonNumber === null) return;

    const alternateLanguage = getAlternateLanguage(language);
    void queryClient.prefetchQuery({
      queryKey: queryKeys.season(tvId, seasonNumber, alternateLanguage),
      queryFn: () => getSeasonEpisodes(tvId, seasonNumber, alternateLanguage),
      staleTime: queryStaleTime.details,
    });
  }, [language, queryClient, seasonNumber, tvId]);
}

export function useWarmAlternateLanguageSimilar(
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
      queryKey: queryKeys.similar(mediaType, id, alternateLanguage),
      queryFn: () => getSimilar(mediaType, id, alternateLanguage),
      staleTime: queryStaleTime.similar,
    });
  }, [enabled, id, language, mediaType, queryClient]);
}
