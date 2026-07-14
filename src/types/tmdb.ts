/**
 * Tipos que espelham as respostas da TMDB API que a aplicação consome.
 *
 * Não mapeio TODOS os campos que a TMDB devolve somente aquelesq ue a UI usa de fato.
 */

export type MediaType = 'movie' | 'tv';

// Envelope de paginação padrão da TMDB. 
export interface Paginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

//Campos crus de um filme na listagem. 
export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  popularity: number;
  release_date: string;
  genre_ids: number[];
}

// Campos crus de uma série na listagem. 
export interface TmdbTv {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  popularity: number;
  first_air_date: string;
  genre_ids: number[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TmdbVideosResponse {
  id: number;
  results: TmdbVideo[];
}

// Detalhe de filme (endpoint /movie/{id}).
export interface TmdbMovieDetails extends TmdbMovie {
  genres: Genre[];
  runtime: number | null;
  tagline: string | null;
  status: string;
  content_rating?: string | null;
  trailer?: TmdbVideo | null;
  release_dates?: MovieReleaseDatesResponse;
  videos?: TmdbVideosResponse;
}

export interface MovieReleaseDateEntry {
  certification: string;
  descriptors?: string[];
  iso_639_1: string;
  note: string;
  release_date: string;
  type: number;
}

export interface MovieReleaseDatesByCountry {
  iso_3166_1: string;
  release_dates: MovieReleaseDateEntry[];
}

export interface MovieReleaseDatesResponse {
  id: number;
  results: MovieReleaseDatesByCountry[];
}

export interface TvContentRatingEntry {
  iso_3166_1: string;
  rating: string;
}

export interface TvContentRatingsResponse {
  id: number;
  results: TvContentRatingEntry[];
}

// Detalhe de série (endpoint /tv/{id}).
export interface TmdbTvDetails extends TmdbTv {
  genres: Genre[];
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  tagline: string | null;
  status: string;
  content_rating?: string | null;
  trailer?: TmdbVideo | null;
  content_ratings?: TvContentRatingsResponse;
  videos?: TmdbVideosResponse;
}

// Shape normalizado usado pela camada de UI.
export interface MediaItem {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  popularity: number;
  year: number | null;
}
