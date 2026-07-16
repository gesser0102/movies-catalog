import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel';
import { MEDIA_CARD_RESTORE_HOVER_EVENT, MediaCard } from './MediaCard';
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

// Constantes para manipular carousel
const SKELETON_COUNT = 8;
const SLIDE_SIZE_CLASS = 'min-w-0 flex-[0_0_150px] tablet:flex-[0_0_180px]';
const MEDIA_CARD_LINK_SELECTOR = '[data-media-card-link]';
const VISUAL_SCROLL_IDLE_MS = 80;
const STABLE_PROGRESS_REPETITIONS_TO_RESTORE = 10;
const PROGRESS_PRECISION = 3;

function allowTouchDrag(_emblaApi: EmblaCarouselType, event: Event) {
  const isTouchEvent = event.type.startsWith('touch');
  const isCoarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches;

  return isTouchEvent || isCoarsePointer;
}

/**
 * Carrossel horizontal por categoria
 */
export function MediaSlider({
  title,
  items,
  isLoading,
  seeAllTo,
  seeAllLabel,
  headerAction,
}: MediaSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    duration: 32,
    slidesToScroll: 4,
    watchDrag: allowTouchDrag,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointerPosition = useRef<{ x: number; y: number } | null>(null);
  const restoreHoverTimer = useRef<number | undefined>(undefined);
  const restoredAfterNavigation = useRef(false);
  const lastProgress = useRef<number | null>(null);
  const stableProgressRepetitions = useRef(0);

  const setViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      emblaRef(node);
    },
    [emblaRef],
  );

  const rememberPointerPosition = (event: ReactMouseEvent<HTMLDivElement>) => {
    pointerPosition.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const restoreHoverUnderPointer = useCallback(() => {
    const viewport = viewportRef.current;
    const position = pointerPosition.current;
    if (!viewport || !position) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const viewportRect = viewport.getBoundingClientRect();
        const { x, y } = position;

        if (
          x < viewportRect.left ||
          x > viewportRect.right ||
          y < viewportRect.top ||
          y > viewportRect.bottom
        ) {
          return;
        }

        const hoveredCard = Array.from(
          viewport.querySelectorAll<HTMLElement>(MEDIA_CARD_LINK_SELECTOR),
        ).find((card) => {
          const cardRect = card.getBoundingClientRect();
          return (
            x >= cardRect.left &&
            x <= cardRect.right &&
            y >= cardRect.top &&
            y <= cardRect.bottom
          );
        });

        hoveredCard?.dispatchEvent(new CustomEvent(MEDIA_CARD_RESTORE_HOVER_EVENT));
      });
    });
  }, []);

  const restorePointerInteractions = useCallback(() => {
    window.clearTimeout(restoreHoverTimer.current);
    restoreHoverTimer.current = undefined;
    setIsAnimating(false);

    if (restoredAfterNavigation.current) return;
    restoredAfterNavigation.current = true;
    restoreHoverUnderPointer();
  }, [restoreHoverUnderPointer]);

  const schedulePointerInteractionsRestore = useCallback(() => {
    window.clearTimeout(restoreHoverTimer.current);
    restoreHoverTimer.current = window.setTimeout(() => {
      restorePointerInteractions();
    }, VISUAL_SCROLL_IDLE_MS);
  }, [restorePointerInteractions]);

  const countStableProgress = useCallback(() => {
    if (!emblaApi) return 0;

    const progress = Number(emblaApi.scrollProgress().toFixed(PROGRESS_PRECISION));

    if (lastProgress.current === progress) {
      stableProgressRepetitions.current += 1;
      return stableProgressRepetitions.current;
    }

    lastProgress.current = progress;
    stableProgressRepetitions.current = 1;
    return stableProgressRepetitions.current;
  }, [emblaApi]);

  const syncScrollButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    syncScrollButtons();

    const handleScrollStart = () => {
      const stableCount = countStableProgress();

      if (restoredAfterNavigation.current) return;

      setIsAnimating(true);

      if (stableCount >= STABLE_PROGRESS_REPETITIONS_TO_RESTORE) {
        restorePointerInteractions();
        return;
      }

      schedulePointerInteractionsRestore();
    };
    const handleSettle = () => {
      restorePointerInteractions();
      syncScrollButtons();
    };

    emblaApi.on('select', syncScrollButtons);
    emblaApi.on('reInit', syncScrollButtons);
    emblaApi.on('scroll', handleScrollStart);
    emblaApi.on('settle', handleSettle);

    return () => {
      emblaApi.off('select', syncScrollButtons);
      emblaApi.off('reInit', syncScrollButtons);
      emblaApi.off('scroll', handleScrollStart);
      emblaApi.off('settle', handleSettle);
    };
  }, [
    emblaApi,
    countStableProgress,
    restorePointerInteractions,
    schedulePointerInteractionsRestore,
    syncScrollButtons,
  ]);

  useEffect(() => {
    return () => window.clearTimeout(restoreHoverTimer.current);
  }, []);

  const scrollByPage = useCallback((direction: 'left' | 'right') => {
    lastProgress.current = null;
    stableProgressRepetitions.current = 0;
    restoredAfterNavigation.current = false;
    setIsAnimating(true);
    window.clearTimeout(restoreHoverTimer.current);

    if (direction === 'left') {
      emblaApi?.scrollPrev();
    } else {
      emblaApi?.scrollNext();
    }

    schedulePointerInteractionsRestore();
  }, [emblaApi, schedulePointerInteractionsRestore]);

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
            <span className="sr-only">: {title}</span>
          </Link>
        )}
      </div>

      <div className="relative -mt-2 pt-2">
        {canScrollPrev && (
          <button
            type="button"
            onClick={() => scrollByPage('left')}
            aria-label="Scroll left"
            className="absolute inset-y-0 left-0 z-20 hidden w-14 items-center justify-center bg-gradient-to-r from-black/80 via-black/40 to-transparent text-white opacity-0 transition-opacity duration-200 hover:from-black/90 group-hover/slider:opacity-100 tablet:flex"
          >
            <ChevronLeftIcon style={{ fontSize: 40 }} />
          </button>
        )}

        <div
          ref={setViewportRef}
          onMouseMove={rememberPointerPosition}
          className="overflow-hidden px-4 pb-4 pt-2 [contain:layout_paint] tablet:px-6"
        >
          <div
            className={`flex gap-3 [backface-visibility:hidden] [transform:translate3d(0,0,0)] [will-change:transform] ${
              isAnimating ? 'pointer-events-none' : ''
            }`}
          >
            {isLoading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <div key={i} className={`${SLIDE_SIZE_CLASS} transform-gpu`}>
                    <MediaCardSkeleton variant="slider" />
                  </div>
                ))
              : items.map((item) => (
                  <div key={item.id} className={`${SLIDE_SIZE_CLASS} transform-gpu`}>
                    <MediaCard item={item} variant="slider" />
                  </div>
                ))}
          </div>
        </div>

        {canScrollNext && (
          <button
            type="button"
            onClick={() => scrollByPage('right')}
            aria-label="Scroll right"
            className="absolute inset-y-0 right-0 z-20 hidden w-14 items-center justify-center bg-gradient-to-l from-black/80 via-black/40 to-transparent text-white opacity-0 transition-opacity duration-200 hover:from-black/90 group-hover/slider:opacity-100 tablet:flex"
          >
            <ChevronRightIcon style={{ fontSize: 40 }} />
          </button>
        )}
      </div>
    </section>
  );
}
