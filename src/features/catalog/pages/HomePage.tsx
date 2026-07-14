import { useState } from 'react';
import { Hero } from '../components/Hero';
import { MediaSlider } from '@/components/media/MediaSlider';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useI18n } from '@/contexts/i18n/useI18n';
import {
  useCollection,
  useDiscover,
  usePopular,
  useTopRated,
  useTrending,
  useWarmAlternateLanguageHomeQueries,
} from '../api/queries';
import {
  HOME_GENRES,
  type GenreOption,
  type TrendingWindow,
} from '@/lib/tmdb/endpoints';
import type { MediaType } from '@/types/tmdb';

function catalogPath(mediaType: MediaType) {
  return `/${mediaType === 'movie' ? 'movies' : 'series'}/catalog`;
}

function GenreSlider({ mediaType, genre }: { mediaType: MediaType; genre: GenreOption }) {
  const { t } = useI18n();
  const query = useDiscover(mediaType, 'popularity', 1, genre.id);

  return (
    <MediaSlider
      title={t.home.genres[genre.key]}
      items={query.data?.results ?? []}
      isLoading={query.isLoading}
      seeAllTo={`${catalogPath(mediaType)}?genre=${genre.id}`}
      seeAllLabel={t.common.seeMore}
    />
  );
}

function CollectionSlider({
  mediaType,
  collection,
  title,
}: {
  mediaType: MediaType;
  collection: 'now_playing' | 'upcoming' | 'airing_today' | 'on_the_air';
  title: string;
}) {
  const { t } = useI18n();
  const query = useCollection(mediaType, collection);

  return (
    <MediaSlider
      title={title}
      items={query.data?.results ?? []}
      isLoading={query.isLoading}
      seeAllTo={`${catalogPath(mediaType)}?source=${collection}`}
      seeAllLabel={t.common.seeMore}
    />
  );
}

function TopRatedSlider({ mediaType }: { mediaType: MediaType }) {
  const { t } = useI18n();
  const query = useTopRated(mediaType);

  return (
    <MediaSlider
      title={t.home.topRated}
      items={query.data?.results ?? []}
      isLoading={query.isLoading}
      seeAllTo={`${catalogPath(mediaType)}?source=top_rated`}
      seeAllLabel={t.common.seeMore}
    />
  );
}

function TrendingWindowToggle({
  value,
  onChange,
}: {
  value: TrendingWindow;
  onChange: (value: TrendingWindow) => void;
}) {
  const { t } = useI18n();
  const options: { value: TrendingWindow; label: string }[] = [
    { value: 'day', label: t.home.today },
    { value: 'week', label: t.home.thisWeek },
  ];

  return (
    <div className="flex overflow-hidden rounded-full border border-current/20 bg-black/5 p-0.5 text-xs font-semibold dark:bg-white/5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-w-[74px] rounded-full px-3 py-1 transition ${
            value === option.value
              ? 'bg-brand text-surface-950'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function HomePage({ mediaType }: { mediaType: MediaType }) {
  const { t } = useI18n();
  const [trendingWindow, setTrendingWindow] = useState<TrendingWindow>('week');

  useWarmAlternateLanguageHomeQueries(mediaType);

  const trending = useTrending(mediaType, trendingWindow);
  const featured = useTrending(mediaType, 'week');
  const popular = usePopular(mediaType);

  const baseCatalogPath = catalogPath(mediaType);
  const firstCollectionKey = mediaType === 'movie' ? 'now_playing' : 'airing_today';
  const secondCollectionKey = mediaType === 'movie' ? 'upcoming' : 'on_the_air';
  const firstCollectionTitle =
    mediaType === 'movie' ? t.home.nowPlaying : t.home.airingToday;
  const secondCollectionTitle =
    mediaType === 'movie' ? t.home.upcoming : t.home.onTheAir;

  if (trending.isError) {
    return <ErrorState message={trending.error.message} onRetry={() => trending.refetch()} />;
  }

  return (
    <div className="pb-8">
      <Hero
        mediaType={mediaType}
        items={featured.data?.results ?? popular.data?.results ?? []}
        isLoading={featured.isLoading && popular.isLoading}
      />

      <MediaSlider
        title={t.home.trending}
        items={trending.data?.results ?? []}
        isLoading={trending.isLoading}
        headerAction={
          <TrendingWindowToggle
            value={trendingWindow}
            onChange={setTrendingWindow}
          />
        }
      />
      <CollectionSlider
        mediaType={mediaType}
        collection={firstCollectionKey}
        title={firstCollectionTitle}
      />
      <MediaSlider
        title={t.home.popular}
        items={popular.data?.results ?? []}
        isLoading={popular.isLoading}
        seeAllTo={`${baseCatalogPath}?source=popular`}
        seeAllLabel={t.common.seeMore}
      />
      <CollectionSlider
        mediaType={mediaType}
        collection={secondCollectionKey}
        title={secondCollectionTitle}
      />
      <TopRatedSlider mediaType={mediaType} />
      {HOME_GENRES[mediaType].map((genre) => (
        <GenreSlider key={genre.id} mediaType={mediaType} genre={genre} />
      ))}
    </div>
  );
}
