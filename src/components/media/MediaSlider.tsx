import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MediaCard } from './MediaCard';
import { MediaCardSkeleton } from './MediaCardSkeleton';
import type { MediaItem } from '@/types/tmdb';

interface MediaSliderProps {
  title: string;
  items: MediaItem[];
  isLoading?: boolean;
  seeAllTo?: string;
  seeAllLabel?: string;
  headerAction?: ReactNode;
}

// Quantidade de skeletons na fase de loading.
const SKELETON_COUNT = 8;

/**
 * Carrossel horizontal por categoria, no estilo Prime Video.
 * Optei por scroll nativo com scroll-snap em vez de uma lib de carrossel pra ficar mais leve.
 */
export function MediaSlider({
  title,
  items,
  isLoading,
  seeAllTo,
  seeAllLabel,
  headerAction,
}: MediaSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByPage = (direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.8;
    track.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="group/slider relative py-4">
      <div className="mb-3 flex items-center justify-between gap-4 px-4 tablet:px-6">
        <h2 className="text-lg font-bold">{title}</h2>
        {headerAction}
        {seeAllTo && seeAllLabel && !headerAction && (
          <Link
            to={seeAllTo}
            className="shrink-0 rounded-full border border-current/15 px-3 py-1 text-xs font-semibold opacity-75 transition hover:border-brand hover:text-brand hover:opacity-100"
          >
            {seeAllLabel}
          </Link>
        )}
      </div>

      <div className="relative -mt-2 pt-2">
        <button
          type="button"
          onClick={() => scrollByPage('left')}
          aria-label="Scroll left"
          className="absolute inset-y-0 left-0 z-20 hidden w-14 items-center justify-center bg-gradient-to-r from-black/80 via-black/40 to-transparent text-white opacity-0 transition-opacity duration-200 hover:from-black/90 group-hover/slider:opacity-100 tablet:flex"
        >
          <ChevronLeftIcon style={{ fontSize: 40 }} />
        </button>

        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto scroll-smooth scroll-px-4 px-4 pb-4 pt-2 tablet:scroll-px-6 tablet:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div key={i} style={{ scrollSnapAlign: 'start' }}>
                  <MediaCardSkeleton variant="slider" />
                </div>
              ))
            : items.map((item) => (
                <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
                  <MediaCard item={item} variant="slider" />
                </div>
              ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByPage('right')}
          aria-label="Scroll right"
          className="absolute inset-y-0 right-0 z-20 hidden w-14 items-center justify-center bg-gradient-to-l from-black/80 via-black/40 to-transparent text-white opacity-0 transition-opacity duration-200 hover:from-black/90 group-hover/slider:opacity-100 tablet:flex"
        >
          <ChevronRightIcon style={{ fontSize: 40 }} />
        </button>
      </div>
    </section>
  );
}
