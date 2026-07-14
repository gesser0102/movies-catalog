import { describe, expect, it } from 'vitest';
import { tmdbClient, TmdbApiError } from './client';

function responseErrorHandler() {
  const interceptors = tmdbClient.interceptors.response as unknown as {
    handlers: Array<{
      rejected: (error: unknown) => Promise<never>;
    }>;
  };

  return interceptors.handlers[0].rejected;
}

describe('TMDB client', () => {
  it('creates domain errors for network failures', async () => {
    await expect(responseErrorHandler()({ request: {} })).rejects.toMatchObject({
      name: 'TmdbApiError',
      status: undefined,
      isNetworkError: true,
    });
  });

  it('uses TMDB status messages when the API returns one', async () => {
    await expect(
      responseErrorHandler()({
        response: {
          status: 429,
          data: { status_message: 'Rate limit exceeded.' },
        },
      }),
    ).rejects.toMatchObject({
      name: 'TmdbApiError',
      message: 'Rate limit exceeded.',
      status: 429,
      isNetworkError: false,
    });
  });

  it('falls back to friendly messages for common API errors', async () => {
    await expect(
      responseErrorHandler()({
        response: {
          status: 401,
          data: {},
        },
      }),
    ).rejects.toMatchObject({
      message: 'Credencial da TMDB inválida. Confira o token no .env.local.',
      status: 401,
    });

    await expect(
      responseErrorHandler()({
        response: {
          status: 404,
          data: {},
        },
      }),
    ).rejects.toMatchObject({
      message: 'Conteúdo não encontrado.',
      status: 404,
    });
  });

  it('preserves explicit TmdbApiError properties', () => {
    const error = new TmdbApiError('Boom', 500, true);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TmdbApiError');
    expect(error.message).toBe('Boom');
    expect(error.status).toBe(500);
    expect(error.isNetworkError).toBe(true);
  });
});
