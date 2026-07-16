import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';
import { DetailsPage } from './DetailsPage';
import type {
  Credits,
  MediaItem,
  TmdbMovieDetails,
  TmdbTvDetails,
} from '@/types/tmdb';

const {
  useDetailsMock,
  useCreditsMock,
  useSimilarMock,
  useWarmAlternateLanguageSimilarMock,
  usePrefetchMediaDetailsMock,
  useWarmAlternateLanguageMediaDetailsMock,
  prefetchDetailsMock,
} = vi.hoisted(() => ({
  useDetailsMock: vi.fn(),
  useCreditsMock: vi.fn(),
  useSimilarMock: vi.fn(),
  useWarmAlternateLanguageSimilarMock: vi.fn(),
  usePrefetchMediaDetailsMock: vi.fn(),
  useWarmAlternateLanguageMediaDetailsMock: vi.fn(),
  prefetchDetailsMock: vi.fn(),
}));

vi.mock('../api/queries', () => ({
  useDetails: useDetailsMock,
  useCredits: useCreditsMock,
  useSimilar: useSimilarMock,
  useWarmAlternateLanguageSimilar: useWarmAlternateLanguageSimilarMock,
}));

vi.mock('@/hooks/useMediaDetails', () => ({
  usePrefetchMediaDetails: usePrefetchMediaDetailsMock,
  useWarmAlternateLanguageMediaDetails: useWarmAlternateLanguageMediaDetailsMock,
}));

vi.mock('../components/CastSlider', () => ({
  CastSlider: ({
    title,
    actionLabel,
    onAction,
  }: {
    title: string;
    actionLabel: string;
    onAction: () => void;
  }) => (
    <section aria-label={title}>
      <button type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </section>
  ),
}));

vi.mock('../components/CastSliderSkeleton', () => ({
  CastSliderSkeleton: ({ title }: { title: string }) => (
    <section aria-busy="true" aria-label={title}>
      Loading cast
    </section>
  ),
}));

vi.mock('../components/FullCreditsModal', () => ({
  FullCreditsModal: ({
    open,
    title,
  }: {
    open: boolean;
    title: string;
  }) => (open ? <div role="dialog">Credits for {title}</div> : null),
}));

vi.mock('../components/TrailerModal', () => ({
  TrailerModal: ({
    open,
    title,
  }: {
    open: boolean;
    title: string;
  }) => (open ? <div role="dialog">Trailer for {title}</div> : null),
}));

vi.mock('../components/SeasonEpisodes', () => ({
  SeasonEpisodes: ({ tvId }: { tvId: number }) => (
    <section aria-label="season-episodes">Episodes for {tvId}</section>
  ),
}));

vi.mock('@/components/media/MediaSlider', () => ({
  MediaSlider: ({ title, items }: { title: string; items: MediaItem[] }) => (
    <section aria-label={title}>
      {items.map((item) => (
        <span key={item.id}>{item.title}</span>
      ))}
    </section>
  ),
}));

const movieDetails = {
  id: 10,
  title: 'The Odyssey',
  original_title: 'The Odyssey',
  overview: 'A long journey home.',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  vote_average: 5.4,
  popularity: 100,
  release_date: '2026-07-16',
  genre_ids: [12],
  genres: [{ id: 12, name: 'Adventure' }],
  runtime: 180,
  tagline: 'Defy the gods.',
  status: 'Released',
  content_rating: '14',
  trailer: {
    id: 'video-1',
    key: 'abc123',
    name: 'Official Trailer',
    site: 'YouTube',
    size: 1080,
    type: 'Trailer',
    official: true,
    published_at: '2026-01-01T00:00:00.000Z',
  },
} satisfies TmdbMovieDetails;

const tvDetails = {
  id: 20,
  name: 'The Series',
  original_name: 'The Series',
  overview: 'A seasonal mystery.',
  poster_path: null,
  backdrop_path: null,
  vote_average: 8,
  popularity: 80,
  first_air_date: '2026-02-01',
  genre_ids: [18],
  genres: [{ id: 18, name: 'Drama' }],
  episode_run_time: [45],
  number_of_seasons: 3,
  number_of_episodes: 24,
  seasons: [
    {
      id: 100,
      season_number: 1,
      name: 'Season 1',
      overview: '',
      poster_path: null,
      episode_count: 8,
      air_date: '2026-02-01',
      vote_average: 7.5,
    },
  ],
  tagline: null,
  status: 'Returning Series',
  content_rating: '16',
  trailer: null,
} satisfies TmdbTvDetails;

