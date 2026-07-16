import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CastSlider } from './CastSlider';
import type { CastMember } from '@/types/tmdb';

const emblaApiMock = vi.hoisted(() => ({
  canScrollNext: vi.fn(() => true),
  canScrollPrev: vi.fn(() => false),
  off: vi.fn(),
  on: vi.fn(),
  scrollNext: vi.fn(),
  scrollPrev: vi.fn(),
}));

const emblaHookMock = vi.hoisted(() => ({
  emblaRef: vi.fn(),
  useEmblaCarousel: vi.fn(),
}));

vi.mock('embla-carousel-react', () => ({
  default: emblaHookMock.useEmblaCarousel,
}));

function castMember(id: number): CastMember {
  return {
    id,
    name: `Actor ${id}`,
    character: `Character ${id}`,
    profile_path: null,
    order: id,
  };
}

function renderCastSlider(count: number) {
  return render(
    <CastSlider
      title="Elenco principal"
      members={Array.from({ length: count }, (_, index) => castMember(index + 1))}
      actionLabel="Ver elenco completo"
      onAction={vi.fn()}
    />,
  );
}

describe('CastSlider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emblaHookMock.useEmblaCarousel.mockReturnValue([
      emblaHookMock.emblaRef,
      emblaApiMock,
    ]);
    emblaApiMock.canScrollPrev.mockReturnValue(false);
    emblaApiMock.canScrollNext.mockReturnValue(true);
  });

  it('keeps the compact cast layout inactive when there are few members', () => {
    renderCastSlider(4);

    const options = emblaHookMock.useEmblaCarousel.mock.calls[0][0];

    expect(options.active).toBe(false);
    expect(screen.getByText('Actor 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Scroll cast left')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Scroll cast right')).not.toBeInTheDocument();
  });

  it('uses Embla for larger cast lists with mobile free drag and desktop grouped snaps', () => {
    renderCastSlider(8);

    const options = emblaHookMock.useEmblaCarousel.mock.calls[0][0];

    expect(options.active).toBe(true);
    expect(options.dragFree).toBe(true);
    expect(options.slidesToScroll).toBe(1);
    expect(options.breakpoints['(min-width: 768px)'].dragFree).toBe(false);
    expect(options.breakpoints['(min-width: 768px)'].slidesToScroll).toBe(4);
    expect(screen.getByText('Actor 8')).toBeInTheDocument();
  });

  it('shows only arrows for directions that still have scrollable cast items', async () => {
    renderCastSlider(8);

    expect(screen.queryByLabelText('Scroll cast left')).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Scroll cast right')).toBeInTheDocument();

    emblaApiMock.canScrollPrev.mockReturnValue(true);
    emblaApiMock.canScrollNext.mockReturnValue(false);

    const selectHandler = emblaApiMock.on.mock.calls.find(
      ([eventName]) => eventName === 'select',
    )?.[1];
    selectHandler?.();

    expect(await screen.findByLabelText('Scroll cast left')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByLabelText('Scroll cast right')).not.toBeInTheDocument();
    });
  });

  it('keeps navigation buttons wired for Embla scrolling', async () => {
    emblaApiMock.canScrollPrev.mockReturnValue(true);
    emblaApiMock.canScrollNext.mockReturnValue(true);

    renderCastSlider(8);

    fireEvent.click(await screen.findByLabelText('Scroll cast right'));
    fireEvent.click(await screen.findByLabelText('Scroll cast left'));

    expect(emblaApiMock.scrollNext).toHaveBeenCalledTimes(1);
    expect(emblaApiMock.scrollPrev).toHaveBeenCalledTimes(1);
  });
});
