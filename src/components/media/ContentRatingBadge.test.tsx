import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentRatingBadge } from './ContentRatingBadge';

describe('ContentRatingBadge', () => {
  it('normalizes and renders Brazilian age ratings', () => {
    render(<ContentRatingBadge rating=" 14 " />);

    const badge = screen.getByLabelText('Content rating 14');
    expect(badge).toHaveTextContent('14');
    expect(badge).toHaveStyle({ backgroundColor: '#f58220' });
  });

  it('supports international rating labels with their standard color group', () => {
    render(<ContentRatingBadge rating="PG-13" />);

    const badge = screen.getByLabelText('Content rating PG-13');
    expect(badge).toHaveTextContent('PG-13');
    expect(badge).toHaveStyle({ backgroundColor: '#f6c400' });
  });

  it('does not render empty ratings', () => {
    const { container } = render(<ContentRatingBadge rating="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
