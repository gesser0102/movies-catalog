import { tmdbClient } from './client';
import type { TmdbLanguage } from './types';
import type { Genre, GenreListResponse, MediaType } from '@/types/tmdb';

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
