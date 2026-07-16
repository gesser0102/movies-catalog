import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('env', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads TMDB configuration from Vite env variables', async () => {
    vi.stubEnv('VITE_TMDB_API_BASE_URL', 'https://api.example.test');
    vi.stubEnv('VITE_TMDB_IMAGE_BASE_URL', 'https://image.example.test');

    const { env } = await import('./env');

    expect(env.tmdb).toEqual({
      apiBaseUrl: 'https://api.example.test',
      imageBaseUrl: 'https://image.example.test',
    });
  });

  it('falls back to the proxy path and default image CDN when values are absent', async () => {
    vi.stubEnv('VITE_TMDB_API_BASE_URL', undefined);
    vi.stubEnv('VITE_TMDB_IMAGE_BASE_URL', undefined);

    const { env } = await import('./env');

    // O caminho relativo é o contrato com o proxy (Vite em dev, nginx em prod).
    expect(env.tmdb.apiBaseUrl).toBe('/api/tmdb');
    expect(env.tmdb.imageBaseUrl).toBe('https://image.tmdb.org/t/p');
  });

  it('does not expose the TMDB access token to client code', async () => {
    const { env } = await import('./env');

    expect(JSON.stringify(env)).not.toContain('accessToken');
    expect(import.meta.env.VITE_TMDB_ACCESS_TOKEN).toBeUndefined();
  });
});
