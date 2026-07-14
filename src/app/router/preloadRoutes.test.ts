import { describe, expect, it, vi } from 'vitest';
import { preloadCatalogRoute, preloadDetailsRoute } from './preloadRoutes';

vi.mock('@/features/details/pages/DetailsPage', () => ({
  DetailsPage: () => null,
}));

vi.mock('@/features/catalog/pages/CatalogPage', () => ({
  CatalogPage: () => null,
}));

describe('preloadRoutes', () => {
  it('preloads the details route module without throwing', async () => {
    expect(() => preloadDetailsRoute()).not.toThrow();
    await vi.dynamicImportSettled();
  });

  it('preloads the catalog route module without throwing', async () => {
    expect(() => preloadCatalogRoute()).not.toThrow();
    await vi.dynamicImportSettled();
  });
});
