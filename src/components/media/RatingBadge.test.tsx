import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RatingBadge } from './RatingBadge';

describe('RatingBadge', () => {
  it('converts TMDB 0-10 ratings into percentages', () => {
    render(<RatingBadge rating={7.5} />);

    expect(screen.getByLabelText('User score 75%')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('does not render when a title has no user score', () => {
    const { container } = render(<RatingBadge rating={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('clamps malformed ratings to 100%', () => {
    render(<RatingBadge rating={11.2} />);

    expect(screen.getByLabelText('User score 100%')).toBeInTheDocument();
  });
});
