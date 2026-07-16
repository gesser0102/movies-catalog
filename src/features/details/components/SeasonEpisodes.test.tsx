import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';
import { SeasonEpisodes } from './SeasonEpisodes';
import type { TmdbEpisode, TmdbSeasonSummary } from '@/types/tmdb';

const { useSeasonEpisodesMock, useWarmAlternateLanguageSeasonEpisodesMock } =
  vi.hoisted(() => ({
    useSeasonEpisodesMock: vi.fn(),
    useWarmAlternateLanguageSeasonEpisodesMock: vi.fn(),
  }));

vi.mock('../api/queries', () => ({
  useSeasonEpisodes: useSeasonEpisodesMock,
  useWarmAlternateLanguageSeasonEpisodes: useWarmAlternateLanguageSeasonEpisodesMock,
}));

function season(overrides: Partial<TmdbSeasonSummary>): TmdbSeasonSummary {
  return {
    id: 1,
    season_number: 1,
    name: 'Season 1',
    overview: '',
    poster_path: null,
    episode_count: 2,
    air_date: '2026-01-01',
    vote_average: 7,
    ...overrides,
  };
}

const seasons: TmdbSeasonSummary[] = [
  season({ id: 90, season_number: 0, name: 'Specials' }),
  season({ id: 101, season_number: 1, name: 'Season 1' }),
  season({ id: 102, season_number: 2, name: 'Season 2', episode_count: 8 }),
];

const episodes: TmdbEpisode[] = [
  {
    id: 1,
    episode_number: 1,
    season_number: 1,
    name: 'Pilot',
    overview: 'First episode overview.',
    still_path: null,
    air_date: '2026-01-01',
    runtime: 45,
    vote_average: 8,
  },
  {
    id: 2,
    episode_number: 2,
    season_number: 1,
    name: 'Silent',
    overview: '',
    still_path: null,
    air_date: '2026-01-08',
    runtime: 45,
    vote_average: 7,
  },
  {
    id: 3,
    episode_number: 3,
    season_number: 1,
    name: 'Episode 3',
    overview: 'Third episode overview.',
    still_path: null,
    air_date: '2026-01-15',
    runtime: 45,
    vote_average: 7,
  },
];

function renderSeasonEpisodes(tvId = 7, list = seasons) {
  return render(
    <I18nProvider>
      <SeasonEpisodes tvId={tvId} seasons={list} />
    </I18nProvider>,
  );
}

describe('SeasonEpisodes', () => {
  beforeEach(() => {
    localStorage.setItem('movies-catalog:language', 'en-US');
    useSeasonEpisodesMock.mockReturnValue({
      data: episodes,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders episodes as accordion items with number and title', () => {
    renderSeasonEpisodes();

    const pilot = screen.getByRole('button', { name: /Episode 1 — Pilot/ });
    expect(pilot).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands an episode to reveal its overview', async () => {
    const user = userEvent.setup();
    renderSeasonEpisodes();

    const pilot = screen.getByRole('button', { name: /Episode 1 — Pilot/ });
    await user.click(pilot);

    expect(pilot).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('First episode overview.')).toBeVisible();
  });

  it('renders episodes without overview as plain non-expandable rows', () => {
    renderSeasonEpisodes();

    expect(screen.getByText(/Episode 2 — Silent/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Episode 2 — Silent/ }),
    ).not.toBeInTheDocument();
  });

  it('does not repeat the prefix when the episode title is already generic', () => {
    renderSeasonEpisodes();

    expect(screen.getByRole('button', { name: /^Episode 3$/ })).toBeInTheDocument();
    expect(screen.queryByText('Episode 3 — Episode 3')).not.toBeInTheDocument();
  });

  it('hides specials, selects the first real season and warms the alternate language', () => {
    renderSeasonEpisodes();

    expect(screen.getByRole('combobox')).toHaveTextContent('Season 1');
    expect(screen.queryByText('Specials')).not.toBeInTheDocument();
    expect(useSeasonEpisodesMock).toHaveBeenLastCalledWith(7, 1);
    expect(useWarmAlternateLanguageSeasonEpisodesMock).toHaveBeenLastCalledWith(7, 1);
  });

  it('requests the newly selected season through the selector', async () => {
    const user = userEvent.setup();
    renderSeasonEpisodes();

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Season 2' }));

    expect(useSeasonEpisodesMock).toHaveBeenLastCalledWith(7, 2);
  });

  it('renders nothing when there is no selectable season', () => {
    const { container } = renderSeasonEpisodes(7, [
      season({ id: 90, season_number: 0, name: 'Specials' }),
    ]);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders skeleton rows while episodes are loading', () => {
    useSeasonEpisodesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderSeasonEpisodes();

    expect(container.getElementsByClassName('MuiSkeleton-root').length).toBe(6);
    expect(screen.queryByRole('button', { name: /Episode/ })).not.toBeInTheDocument();
  });

  it('shows the error state and retries the season fetch', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    useSeasonEpisodesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Season unavailable'),
      refetch,
    });

    renderSeasonEpisodes();

    expect(screen.getByText('Season unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
