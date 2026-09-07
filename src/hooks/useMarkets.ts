import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import {
  fetchMarkets,
  fetchMarketById,
  fetchMarketsByCategory,
  fetchFeaturedMarket,
  fetchMarketsByStatus,
  searchMarkets,
  getMarketDataSource,
  resetMarketsCache,
} from '../services/markets';
import type { Market, MarketCategory } from '../types/market';

const STALE_TIME_MS = 30_000;

export function useMarkets(): UseQueryResult<Market[]> {
  return useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets,
    staleTime: STALE_TIME_MS,
  });
}

export function useFeaturedMarket(): UseQueryResult<Market | undefined> {
  return useQuery({
    queryKey: ['markets', 'featured'],
    queryFn: fetchFeaturedMarket,
    staleTime: STALE_TIME_MS,
  });
}

export function useMarket(id: string | undefined): UseQueryResult<Market | undefined> {
  return useQuery({
    queryKey: ['markets', 'detail', id],
    queryFn: () => fetchMarketById(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME_MS,
  });
}

export function useMarketsByCategory(category: MarketCategory | 'Trending'): UseQueryResult<Market[]> {
  return useQuery({
    queryKey: ['markets', 'category', category],
    queryFn: () => fetchMarketsByCategory(category),
    staleTime: STALE_TIME_MS,
  });
}

export function useMarketsByStatus(status: Market['status']): UseQueryResult<Market[]> {
  return useQuery({
    queryKey: ['markets', 'status', status],
    queryFn: () => fetchMarketsByStatus(status),
    staleTime: STALE_TIME_MS,
  });
}

export function useMarketSearch(query: string): UseQueryResult<Market[]> {
  return useQuery({
    queryKey: ['markets', 'search', query],
    queryFn: () => searchMarkets(query),
    enabled: query.trim().length > 0,
    staleTime: STALE_TIME_MS,
  });
}

/** Sync helper for UI that wants to show a subtle "preview data" notice. */
export { getMarketDataSource };

/**
 * Clears the service-level market cache and re-invalidates every cached
 * market query, so a "Retry" button actually re-attempts a live DreamDEX
 * fetch rather than replaying the same cached (possibly mock) result.
 */
export function useRetryMarkets(): () => void {
  const queryClient = useQueryClient();
  return () => {
    resetMarketsCache();
    queryClient.invalidateQueries({ queryKey: ['markets'] });
  };
}
