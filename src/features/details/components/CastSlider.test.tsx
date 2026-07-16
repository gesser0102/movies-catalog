import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CastSlider } from './CastSlider';
import type { CastMember } from '@/types/tmdb';

function castMember(id: number): CastMember {
  return {
    id,
    name: `Actor ${id}`,
    character: `Character ${id}`,
    profile_path: null,
    order: id,
  };
}

function setTrackMetrics(
  track: HTMLElement,
  {
    clientWidth,
    scrollLeft,
    scrollWidth,
  }: { clientWidth: number; scrollLeft: number; scrollWidth: number },
) {
  Object.defineProperty(track, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  });
  Object.defineProperty(track, 'scrollLeft', {
    configurable: true,
    value: scrollLeft,
  });
  Object.defineProperty(track, 'scrollWidth', {
    configurable: true,
    value: scrollWidth,
  });
}

describe('CastSlider', () => {
  it('shows only arrows for directions that still have scrollable cast items', async () => {
    render(
      <CastSlider
        title="Elenco principal"
        members={Array.from({ length: 8 }, (_, index) => castMember(index + 1))}
        actionLabel="Ver elenco completo"
        onAction={vi.fn()}
      />,
    );

    const track = screen.getByText('Actor 1').closest('.overflow-x-auto');
    expect(track).toBeInTheDocument();

    setTrackMetrics(track as HTMLElement, {
      clientWidth: 500,
      scrollLeft: 0,
      scrollWidth: 900,
    });
    fireEvent.scroll(track as HTMLElement);

    expect(screen.queryByLabelText('Scroll cast left')).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Scroll cast right')).toBeInTheDocument();

    setTrackMetrics(track as HTMLElement, {
      clientWidth: 500,
      scrollLeft: 400,
      scrollWidth: 900,
    });
    fireEvent.scroll(track as HTMLElement);

    expect(await screen.findByLabelText('Scroll cast left')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByLabelText('Scroll cast right')).not.toBeInTheDocument();
    });
  });

  it('hides both arrows when the cast track does not overflow', async () => {
    render(
      <CastSlider
        title="Elenco principal"
        members={Array.from({ length: 5 }, (_, index) => castMember(index + 1))}
        actionLabel="Ver elenco completo"
        onAction={vi.fn()}
      />,
    );

    const track = screen.getByText('Actor 1').closest('.overflow-x-auto');
    expect(track).toBeInTheDocument();

    setTrackMetrics(track as HTMLElement, {
      clientWidth: 900,
      scrollLeft: 0,
      scrollWidth: 900,
    });
    fireEvent.scroll(track as HTMLElement);

    await waitFor(() => {
      expect(screen.queryByLabelText('Scroll cast left')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Scroll cast right')).not.toBeInTheDocument();
    });
  });
});
