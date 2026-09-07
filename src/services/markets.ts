import { getMockMarkets } from '../data/mockMarkets';
import { fetchLiveBinaryMarkets, fetchMarketOrderBook, DreamDexUnavailableError } from './somnia/markets';
import { adaptBinaryMarkets, deriveImpliedYesProbability } from './somnia/adapter';
import type { Market, MarketCategory } from '../types/market';

/**
 * Market service boundary.
 *
 * UI components and pages should only ever call functions from this file —
 * never import `data/mockMarkets` or `services/somnia/*` directly.
 *
 * Resolution order, cached for the lifetime of the page session:
 *   1. Try real DreamDEX/Somnia binary Event Contract markets.
 *   2. On any failure, network issue, or empty response, log a clear
 *      development warning and fall back to mock data.
 * The app never throws past this boundary — every exported function here
 * always resolves.
 */

export type MarketDataSource = 'live' | 'mock';

let lastDataSource: MarketDataSource = 'mock';
let lastError: string | null = null;
let cachedMarketsPromise: Promise<Market[]> | null = null;

export function getMarketDataSource(): MarketDataSource {
  return lastDataSource;
}

/** Message from the last DreamDEX fetch failure, if the app is currently on mock fallback. */
export function getLastMarketError(): string | null {
  return lastError;
}

async function resolveMarkets(): Promise<Market[]> {
  try {
    const raw = await fetchLiveBinaryMarkets();
    const adapted = adaptBinaryMarkets(raw);
    if (adapted.length === 0) {
      console.warn('[markets] DreamDEX returned no usable binary markets — falling back to mock data.');
      lastDataSource = 'mock';
      lastError = null;
      return getMockMarkets();
    }
    lastDataSource = 'live';
    lastError = null;
    // Live markets first, most-recently-closing after that.
    return adapted.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      return new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime();
    });
  } catch (error) {
    if (error instanceof DreamDexUnavailableError) {
      console.warn(`[markets] DreamDEX unavailable (${error.message}) — using mock data.`, error.cause);
      lastError = error.message;
    } else {
      console.warn('[markets] Unexpected error fetching live markets — using mock data.', error);
      lastError = 'Unexpected error fetching live markets.';
    }
    lastDataSource = 'mock';
    return getMockMarkets();
  }
}

function getMarketsInternal(): Promise<Market[]> {
  if (!cachedMarketsPromise) {
    cachedMarketsPromise = resolveMarkets();
  }
  return cachedMarketsPromise;
}

/** Clears the cached resolution — used by the retry action in error states. */
export function resetMarketsCache(): void {
  cachedMarketsPromise = null;
}

export async function fetchMarkets(): Promise<Market[]> {
  return getMarketsInternal();
}

export async function fetchMarketsByCategory(category: MarketCategory | 'Trending'): Promise<Market[]> {
  const markets = await getMarketsInternal();
  if (category === 'Trending') {
    return [...markets].sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0));
  }
  return markets.filter((market) => market.category === category);
}

export async function fetchMarketById(id: string): Promise<Market | undefined> {
  const markets = await getMarketsInternal();
  return markets.find((market) => market.id === id);
}

export async function fetchFeaturedMarket(): Promise<Market | undefined> {
  const markets = await getMarketsInternal();
  return [...markets].sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0))[0];
}

export async function fetchMarketsByStatus(status: Market['status']): Promise<Market[]> {
  const markets = await getMarketsInternal();
  return markets.filter((market) => market.status === status);
}

export async function searchMarkets(query: string): Promise<Market[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const markets = await getMarketsInternal();
  return markets.filter(
    (market) =>
      market.question.toLowerCase().includes(normalized) ||
      market.category.toLowerCase().includes(normalized),
  );
}

/**
 * Resolves a real, order-book-derived YES probability for a single market.
 * Only attempted for real DreamDEX markets — mock markets already carry a
 * yesPrice and never hit the network here. Returns null on thin liquidity
 * or any fetch failure; callers should show "Thin liquidity" rather than a
 * fabricated number.
 */
export async function fetchOrderBookProbability(market: Market): Promise<number | null> {
  if (market.source !== 'dreamdex') return null;
  const ref = market.symbol ?? market.marketAddress ?? market.id;
  try {
    const rawOrderBook = await fetchMarketOrderBook(ref);
    return deriveImpliedYesProbability(rawOrderBook);
  } catch (error) {
    console.warn(`[markets] Could not resolve order-book probability for ${ref}.`, error);
    return null;
  }
}
