import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createDedupingCacheAdapter, HTTP_CACHE_TTL_MS } from './httpCache';

function config(
  url: string,
  params?: Record<string, unknown>,
  method = 'get',
): InternalAxiosRequestConfig {
  return { url, params, method, headers: {} } as InternalAxiosRequestConfig;
}

function response(data: unknown, status = 200): AxiosResponse {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

describe('createDedupingCacheAdapter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shares a single request between concurrent identical GETs', async () => {
    let resolveBase: (value: AxiosResponse) => void = () => {};
    const baseAdapter = vi.fn(
      () =>
        new Promise<AxiosResponse>((resolve) => {
          resolveBase = resolve;
        }),
    );
    const adapter = createDedupingCacheAdapter(baseAdapter);

    const first = adapter(config('/movie/1', { language: 'pt-BR' }));
    const second = adapter(config('/movie/1', { language: 'pt-BR' }));
    resolveBase(response({ id: 1 }));

    const [a, b] = await Promise.all([first, second]);

    expect(baseAdapter).toHaveBeenCalledTimes(1);
    expect(a.data).toEqual({ id: 1 });
    expect(b.data).toEqual({ id: 1 });
  });

  it('serves repeated GETs from cache within the TTL and refetches after it expires', async () => {
    vi.useFakeTimers();
    const baseAdapter = vi.fn(async () => response({ id: 1 }));
    const adapter = createDedupingCacheAdapter(baseAdapter);

    await adapter(config('/movie/1', { language: 'pt-BR' }));
    await adapter(config('/movie/1', { language: 'pt-BR' }));
    expect(baseAdapter).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(HTTP_CACHE_TTL_MS + 1);
    await adapter(config('/movie/1', { language: 'pt-BR' }));
    expect(baseAdapter).toHaveBeenCalledTimes(2);
  });

  it('treats the same params in different order as the same URL', async () => {
    const baseAdapter = vi.fn(async () => response({ id: 1 }));
    const adapter = createDedupingCacheAdapter(baseAdapter);

    await adapter(
      config('/movie/1', { language: 'pt-BR', append_to_response: 'videos' }),
    );
    await adapter(
      config('/movie/1', { append_to_response: 'videos', language: 'pt-BR' }),
    );

    expect(baseAdapter).toHaveBeenCalledTimes(1);
  });

  it('does not mix responses from different params', async () => {
    const baseAdapter = vi.fn(async (requestConfig: InternalAxiosRequestConfig) =>
      response({ language: (requestConfig.params as { language: string }).language }),
    );
    const adapter = createDedupingCacheAdapter(baseAdapter);

    const ptBr = await adapter(config('/movie/1', { language: 'pt-BR' }));
    const enUs = await adapter(config('/movie/1', { language: 'en-US' }));

    expect(baseAdapter).toHaveBeenCalledTimes(2);
    expect(ptBr.data).toEqual({ language: 'pt-BR' });
    expect(enUs.data).toEqual({ language: 'en-US' });
  });

  it('never caches failures', async () => {
    const baseAdapter = vi
      .fn<(requestConfig: InternalAxiosRequestConfig) => Promise<AxiosResponse>>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(response({ id: 1 }));
    const adapter = createDedupingCacheAdapter(baseAdapter);

    await expect(adapter(config('/movie/1'))).rejects.toThrow('network down');

    const retried = await adapter(config('/movie/1'));
    expect(retried.data).toEqual({ id: 1 });
    expect(baseAdapter).toHaveBeenCalledTimes(2);
  });

  it('bypasses the cache for non-GET requests', async () => {
    const baseAdapter = vi.fn(async () => response({ ok: true }));
    const adapter = createDedupingCacheAdapter(baseAdapter);

    await adapter(config('/session', undefined, 'post'));
    await adapter(config('/session', undefined, 'post'));

    expect(baseAdapter).toHaveBeenCalledTimes(2);
  });

  it('evicts the oldest entry when the cache exceeds max entries', async () => {
    const baseAdapter = vi.fn(async () => response({ id: 1 }));
    const adapter = createDedupingCacheAdapter(baseAdapter, { maxEntries: 2 });

    await adapter(config('/movie/1'));
    await adapter(config('/movie/2'));
    await adapter(config('/movie/3'));
    expect(baseAdapter).toHaveBeenCalledTimes(3);

    // /movie/1 foi evictado; /movie/2 e /movie/3 continuam cacheados.
    await adapter(config('/movie/2'));
    await adapter(config('/movie/3'));
    expect(baseAdapter).toHaveBeenCalledTimes(3);

    await adapter(config('/movie/1'));
    expect(baseAdapter).toHaveBeenCalledTimes(4);
  });

  it('returns each caller a response bound to its own request config', async () => {
    const baseAdapter = vi.fn(async () => response({ id: 1 }));
    const adapter = createDedupingCacheAdapter(baseAdapter);

    const firstConfig = config('/movie/1', { language: 'pt-BR' });
    const secondConfig = config('/movie/1', { language: 'pt-BR' });
    const first = await adapter(firstConfig);
    const second = await adapter(secondConfig);

    expect(first.config).toBe(firstConfig);
    expect(second.config).toBe(secondConfig);
  });
});
