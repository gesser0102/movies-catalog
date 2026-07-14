import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ContentRatingBadge } from '@/components/media/ContentRatingBadge';
import { RatingBadge } from '@/components/media/RatingBadge';
import { useMediaDetails, usePrefetchMediaDetails } from '@/hooks/useMediaDetails';
import { backdropUrl } from '@/lib/tmdb/images';
import { useI18n } from '@/contexts/i18n/useI18n';
import type { MediaItem } from '@/types/tmdb';

interface HeroProps {
  mediaType: MediaItem['mediaType'];
  items: MediaItem[];
  isLoading?: boolean;
}

const AUTOPLAY_MS = 7_000;
const FEATURED_LIMIT = 6;

/**
 * Carrossel de destaque no topo da Home.
 */
export function Hero({ mediaType, items, isLoading }: HeroProps) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const featured = useMemo(() => items.slice(0, FEATURED_LIMIT), [items]);
  const item = featured[activeIndex] ?? featured[0];
  const prefetchDetails = usePrefetchMediaDetails();
  const { data: details } = useMediaDetails(mediaType, item?.id ?? 0, Boolean(item));
  const genres = details?.genres.slice(0, 3) ?? [];
  const contentRating = details?.content_rating ?? null;

  useEffect(() => {
    setActiveIndex(0);
  }, [featured]);

  useEffect(() => {
    for (const featuredItem of featured) {
      prefetchDetails(featuredItem.mediaType, featuredItem.id);
    }
  }, [featured, prefetchDetails]);

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featured.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [featured.length]);

  if (isLoading || featured.length === 0) {
    return (
      <div className="h-[64vh] min-h-[500px] w-full animate-pulse bg-surface-800 tablet:min-h-[540px] desktop:min-h-[560px]" />
    );
  }

  const backdrop = backdropUrl(item.backdropPath, 'w1280');
  const section = item.mediaType === 'movie' ? 'movies' : 'series';
  const to = `/${section}/${item.id}`;
  const catalogHref = `/${section}/catalog`;

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + featured.length) % featured.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % featured.length);
  };

  return (
    <section className="relative h-[64vh] min-h-[500px] w-full overflow-hidden tablet:min-h-[540px] desktop:min-h-[560px]">
      {backdrop && (
        <img
          key={item.id}
          src={backdrop}
          alt={item.title}
          className="absolute inset-0 h-full w-full animate-fade-in object-cover object-top"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface-950/90 via-surface-950/45 to-transparent" />

      {featured.length > 1 && (
        <>
          <IconButton
            onClick={goToPrevious}
            aria-label="Previous featured title"
            className="!absolute left-3 top-1/2 z-20 !hidden !-translate-y-1/2 !bg-black/35 !text-white hover:!bg-black/60 tablet:!inline-flex"
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={goToNext}
            aria-label="Next featured title"
            className="!absolute right-3 top-1/2 z-20 !hidden !-translate-y-1/2 !bg-black/35 !text-white hover:!bg-black/60 tablet:!inline-flex"
          >
            <ChevronRightIcon />
          </IconButton>
        </>
      )}

      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-4 pb-10 text-white tablet:px-6 desktop:pb-14">
        <span className="w-fit rounded bg-brand px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-surface-950">
          {t.home.heroBadge}
        </span>

        <Link
          to={to}
          className="mt-3 flex min-h-[86px] w-fit max-w-2xl items-end hover:text-brand tablet:min-h-[104px] desktop:min-h-[116px]"
        >
          <h1 className="line-clamp-2 text-3xl font-extrabold leading-[1.05] drop-shadow tablet:text-4xl desktop:text-5xl">
            {item.title}
          </h1>
        </Link>

        <div className="mt-3 flex min-h-[50px] items-center gap-3">
          <RatingBadge rating={item.rating} size="md" />
          {item.year && <span className="text-sm text-white/80">{item.year}</span>}
          <ContentRatingBadge rating={contentRating} />
        </div>

        <div className="mt-3 flex min-h-[28px] flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre.id}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur"
            >
              {genre.name}
            </span>
          ))}
        </div>

        <p className="mt-7 line-clamp-3 min-h-[62px] max-w-xl text-sm leading-relaxed text-white/80 tablet:min-h-[72px] tablet:text-base">
          {item.overview}
        </p>

        <div className="mt-4 flex min-h-[44px] gap-3">
          <Button
            component={Link}
            to={to}
            variant="contained"
            size="large"
            startIcon={<InfoOutlinedIcon />}
          >
            {t.details.viewDetails}
          </Button>
          <Button
            component={Link}
            to={catalogHref}
            variant="outlined"
            size="large"
            className="!border-white/40 !text-white hover:!border-white"
          >
            {t.common.seeAll}
          </Button>
        </div>

        {featured.length > 1 && (
          <div className="mt-7 flex max-w-xl gap-2">
            {featured.map((featuredItem, index) => (
              <button
                key={featuredItem.id}
                type="button"
                aria-label={`Show featured title ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 flex-1 rounded-full transition ${
                  index === activeIndex ? 'bg-brand' : 'bg-white/30 hover:bg-white/55'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
