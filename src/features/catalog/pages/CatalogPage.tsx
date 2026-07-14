import { useSearchParams } from 'react-router-dom';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import { MediaCard } from '@/components/media/MediaCard';
import { MediaCardSkeleton } from '@/components/media/MediaCardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useI18n } from '@/contexts/i18n/useI18n';
import { useCatalogListing, useGenres } from '../api/queries';
import {
  type CatalogCollection,
  type SortOption,
} from '@/lib/tmdb/endpoints';
import type { MediaType } from '@/types/tmdb';

// A TMDB não pagina além de 500. Passar disso retorna erro, então travamos aqui.
const MAX_PAGE = 500;
const GRID_SKELETONS = 20;
const VALID_SORTS: SortOption[] = ['popularity', 'rating', 'alphabetical'];
const VALID_SOURCES: Record<MediaType, CatalogCollection[]> = {
  movie: ['trending', 'popular', 'top_rated', 'now_playing', 'upcoming'],
  tv: ['trending', 'popular', 'top_rated', 'airing_today', 'on_the_air'],
};

/**
 * Tela de catálogo: grid paginado com ordenação.
 *
 * aqui eu decidi passar o sort e a page por URL parameter,
 * de modo que ao fazer reload nao perca a ordenacao. ao inves de useState
 */
export function CatalogPage({ mediaType }: { mediaType: MediaType }) {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.min(
    Math.max(Number(searchParams.get('page')) || 1, 1),
    MAX_PAGE,
  );
  const sourceParam = searchParams.get('source') as CatalogCollection | null;
  const source =
    sourceParam && VALID_SOURCES[mediaType].includes(sourceParam)
      ? sourceParam
      : undefined;
  const sortParam = searchParams.get('sort') as SortOption | null;
  const defaultSort: SortOption = source === 'top_rated' ? 'rating' : 'popularity';
  const sort: SortOption = VALID_SORTS.includes(sortParam!) ? sortParam! : defaultSort;
  const genreParam = Number(searchParams.get('genre'));
  const selectedGenreId =
    Number.isFinite(genreParam) && genreParam > 0 ? genreParam : undefined;
  const genres = useGenres(mediaType);
  const genre = genres.data?.find((item) => item.id === selectedGenreId);

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useCatalogListing({
    mediaType,
    sort,
    page,
    genreId: source ? undefined : selectedGenreId,
    collection: source,
  });

  const totalPages = Math.min(data?.total_pages ?? 1, MAX_PAGE);
  const baseTitle = mediaType === 'movie' ? t.catalog.moviesTitle : t.catalog.seriesTitle;
  const sourceTitles: Record<CatalogCollection, string> = {
    trending: t.home.trending,
    popular: t.home.popular,
    top_rated: t.home.topRated,
    now_playing: t.home.nowPlaying,
    upcoming: t.home.upcoming,
    airing_today: t.home.airingToday,
    on_the_air: t.home.onTheAir,
  };
  const title = source
    ? sourceTitles[source]
    : genre
      ? genre.name
      : baseTitle;
  const canSort = source !== 'trending';

  const updateParams = (next: {
    sort?: SortOption;
    page?: number;
    genreId?: number | null;
  }) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next.sort) {
        params.set('sort', next.sort);
        params.set('page', '1');
      }
      if ('genreId' in next) {
        params.delete('source');
        if (next.genreId) {
          params.set('genre', String(next.genreId));
        } else {
          params.delete('genre');
        }
        params.set('page', '1');
      }
      if (next.page) params.set('page', String(next.page));
      return params;
    });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 tablet:px-6">
      {/* Cabeçalho: título + controle de ordenação */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tablet:text-3xl">{title}</h1>

        <div
          className={`gap-3 ${
            !source && canSort
              ? 'grid w-full grid-cols-2 tablet:flex tablet:w-auto tablet:flex-wrap'
              : 'flex w-full flex-wrap tablet:w-auto'
          }`}
        >
          {!source && (
            <FormControl size="small" className="w-full min-w-0 tablet:w-auto tablet:min-w-[180px]">
              <InputLabel id="genre-label">{t.catalog.genreLabel}</InputLabel>
              <Select
                labelId="genre-label"
                label={t.catalog.genreLabel}
                value={selectedGenreId ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  updateParams({
                    genreId: value === '' ? null : Number(value),
                  });
                }}
              >
                <MenuItem value="">{t.catalog.allGenres}</MenuItem>
                {(genres.data ?? []).map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {canSort && (
            <FormControl size="small" className="w-full min-w-0 tablet:w-auto tablet:min-w-[180px]">
              <InputLabel id="sort-label">{t.catalog.sortLabel}</InputLabel>
              <Select
                labelId="sort-label"
                label={t.catalog.sortLabel}
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value as SortOption })}
              >
                <MenuItem value="popularity">{t.catalog.sortPopularity}</MenuItem>
                <MenuItem value="rating">{t.catalog.sortRating}</MenuItem>
                <MenuItem value="alphabetical">{t.catalog.sortAlphabetical}</MenuItem>
              </Select>
            </FormControl>
          )}
        </div>
      </div>

      {isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !isLoading && data?.results.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div
            className={`grid grid-cols-2 gap-4 tablet:grid-cols-4 desktop:grid-cols-5 ${
              isPlaceholderData ? 'opacity-60 transition-opacity' : ''
            }`}
          >
            {isLoading
              ? Array.from({ length: GRID_SKELETONS }).map((_, i) => (
                  <MediaCardSkeleton key={i} />
                ))
              : data?.results.map((item) => <MediaCard key={item.id} item={item} />)}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => updateParams({ page: value })}
                color="primary"
                siblingCount={1}
                boundaryCount={1}
              />
              <span className="text-xs opacity-60">
                {t.catalog.pageOf(page, totalPages)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
