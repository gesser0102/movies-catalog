import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MediaSlider } from './MediaSlider';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';
import type React from 'react';
import type { MediaItem } from '@/types/tmdb';

const items: MediaItem[] = [
  {
    id: 1,
    mediaType: 'movie',
    title: 'A Odisseia',
    overview: 'Desafie os deuses.',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    rating: 5.4,
    popularity: 100,
    year: 2026,
  },
];

function renderSlider(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe('MediaSlider', () => {
  it('renders title, media cards and the see more link', () => {
    renderSlider(
      <MediaSlider
        title="Em alta"
        items={items}
        seeAllTo="/movies/catalog"
        seeAllLabel="Ver mais"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Em alta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mais: Em alta' })).toHaveAttribute(
      'href',
      '/movies/catalog',
    );
    expect(screen.getByRole('link', { name: 'A Odisseia' })).toHaveAttribute(
      'href',
      '/movies/1',
    );
  });

  it('keeps the carousel scroll padding aligned with the visual padding', () => {
    const { container } = renderSlider(<MediaSlider title="Ação" items={items} />);
    const track = container.querySelector('.scroll-px-4.tablet\\:scroll-px-6');

    expect(track).toBeInTheDocument();
  });

  it('scrolls the track by page when navigation arrows are clicked', () => {
    const scrollBy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });

    renderSlider(<MediaSlider title="Ação" items={items} />);

    fireEvent.click(screen.getByLabelText('Scroll right'));
    expect(scrollBy).toHaveBeenCalledWith({ left: 800, behavior: 'smooth' });

    fireEvent.click(screen.getByLabelText('Scroll left'));
    expect(scrollBy).toHaveBeenCalledWith({ left: -800, behavior: 'smooth' });
  });

  it('renders loading skeletons and hides empty sliders', () => {
    const loading = renderSlider(<MediaSlider title="Carregando" items={[]} isLoading />);
    expect(loading.container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(8);

    const empty = renderSlider(<MediaSlider title="Vazio" items={[]} />);
    expect(empty.container).toBeEmptyDOMElement();
  });
});