const credits = {
  cast: [
    {
      id: 1,
      name: 'Lead Actor',
      character: 'Hero',
      profile_path: null,
      order: 0,
    },
  ],
  crew: [
    {
      id: 2,
      name: 'Christopher Nolan',
      job: 'Director',
      department: 'Directing',
      profile_path: null,
    },
  ],
} satisfies Credits;

const similarItems = [
  {
    id: 30,
    mediaType: 'movie',
    title: 'Similar Movie',
    overview: 'Another title.',
    posterPath: null,
    backdropPath: null,
    rating: 7,
    popularity: 10,
    year: 2026,
  },
] satisfies MediaItem[];

function renderDetailsPage({
  mediaType = 'movie',
  state,
}: {
  mediaType?: 'movie' | 'tv';
  state?: unknown;
} = {}) {
  const path = mediaType === 'movie' ? '/movies/:id' : '/series/:id';
  const pathname = mediaType === 'movie' ? '/movies/10' : '/series/20';

  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[{ pathname, state }]}>
        <Routes>
          <Route path={path} element={<DetailsPage mediaType={mediaType} />} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe('DetailsPage', () => {
  beforeEach(() => {
    localStorage.setItem('movies-catalog:language', 'en-US');
    usePrefetchMediaDetailsMock.mockReturnValue(prefetchDetailsMock);
    useDetailsMock.mockReturnValue({
      data: movieDetails,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    useCreditsMock.mockReturnValue({
      data: credits,
    });
    useSimilarMock.mockReturnValue({
      data: similarItems,
    });
  });

  it('renders the loading skeleton before details are available', () => {
    useDetailsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDetailsPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders an error state when the details request fails', () => {
    useDetailsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load details'),
      refetch: vi.fn(),
    });

    renderDetailsPage();

    expect(screen.getByText('Failed to load details')).toBeInTheDocument();
  });

  it('renders movie details, credits, rating labels, trailer and similar titles', async () => {
    renderDetailsPage();

    expect(screen.getByRole('heading', { name: 'The Odyssey' })).toBeInTheDocument();
    expect(screen.getByText('A long journey home.')).toBeInTheDocument();
    expect(screen.getByText('User rating')).toBeInTheDocument();
    expect(screen.getByText('Content rating')).toBeInTheDocument();
    expect(screen.getByText('Christopher Nolan')).toBeInTheDocument();
    expect(screen.getByText('Similar Movie')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /view trailer/i }));

    expect(screen.getByRole('dialog', { name: '' })).toHaveTextContent(
      'Trailer for The Odyssey',
    );
  });

  it('renders the cast skeleton while credits are loading', () => {
    useCreditsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderDetailsPage();

    expect(screen.getByLabelText('Top cast')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading cast')).toBeInTheDocument();
  });

  it('shows the contextual home button only when the user came from another details page', () => {
    renderDetailsPage();

    expect(screen.queryByRole('link', { name: /movies home/i })).not.toBeInTheDocument();

    renderDetailsPage({ state: { fromDetails: true } });

    expect(screen.getByRole('link', { name: /movies home/i })).toHaveAttribute(
      'href',
      '/movies',
    );
  });

  it('renders TV metadata with seasons and warms the right ids', () => {
    useDetailsMock.mockReturnValue({
      data: tvDetails,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    useSimilarMock.mockReturnValue({ data: [] });

    renderDetailsPage({ mediaType: 'tv' });

    expect(screen.getByRole('heading', { name: 'The Series' })).toBeInTheDocument();
    expect(screen.getByText(/3 Seasons/i)).toBeInTheDocument();
    expect(useWarmAlternateLanguageMediaDetailsMock).toHaveBeenCalledWith('tv', 20, true);
    expect(useWarmAlternateLanguageSimilarMock).toHaveBeenCalledWith('tv', 20, true);
  });

  it('renders the season episodes section for TV titles only', () => {
    renderDetailsPage();
    expect(screen.queryByLabelText('season-episodes')).not.toBeInTheDocument();

    useDetailsMock.mockReturnValue({
      data: tvDetails,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    useSimilarMock.mockReturnValue({ data: [] });

    renderDetailsPage({ mediaType: 'tv' });
    expect(screen.getByLabelText('season-episodes')).toHaveTextContent(
      'Episodes for 20',
    );
  });

  it('prefetches similar item details for the recommendation row', () => {
    renderDetailsPage();

    expect(prefetchDetailsMock).toHaveBeenCalledWith('movie', 30);
  });
});
