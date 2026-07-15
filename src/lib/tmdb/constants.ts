import type { MediaType } from '@/types/tmdb';
import type { GenreOption, TmdbLanguage } from './types';

export const BASE_LANGUAGE: TmdbLanguage = 'pt-BR';
export const PERSON_LANGUAGE: TmdbLanguage = 'en-US';
export const DEFAULT_REGION = 'BR';
export const CONTENT_RATING_FALLBACK_REGION = 'US';
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
export const MOVIE_RELEASE_TYPE_PRIORITY = [3, 2, 1, 4, 5, 6];
export const VIDEO_FALLBACK_LANGUAGE: TmdbLanguage = 'en-US';

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
