import { describe, expect, it } from 'vitest';
import { formatRating, formatReleaseDate, formatRuntime } from './format';

describe('format utilities', () => {
  it('formats TMDB ratings with one decimal place', () => {
    expect(formatRating(7)).toBe('7.0');
    expect(formatRating(7.366)).toBe('7.4');
  });

  it('formats release dates using the selected language without timezone drift', () => {
    expect(formatReleaseDate('2026-07-14', 'en-US')).toBe('July 14, 2026');
    expect(formatReleaseDate('2026-07-14', 'pt-BR')).toBe('14 de julho de 2026');
  });

  it('returns null for empty or impossible release dates', () => {
    expect(formatReleaseDate(undefined, 'pt-BR')).toBeNull();
    expect(formatReleaseDate('2026-02-31', 'pt-BR')).toBeNull();
    expect(formatReleaseDate('not-a-date', 'pt-BR')).toBeNull();
  });

  it('formats runtimes only when minutes are positive', () => {
    expect(formatRuntime(45)).toBe('45min');
    expect(formatRuntime(120)).toBe('2h');
    expect(formatRuntime(137)).toBe('2h 17min');
    expect(formatRuntime(0)).toBeNull();
    expect(formatRuntime(null)).toBeNull();
  });
});
