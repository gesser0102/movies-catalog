import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';
import { CatalogPage } from './CatalogPage';
import type { MediaItem } from '@/types/tmdb';

const { useCatalogListingMock, useGenresMock } = vi.hoisted(() => ({
  useCatalogListingMock: vi.fn(),
  useGenresMock: vi.fn(),
}));

vi.mock('../api/queries', () => ({
  useCatalogListing: useCatalogListingMock,
  useGenres: useGenresMock,
}));

vi.mock('@/components/media/MediaCard', () => ({
  MediaCard: ({ item }: { item: MediaItem }) => (
    <a href={`/${item.mediaType === 'movie' ? 'movies' : 'series'}/${item.id}`}>
      {item.title}
    </a>
  ),
}));

const movieItem = {
  id: 1,
  mediaType: 'movie',
  title: 'Catalog Movie',
  overview: 'Overview',
  posterPath: null,
  backdropPath: null,
  rating: 7,
  popularity: 100,
  year: 2026,
} satisfies MediaItem;

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.search}</span>;
}

function renderCatalog(initialPath = '/movies/catalog') {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/movies/catalog"
            element={
              <>
                <CatalogPage mediaType="movie" />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe('CatalogPage genre filter', () => {
  beforeEach(() => {
    localStorage.setItem('movies-catalog:language', 'en-US');
    useGenresMock.mockReturnValue({
      data: [
        { id: 28, name: 'Action' },
        { id: 35, name: 'Comedy' },
      ],
    });
    useCatalogListingMock.mockReturnValue({
      data: {
        page: 1,
        results: [movieItem],
        total_pages: 2,
        total_results: 21,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isPlaceholderData: false,
    });
  });

  it('uses the genre id from the URL and shows the genre name as the title', () => {
    renderCatalog('/movies/catalog?genre=28');

    expect(screen.getByRole('heading', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByText('Catalog Movie')).toBeInTheDocument();
    expect(useCatalogListingMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        mediaType: 'movie',
        genreId: 28,
        collection: undefined,
      }),
    );
  });

  it('updates the URL when the user selects a genre', async () => {
    renderCatalog();

    await userEvent.click(screen.getByRole('combobox', { name: 'Genre' }));
    await userEvent.click(screen.getByRole('option', { name: 'Comedy' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('genre=35');
    });
    expect(useCatalogListingMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ genreId: 35 }),
    );
  });

  it('hides genre filtering and ignores genre params when a collection source is selected', () => {
    renderCatalog('/movies/catalog?source=popular&genre=28');

    expect(screen.queryByRole('combobox', { name: 'Genre' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Popular' })).toBeInTheDocument();
    expect(useCatalogListingMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        collection: 'popular',
        genreId: undefined,
      }),
    );
  });
});
