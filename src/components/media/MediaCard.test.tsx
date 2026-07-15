import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaCard } from './MediaCard';
import type { MediaItem } from '@/types/tmdb';

const { prefetchMock } = vi.hoisted(() => ({
  prefetchMock: vi.fn(),
}));

let originalIntersectionObserver: typeof IntersectionObserver | undefined;
let didMockIntersectionObserver = false;

vi.mock('@/hooks/useMediaDetails', () => ({
  usePrefetchMediaDetails: () => prefetchMock,
}));

vi.mock('./HoverPreviewCard', () => ({
  HoverPreviewCard: ({ item }: { item: MediaItem }) => (
    <div data-testid="hover-preview">Preview: {item.title}</div>
  ),
}));

const item: MediaItem = {
  id: 77,
  mediaType: 'movie',
  title: 'Preview Movie',
  overview: 'Overview',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  rating: 7.1,
  popularity: 100,
  year: 2026,
};

function renderCard(cardItem: MediaItem = item) {
  return render(
    <MemoryRouter>
      <MediaCard item={cardItem} variant="slider" />
    </MemoryRouter>,
  );
}

function setHoverSupport(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(hover: hover)' ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function mockIntersectionObserver() {
  let observerCallback: IntersectionObserverCallback = () => undefined;
  const observe = vi.fn();
  const disconnect = vi.fn();

  const IntersectionObserverMock = vi.fn(function (
    callback: IntersectionObserverCallback,
  ) {
    observerCallback = callback;
    return {
      observe,
      disconnect,
      unobserve: vi.fn(),
      takeRecords: vi.fn(() => []),
      root: null,
      rootMargin: '',
      thresholds: [],
    };
  });

  window.IntersectionObserver = IntersectionObserverMock;
  didMockIntersectionObserver = true;

  return {
    disconnect,
    observe,
    trigger: (isIntersecting = true) => {
      observerCallback(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    },
  };
}

describe('MediaCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    setHoverSupport(true);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(20, 30, 180, 270),
    );
    originalIntersectionObserver = window.IntersectionObserver;
    didMockIntersectionObserver = false;
  });

  afterEach(() => {
    if (didMockIntersectionObserver) {
      (window as Window & { IntersectionObserver?: typeof IntersectionObserver })
        .IntersectionObserver = originalIntersectionObserver;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders a poster link to the details page with title and year overlay', () => {
    renderCard();

    const link = screen.getByRole('link', { name: 'Preview Movie' });
    expect(link).toHaveAttribute('href', '/movies/77');
    expect(screen.getByRole('img', { name: 'Preview Movie' })).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w342/poster.jpg',
    );
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByLabelText('User score 71%')).toBeInTheDocument();
  });

  it('renders a broken image fallback when there is no poster', () => {
    renderCard({ ...item, posterPath: null, rating: 0 });

    expect(screen.queryByRole('img', { name: 'Preview Movie' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Preview Movie')).toHaveLength(2);
  });

  it('prefetches details and opens the hover preview on pointer hover devices', () => {
    renderCard();

    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Preview Movie' }));

    expect(prefetchMock).toHaveBeenCalledWith('movie', 77, {
      includeAlternateLanguage: true,
    });
    expect(screen.queryByTestId('hover-preview')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(380);
    });

    expect(screen.getByTestId('hover-preview')).toHaveTextContent('Preview: Preview Movie');
  });

  it('prefetches current and alternate language details when the card approaches the viewport', () => {
    const observer = mockIntersectionObserver();
    renderCard();

    expect(observer.observe).toHaveBeenCalled();
    expect(prefetchMock).not.toHaveBeenCalled();

    act(() => {
      observer.trigger();
      vi.advanceTimersByTime(120);
    });

    expect(prefetchMock).toHaveBeenCalledWith('movie', 77, {
      includeAlternateLanguage: true,
    });
  });

  it('prefetches details but does not open hover preview on touch-only devices', () => {
    setHoverSupport(false);
    renderCard();

    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Preview Movie' }));
    act(() => {
      vi.advanceTimersByTime(380);
    });

    expect(prefetchMock).toHaveBeenCalledWith('movie', 77, {
      includeAlternateLanguage: true,
    });
    expect(screen.queryByTestId('hover-preview')).not.toBeInTheDocument();
  });

  it('closes the preview when the page scrolls', () => {
    renderCard();

    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Preview Movie' }));
    act(() => {
      vi.advanceTimersByTime(380);
    });
    expect(screen.getByTestId('hover-preview')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(screen.queryByTestId('hover-preview')).not.toBeInTheDocument();
  });
});
