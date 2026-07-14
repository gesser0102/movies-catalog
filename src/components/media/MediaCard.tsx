import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { RatingBadge } from './RatingBadge';
import { HoverPreviewCard } from './HoverPreviewCard';
import { preloadDetailsRoute } from '@/app/router/preloadRoutes';
import { backdropUrl, posterUrl } from '@/lib/tmdb/images';
import { usePrefetchMediaDetails } from '@/hooks/useMediaDetails';
import type { MediaItem } from '@/types/tmdb';

interface MediaCardProps {
  item: MediaItem;
  variant?: 'slider' | 'grid';
}

// Defino aqui que o card preview somente para dispositivos com mouse (hover)
// Dispositivos com touch vao direto pra detail page 
const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

// evita disparar um popover a cada card que o mouse
const OPEN_DELAY = 380;
const DETAILS_PATH_PATTERN = /^\/(movies|series)\/[^/]+$/;

/**
 * Card de pôster — a unidade visual básica do catálogo.
 *
 * O card em si é enxuto (pôster + título + ano).
 * memo para evitar re-render pois temos diversos cards na msma page
 */
function MediaCardComponent({ item, variant = 'grid' }: MediaCardProps) {
  const location = useLocation();
  const poster = posterUrl(item.posterPath, 'w342');
  const to = `/${item.mediaType === 'movie' ? 'movies' : 'series'}/${item.id}`;
  const linkState = DETAILS_PATH_PATTERN.test(location.pathname)
    ? ({ fromDetails: true } as const)
    : undefined;
  const widthClass = variant === 'slider' ? 'w-[150px] tablet:w-[180px]' : 'w-full';

  const tileRef = useRef<HTMLAnchorElement>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const preloadedImage = useRef(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  const prefetchDetails = usePrefetchMediaDetails();

  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };

  const warmCardResources = () => {
    preloadDetailsRoute();
    prefetchDetails(item.mediaType, item.id);

    if (!preloadedImage.current) {
      const src = backdropUrl(item.backdropPath, 'w780');
      if (src) {
        const img = new Image();
        img.src = src;
      }
      preloadedImage.current = true;
    }
  };

  const openPreview = () => {
    warmCardResources();
    if (!canHover()) return;
    window.clearTimeout(closeTimer.current);

    openTimer.current = window.setTimeout(() => {
      const rect = tileRef.current?.getBoundingClientRect();
      if (rect) setAnchor(rect);
    }, OPEN_DELAY);
  };

  const closePreview = () => {
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => setAnchor(null), 140);
  };

  // Qualquer scroll fecha o hover previeww e limpa os timers
  useEffect(() => {
    if (!anchor) return;
    const close = () => setAnchor(null);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [anchor]);

  useEffect(() => clearTimers, []);

  return (
    <div className={`shrink-0 ${widthClass}`}>
      <Link
        ref={tileRef}
        to={to}
        state={linkState}
        className="group block overflow-hidden rounded-xl bg-surface-800 shadow-card ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:ring-2 hover:ring-brand/70"
        aria-label={item.title}
        onMouseEnter={openPreview}
        onMouseLeave={closePreview}
        onFocus={warmCardResources}
        onTouchStart={warmCardResources}
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-surface-800">
          {poster ? (
            <img
              src={poster}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/40">
              <BrokenImageIcon />
              <span className="px-2 text-center text-xs">{item.title}</span>
            </div>
          )}

          <div className="absolute left-2 top-2 z-10">
            <RatingBadge rating={item.rating} />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pb-3 pt-12 text-white">
            <p className="line-clamp-2 text-sm font-bold leading-tight drop-shadow">
              {item.title}
            </p>
            {item.year && (
              <p className="mt-1 text-xs font-medium text-white/70 drop-shadow">
                {item.year}
              </p>
            )}
          </div>
        </div>
      </Link>

      {anchor &&
        createPortal(
          <HoverPreviewCard
            item={item}
            anchor={anchor}
            linkState={linkState}
            onMouseEnter={() => window.clearTimeout(closeTimer.current)}
            onMouseLeave={closePreview}
          />,
          document.body,
        )}
    </div>
  );
}

export const MediaCard = memo(MediaCardComponent);
