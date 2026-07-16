/**
 * Query keys centralizadas
 */
export const queryKeys = {
  trending: (mediaType: string, language: string, timeWindow: string) =>
    ['trending', mediaType, language, timeWindow] as const,
  popular: (mediaType: string, language: string) =>
    ['popular', mediaType, language] as const,
  topRated: (mediaType: string, language: string) =>
    ['topRated', mediaType, language] as const,
  collection: (mediaType: string, language: string, collection: string, page: number) =>
    ['collection', mediaType, language, collection, page] as const,
  discover: (
    mediaType: string,
    language: string,
    sort: string,
    page: number,
    genreId?: number,
    collection?: string,
  ) =>
    [
      'discover',
      mediaType,
      language,
      sort,
      page,
      genreId ?? 'all',
      collection ?? 'all',
    ] as const,
  details: (mediaType: string, id: number, language: string) =>
    ['details', mediaType, id, language] as const,
  detailsBase: (mediaType: string, id: number) =>
    ['detailsBase', mediaType, id] as const,
  detailsText: (mediaType: string, id: number, language: string) =>
    ['detailsText', mediaType, id, language] as const,
  credits: (mediaType: string, id: number) =>
    ['credits', mediaType, id] as const,
  similar: (mediaType: string, id: number, language: string) =>
    ['similar', mediaType, id, language] as const,
  season: (id: number, seasonNumber: number, language: string) =>
    ['season', 'tv', id, seasonNumber, language] as const,
  genres: (mediaType: string, language: string) =>
    ['genres', mediaType, language] as const,
} as const;
