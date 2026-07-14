import { env } from '@/config/env';

// Monta URLs de imagem da TMDB.

export type PosterSize = 'w185' | 'w342' | 'w500' | 'original';
export type BackdropSize = 'w780' | 'w1280' | 'original';
export type ProfileSize = 'w185' | 'h632' | 'original';

function build(path: string | null, size: string): string | null {
  if (!path) return null;
  return `${env.tmdb.imageBaseUrl}/${size}${path}`;
}

export const posterUrl = (path: string | null, size: PosterSize = 'w342') =>
  build(path, size);

export const backdropUrl = (path: string | null, size: BackdropSize = 'w1280') =>
  build(path, size);

export const profileUrl = (path: string | null, size: ProfileSize = 'w185') =>
  build(path, size);
