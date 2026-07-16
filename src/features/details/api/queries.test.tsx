import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCredits,
  useSeasonEpisodes,
  useSimilar,
  useWarmAlternateLanguageSeasonEpisodes,
  useWarmAlternateLanguageSimilar,
} from './queries';
import { I18nProvider } from '@/contexts/i18n/I18nProvider';

const { getCreditsMock, getSimilarMock, getSeasonEpisodesMock } = vi.hoisted(() => ({
  getCreditsMock: vi.fn(),
  getSimilarMock: vi.fn(),
  getSeasonEpisodesMock: vi.fn(),
}));

vi.mock('@/lib/tmdb/endpoints', () => ({
  getCredits: getCreditsMock,
  getSimilar: getSimilarMock,
  getSeasonEpisodes: getSeasonEpisodesMock,
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <I18nProvider>{children}</I18nProvider>
      </QueryClientProvider>
    );
  };
}

async function flushMicrotasks() {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe('details api queries', () => {
  beforeEach(() => {
    localStorage.setItem('movies-catalog:language', 'en-US');
    getCreditsMock.mockReset().mockResolvedValue({ cast: [], crew: [] });
    getSimilarMock.mockReset().mockResolvedValue([]);
    getSeasonEpisodesMock.mockReset().mockResolvedValue([]);
  });

  it('fetches credits without language in the key', async () => {
    const { result } = renderHook(() => useCredits('movie', 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual({ cast: [], crew: [] }));
    expect(getCreditsMock).toHaveBeenCalledWith('movie', 5);
  });

  it('does not fetch credits for invalid ids', async () => {
    renderHook(() => useCredits('movie', 0), { wrapper: createWrapper() });

    await flushMicrotasks();
    expect(getCreditsMock).not.toHaveBeenCalled();
  });

  it('fetches similar titles in the active language', async () => {
    const { result } = renderHook(() => useSimilar('tv', 9), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSimilarMock).toHaveBeenCalledWith('tv', 9, 'en-US');
  });

  it('warms similar titles in the alternate language', async () => {
    renderHook(() => useWarmAlternateLanguageSimilar('movie', 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(getSimilarMock).toHaveBeenCalledWith('movie', 5, 'pt-BR'),
    );
  });

  it('does not warm similar titles when disabled or id is invalid', async () => {
    renderHook(() => useWarmAlternateLanguageSimilar('movie', 0), {
      wrapper: createWrapper(),
    });
    renderHook(() => useWarmAlternateLanguageSimilar('movie', 5, false), {
      wrapper: createWrapper(),
    });

    await flushMicrotasks();
    expect(getSimilarMock).not.toHaveBeenCalled();
  });

  it('fetches season episodes for the selected season in the active language', async () => {
    const { result } = renderHook(() => useSeasonEpisodes(7, 2), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSeasonEpisodesMock).toHaveBeenCalledWith(7, 2, 'en-US');
  });

  it('does not fetch episodes when no season is selected', async () => {
    renderHook(() => useSeasonEpisodes(7, null), { wrapper: createWrapper() });

    await flushMicrotasks();
    expect(getSeasonEpisodesMock).not.toHaveBeenCalled();
  });

  it('warms the selected season in the alternate language', async () => {
    renderHook(() => useWarmAlternateLanguageSeasonEpisodes(7, 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(getSeasonEpisodesMock).toHaveBeenCalledWith(7, 1, 'pt-BR'),
    );
  });

  it('does not warm episodes without a selected season', async () => {
    renderHook(() => useWarmAlternateLanguageSeasonEpisodes(7, null), {
      wrapper: createWrapper(),
    });

    await flushMicrotasks();
    expect(getSeasonEpisodesMock).not.toHaveBeenCalled();
  });
});
