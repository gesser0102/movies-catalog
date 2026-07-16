import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GroupsIcon from '@mui/icons-material/Groups';
import { CastCard } from './CastCard';
import type { CastMember } from '@/types/tmdb';

interface CastSliderProps {
  title: string;
  members: CastMember[];
  actionLabel: string;
  onAction: () => void;
}

export function CastSlider({
  title,
  members,
  actionLabel,
  onAction,
}: CastSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isCompact = members.length <= 4;

  const syncScrollControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(track.scrollLeft > 1);
    setCanScrollRight(track.scrollLeft < maxScrollLeft - 1);
  }, []);

  const scrollByPage = (direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction === 'left' ? -track.clientWidth * 0.8 : track.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (isCompact) return;

    const track = trackRef.current;
    if (!track) return;

    syncScrollControls();

    const handleScroll = () => syncScrollControls();
    const handleResize = () => syncScrollControls();

    track.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      track.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isCompact, members.length, syncScrollControls]);

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

        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {members.map((member) => (
            <div key={`${member.id}-${member.order}`} style={{ scrollSnapAlign: 'start' }}>
              <CastCard member={member} />
            </div>
          ))}
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
