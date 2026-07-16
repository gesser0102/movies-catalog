import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { ContentRatingBadge } from './ContentRatingBadge';
import { RatingBadge } from './RatingBadge';
import { backdropUrl, posterUrl } from '@/lib/tmdb/images';
import { useMediaDetails } from '@/hooks/useMediaDetails';
import { formatRuntime } from '@/utils/format';
import { useI18n } from '@/contexts/i18n/useI18n';
import type { MediaItem, TmdbMovieDetails, TmdbTvDetails } from '@/types/tmdb';

const PREVIEW_WIDTH = 340;
const VIEWPORT_MARGIN = 12;
type DetailLinkState = { fromDetails: true } | undefined;

interface HoverPreviewCardProps {
  item: MediaItem;
  anchor: DOMRect;
  linkState?: DetailLinkState;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Posiciona o preview centralizado sobre o card de origem, sem deixar vazar na viewport
 */
function computePosition(anchor: DOMRect, height: number) {
  const width = PREVIEW_WIDTH;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const left = clamp(
    anchor.left + anchor.width / 2 - width / 2,
    VIEWPORT_MARGIN,
    window.innerWidth - width - VIEWPORT_MARGIN,
  );
  const top = clamp(
    anchor.top + anchor.height / 2 - height / 2,
    VIEWPORT_MARGIN,
    window.innerHeight - height - VIEWPORT_MARGIN,
  );
  return { left, top, width };
}

/**
 * Card expandido que aparece ao passar o mouse.
 *
 */
export function HoverPreviewCard({
  item,
  anchor,
  linkState,
  onMouseEnter,
  onMouseLeave,
}: HoverPreviewCardProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => computePosition(anchor, 340));

  // Faco um prefetch dos detalhes para evitar reflow em algumas telas
  const { data } = useMediaDetails(item.mediaType, item.id);

  useLayoutEffect(() => {
    const height = ref.current?.offsetHeight ?? 340;
    setPos(computePosition(anchor, height));
  }, [anchor]);

  const section = item.mediaType === 'movie' ? 'movies' : 'series';
  const to = `/${section}/${item.id}`;
  const image =
    backdropUrl(item.backdropPath, 'w780') ?? posterUrl(item.posterPath, 'w500');

  const genres = data?.genres?.slice(0, 3) ?? [];
  const overview = data ? data.overview : item.overview;
  const contentRating = data?.content_rating ?? null;
  const runtime = data
    ? formatRuntime(
        item.mediaType === 'movie'
          ? (data as TmdbMovieDetails).runtime
          : (data as TmdbTvDetails).episode_run_time?.[0] ?? null,
      )
    : null;
  const seasonsCount =
    data && item.mediaType === 'tv'
      ? (data as TmdbTvDetails).number_of_seasons
      : null;
  const seasonsLabel =
    seasonsCount && seasonsCount > 0
      ? `${seasonsCount} ${
          seasonsCount === 1 ? t.details.seasonLabel : t.details.seasons
        }`
      : null;

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: 'fixed', left: pos.left, top: pos.top, width: pos.width }}
      className="z-[60] animate-preview-in overflow-hidden rounded-xl bg-surface-850 text-white shadow-glow ring-1 ring-white/10"
    >
      {/* Capa (backdrop) com o título sobreposto */}
      <Link to={to} state={linkState} className="block">
        <div className="relative aspect-video overflow-hidden bg-surface-800">
          {image && (
            <img src={image} alt={item.title} className="h-full w-full object-cover" />
          )}
          <div className="absolute -inset-x-px bottom-[-1px] top-0 bg-gradient-to-t from-surface-850 via-surface-850/30 to-transparent" />
          <h3 className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-base font-bold drop-shadow">
            {item.title}
          </h3>
        </div>
      </Link>

      <div className="relative z-10 -mt-px flex flex-col gap-3 bg-surface-850 p-3">
        {/* Ação principal */}
        <div className="flex items-center">
          <Link
            to={to}
            state={linkState}
            className="flex h-9 items-center gap-1 rounded-full bg-brand-gradient px-4 text-sm font-semibold text-surface-950 transition-transform hover:scale-105"
          >
            <PlayArrowIcon fontSize="small" />
            {t.details.viewDetails}
          </Link>
        </div>

        {/* Meta: nota, ano, duração */}
        <div className="flex items-center gap-3 text-xs">
          <RatingBadge rating={item.rating} size="xs" />
          {item.year && <span className="text-white/70">{item.year}</span>}
          {runtime && <span className="text-white/70">{runtime}</span>}
          {seasonsLabel && <span className="text-white/70">{seasonsLabel}</span>}
          <ContentRatingBadge rating={contentRating} />
        </div>

        <div className="flex min-h-[24px] flex-wrap gap-1.5">
          {genres.map((genre) => (
            <span
              key={genre.id}
              className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80"
            >
              {genre.name}
            </span>
          ))}
        </div>
        
        {overview && (
          <p className="line-clamp-3 text-xs leading-relaxed text-white/70">
            {overview}
          </p>
        )}
      </div>
    </div>
  );
}
