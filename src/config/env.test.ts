import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('env', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads TMDB configuration from Vite env variables', async () => {
    vi.stubEnv('VITE_TMDB_ACCESS_TOKEN', 'token');
    vi.stubEnv('VITE_TMDB_API_BASE_URL', 'https://api.example.test');
    vi.stubEnv('VITE_TMDB_IMAGE_BASE_URL', 'https://image.example.test');

    const { env } = await import('./env');

    expect(env.tmdb).toEqual({
      accessToken: 'token',
      apiBaseUrl: 'https://api.example.test',
      imageBaseUrl: 'https://image.example.test',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns for missing required values and falls back when optional values are absent', async () => {
    vi.stubEnv('VITE_TMDB_ACCESS_TOKEN', '');
    vi.stubEnv('VITE_TMDB_API_BASE_URL', undefined);
    vi.stubEnv('VITE_TMDB_IMAGE_BASE_URL', undefined);

    const { env } = await import('./env');

    expect(env.tmdb.accessToken).toBe('');
    expect(env.tmdb.apiBaseUrl).toBe('https://api.themoviedb.org/3');
    expect(env.tmdb.imageBaseUrl).toBe('https://image.tmdb.org/t/p');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('VITE_TMDB_ACCESS_TOKEN'));
  });
});
