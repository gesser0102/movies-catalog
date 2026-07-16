import { useCallback, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GroupsIcon from '@mui/icons-material/Groups';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel';
import { CastCard } from './CastCard';
import type { CastMember } from '@/types/tmdb';

const COMPACT_CAST_LIMIT = 4;
const CAST_SLIDE_SIZE_CLASS =
  'min-w-0 flex-[0_0_132px] tablet:flex-[0_0_150px] desktop:flex-[0_0_160px]';

interface CastSliderProps {
  title: string;
  members: CastMember[];
  actionLabel: string;
  onAction: () => void;
}

function allowTouchDrag(_emblaApi: EmblaCarouselType, event: Event) {
  const isTouchEvent = event.type.startsWith('touch');
  const isCoarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches;

  return isTouchEvent || isCoarsePointer;
}

export function CastSlider({
  title,
  members,
  actionLabel,
  onAction,
}: CastSliderProps) {
  const isCompact = members.length <= COMPACT_CAST_LIMIT;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    active: !isCompact,
    align: 'start',
    containScroll: 'trimSnaps',
    duration: 32,
    slidesToScroll: 1,
    watchDrag: allowTouchDrag,
    breakpoints: {
      '(min-width: 768px)': {
        slidesToScroll: 4,
      },
    },
  });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncScrollControls = useCallback(() => {
    if (!emblaApi || isCompact) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(emblaApi.canScrollPrev());
    setCanScrollRight(emblaApi.canScrollNext());
  }, [emblaApi, isCompact]);

  const scrollByPage = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'left') {
        emblaApi?.scrollPrev();
      } else {
        emblaApi?.scrollNext();
      }
    },
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi || isCompact) {
      syncScrollControls();
      return;
    }

    syncScrollControls();

    emblaApi.on('select', syncScrollControls);
    emblaApi.on('reInit', syncScrollControls);

    return () => {
      emblaApi.off('select', syncScrollControls);
      emblaApi.off('reInit', syncScrollControls);
    };
  }, [emblaApi, isCompact, members.length, syncScrollControls]);

  if (isCompact) {
    return (
      <section className="mx-auto max-w-[1400px] px-4 py-4 tablet:px-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GroupsIcon />}
            onClick={onAction}
            className="!rounded-full"
          >
            {actionLabel}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          {members.map((member) => (
            <CastCard key={`${member.id}-${member.order}`} member={member} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="group/slider relative mx-auto max-w-[1400px] px-4 py-4 tablet:px-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <Button
          variant="outlined"
          size="small"
          startIcon={<GroupsIcon />}
          onClick={onAction}
          className="!rounded-full"
        >
          {actionLabel}
        </Button>
      </div>

      <div className="relative -mt-2 pt-2">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByPage('left')}
            aria-label="Scroll cast left"
            className="absolute inset-y-0 left-0 z-20 hidden w-14 items-center justify-center bg-gradient-to-r from-black/80 via-black/40 to-transparent text-white opacity-0 transition-opacity duration-200 hover:from-black/90 group-hover/slider:opacity-100 tablet:flex"
          >
            <ChevronLeftIcon style={{ fontSize: 40 }} />
          </button>
        )}

        <div ref={emblaRef} className="overflow-hidden pb-4 pt-2">
          <div className="flex gap-3 [backface-visibility:hidden] [transform:translate3d(0,0,0)] [will-change:transform]">
            {members.map((member) => (
              <div
                key={`${member.id}-${member.order}`}
                className={`${CAST_SLIDE_SIZE_CLASS} transform-gpu`}
              >
                <CastCard member={member} />
              </div>
            ))}
          </div>
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByPage('right')}
            aria-label="Scroll cast right"
            className="absolute inset-y-0 right-0 z-20 hidden w-14 items-center justify-center bg-gradient-to-l from-black/80 via-black/40 to-transparent text-white opacity-0 transition-opacity duration-200 hover:from-black/90 group-hover/slider:opacity-100 tablet:flex"
          >
            <ChevronRightIcon style={{ fontSize: 40 }} />
          </button>
        )}
      </div>
    </section>
  );
}
