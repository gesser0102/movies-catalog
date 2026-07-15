import { tmdbClient } from './client';
import { PERSON_LANGUAGE } from './constants';
import type { Credits, MediaType } from '@/types/tmdb';

export async function getCredits(mediaType: MediaType, id: number): Promise<Credits> {
  const { data } = await tmdbClient.get<Credits>(`/${mediaType}/${id}/credits`, {
    params: { language: PERSON_LANGUAGE },
  });
  return data;
}
