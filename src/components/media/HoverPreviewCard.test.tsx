import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HoverPreviewCard } from './HoverPreviewCard';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';
import type { MediaItem, TmdbMovieDetails } from '@/types/tmdb';

const { useMediaDetailsMock } = vi.hoisted(() => ({
  useMediaDetailsMock: vi.fn(),
}));

vi.mock('@/hooks/useMediaDetails', () => ({
  useMediaDetails: useMediaDetailsMock,
}));

const item: MediaItem = {
  id: 10,
  mediaType: 'movie',
  title: 'Filme Localizado',
  overview: 'Sinopse em português que veio da listagem.',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  rating: 7.8,
  popularity: 200,
  year: 2026,
};

const details: TmdbMovieDetails = {
  id: 10,
  title: 'Localized Movie',
  original_title: 'Localized Movie',
  overview: 'English synopsis from the details query.',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  vote_average: 7.8,
  popularity: 200,
  release_date: '2026-07-14',
  genre_ids: [28],
  genres: [{ id: 28, name: 'Action' }],
  runtime: 125,
  tagline: null,
  status: 'Released',
  content_rating: 'PG-13',
  trailer: null,
};

function renderPreview() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <HoverPreviewCard
          item={item}
          anchor={new DOMRect(120, 80, 180, 270)}
          onMouseEnter={vi.fn()}
          onMouseLeave={vi.fn()}
        />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('HoverPreviewCard', () => {
  beforeEach(() => {
    localStorage.setItem('movies-catalog:language', 'en-US');
  });

  it('uses the localized overview from details instead of the card list overview', () => {
    useMediaDetailsMock.mockReturnValue({ data: details });

    renderPreview();

    expect(screen.getByText('English synopsis from the details query.')).toBeInTheDocument();
    expect(
      screen.queryByText('Sinopse em português que veio da listagem.'),
    ).not.toBeInTheDocument();
  });

  it('falls back to the card overview only while details are still loading', () => {
    useMediaDetailsMock.mockReturnValue({ data: undefined });

    renderPreview();

    expect(screen.getByText('Sinopse em português que veio da listagem.')).toBeInTheDocument();
  });

  it('renders details metadata returned by the details query', () => {
    useMediaDetailsMock.mockReturnValue({ data: details });

    renderPreview();

    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('2h 5min')).toBeInTheDocument();
    expect(screen.getByLabelText('Content rating PG-13')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      '/movies/10',
    );
  });
});
