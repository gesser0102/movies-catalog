export type TmdbLanguage = 'en-US' | 'pt-BR';

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
