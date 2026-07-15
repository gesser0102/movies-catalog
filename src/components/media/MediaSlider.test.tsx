import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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
  {
    id: 2,
    mediaType: 'movie',
    title: 'Outro Filme',
    overview: 'Outra sinopse.',
    posterPath: '/poster-2.jpg',
    backdropPath: '/backdrop-2.jpg',
    rating: 7.4,
    popularity: 80,
    year: 2025,
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

  it('keeps the Embla viewport aligned with the visual page padding', () => {
    const { container } = renderSlider(<MediaSlider title="Acao" items={items} />);
    const viewport = container.querySelector('.overflow-hidden.px-4.tablet\\:px-6');

    expect(viewport).toBeInTheDocument();
  });

  it('uses fixed slide sizes so the viewport controls how many cards are visible', () => {
    const { container } = renderSlider(<MediaSlider title="Acao" items={items} />);
    const slide = container.querySelector('.flex-\\[0_0_150px\\].tablet\\:flex-\\[0_0_180px\\]');

    expect(slide).toBeInTheDocument();
  });

  it('keeps navigation buttons wired for Embla scrolling', () => {
    renderSlider(<MediaSlider title="Acao" items={items} />);

    expect(() => fireEvent.click(screen.getByLabelText('Scroll right'))).not.toThrow();
    expect(() => fireEvent.click(screen.getByLabelText('Scroll left'))).not.toThrow();
  });

  it('renders loading skeletons and hides empty sliders', () => {
    const loading = renderSlider(<MediaSlider title="Carregando" items={[]} isLoading />);
    expect(loading.container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(8);

    const empty = renderSlider(<MediaSlider title="Vazio" items={[]} />);
    expect(empty.container).toBeEmptyDOMElement();
  });
});
