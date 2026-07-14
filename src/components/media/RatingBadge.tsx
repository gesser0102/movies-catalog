import { useEffect, useState } from 'react';

type RatingBadgeSize = 'xs' | 'sm' | 'md';

interface RatingBadgeProps {
  rating: number;
  size?: RatingBadgeSize;
  className?: string;
}

const SIZE_CONFIG: Record<
  RatingBadgeSize,
  { box: number; stroke: number; textClass: string; percentClass: string }
> = {
  xs: {
    box: 38,
    stroke: 3,
    textClass: 'text-[10px]',
    percentClass: 'text-[6px]',
  },
  sm: {
    box: 42,
    stroke: 3.25,
    textClass: 'text-[11px]',
    percentClass: 'text-[7px]',
  },
  md: {
    box: 50,
    stroke: 3.5,
    textClass: 'text-[13px]',
    percentClass: 'text-[8px]',
  },
};

function clampRating(rating: number): number {
  return Math.min(Math.max(Math.round(rating * 10), 0), 100);
}

function ratingColors(percent: number) {
  if (percent >= 70) {
    return { stroke: '#21d07a', track: '#204529' };
  }
  if (percent >= 40) {
    return { stroke: '#d2d531', track: '#423d0f' };
  }
  return { stroke: '#db2360', track: '#571435' };
}

/**
 * Indicador de nota no estilo TMDB.
 *
 * A API entrega `vote_average` em escala 0-10; visualmente a TMDB exibe isso em
 * percentual. Títulos sem votos chegam como 0 e continuam sem badge.
 */
export function RatingBadge({
  rating,
  size = 'sm',
  className = '',
}: RatingBadgeProps) {
  const percent = clampRating(rating);
  const [displayedPercent, setDisplayedPercent] = useState(0);
  const colors = ratingColors(percent);
  const config = SIZE_CONFIG[size];
  const radius = 15.5;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (displayedPercent / 100) * circumference;

  useEffect(() => {
    if (percent <= 0) {
      setDisplayedPercent(0);
      return;
    }

    const shouldReduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (shouldReduceMotion) {
      setDisplayedPercent(percent);
      return;
    }

    setDisplayedPercent(0);
    let fillFrame = 0;
    const resetFrame = window.requestAnimationFrame(() => {
      fillFrame = window.requestAnimationFrame(() => {
        setDisplayedPercent(percent);
      });
    });

    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.cancelAnimationFrame(fillFrame);
    };
  }, [percent]);

  if (percent <= 0) return null;

  return (
    <span
      className={`relative inline-flex aspect-square shrink-0 items-center justify-center rounded-full bg-[#081c22] text-white shadow-[0_0_0_2px_rgba(8,28,34,0.9)] ${className}`}
      style={{ width: config.box, minWidth: config.box }}
      aria-label={`User score ${percent}%`}
      title={`User score ${percent}%`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 36 36"
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={config.stroke}
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeLinecap="round"
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>

      <span
        className={`relative z-10 flex items-start font-black leading-none tracking-[-0.01em] ${config.textClass}`}
      >
        {percent}
        <span className={`ml-[1px] mt-px font-bold leading-none ${config.percentClass}`}>
          %
        </span>
      </span>
    </span>
  );
}
