import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

/**
 * Dedupe + micro-cache HTTP por URL para GETs da TMDB.
 *
 * O React Query deduplica por query key, mas queries diferentes podem precisar
 * da MESMA URL da TMDB (ex.: o fetch de detalhes pt-BR e o overrideImages do
 * fetch en-US).
 * Erros nunca são cacheados.
 */

export const HTTP_CACHE_TTL_MS = 2 * 60 * 1000;
export const HTTP_CACHE_MAX_ENTRIES = 100;

interface CacheEntry {
  response: AxiosResponse;
  expiresAt: number;
}

export interface DedupingCacheAdapterOptions {
  ttlMs?: number;
  maxEntries?: number;
}

function buildCacheKey(config: InternalAxiosRequestConfig): string | null {
  if ((config.method ?? 'get').toLowerCase() !== 'get') return null;

  const params = config.params as Record<string, unknown> | undefined;
  const serializedParams = params
    ? Object.keys(params)
        .sort()
        .map((key) => `${key}=${String(params[key])}`)
        .join('&')
    : '';

  return `${config.url ?? ''}?${serializedParams}`;
}

export function createDedupingCacheAdapter(
  baseAdapter: AxiosAdapter,
  options: DedupingCacheAdapterOptions = {},
): AxiosAdapter {
  const { ttlMs = HTTP_CACHE_TTL_MS, maxEntries = HTTP_CACHE_MAX_ENTRIES } = options;
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<AxiosResponse>>();

  return async (config) => {
    const key = buildCacheKey(config);
    if (!key) return baseAdapter(config);

    const entry = cache.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        cache.delete(key);
        cache.set(key, entry);
        return { ...entry.response, config };
      }
      cache.delete(key);
    }

    const pending = inFlight.get(key);
    if (pending) {
      return pending.then((response) => ({ ...response, config }));
    }

    const request = Promise.resolve(baseAdapter(config)).then(
      (response) => {
        inFlight.delete(key);
        if (response.status >= 200 && response.status < 300) {
          cache.set(key, { response, expiresAt: Date.now() + ttlMs });
          if (cache.size > maxEntries) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey !== undefined) cache.delete(oldestKey);
          }
        }
        return response;
      },
      (error: unknown) => {
        inFlight.delete(key);
        throw error;
      },
    );

    inFlight.set(key, request);
    return request.then((response) => ({ ...response, config }));
  };
}
