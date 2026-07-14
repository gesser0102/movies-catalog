import { describe, expect, it } from 'vitest';
import { backdropUrl, posterUrl, profileUrl } from './images';

describe('TMDB image URL helpers', () => {
  it('returns null when TMDB does not provide an image path', () => {
    expect(posterUrl(null)).toBeNull();
    expect(backdropUrl(null)).toBeNull();
    expect(profileUrl(null)).toBeNull();
  });

  it('builds image URLs with the configured TMDB base URL and requested size', () => {
    expect(posterUrl('/poster.jpg')).toBe('https://image.tmdb.org/t/p/w342/poster.jpg');
    expect(posterUrl('/poster.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
    expect(backdropUrl('/backdrop.jpg', 'w780')).toBe('https://image.tmdb.org/t/p/w780/backdrop.jpg');
    expect(profileUrl('/profile.jpg', 'h632')).toBe('https://image.tmdb.org/t/p/h632/profile.jpg');
  });
});
