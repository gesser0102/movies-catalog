import { tmdbClient } from './client';
import type { TmdbLanguage } from './types';
import type { TmdbEpisode, TmdbSeasonDetails } from '@/types/tmdb';

/**
 * Episódios de uma temporada (/tv/{id}/season/{n}).
 *
 * Uma request só, no idioma ativo: a UI trata sinopse ausente como
 * "não expansível", então não há fallback de tradução aqui.
 */
export async function getSeasonEpisodes(
  tvId: number,
  seasonNumber: number,
  language: TmdbLanguage,
): Promise<TmdbEpisode[]> {
  const { data } = await tmdbClient.get<TmdbSeasonDetails>(
    `/tv/${tvId}/season/${seasonNumber}`,
    { params: { language } },
  );
  return data.episodes;
}
