export type MarketCategory = 'Trending' | 'Crypto';
export type MarketStatus = 'live' | 'closing-soon' | 'closed';

export type PriceRange = '1D' | '1W' | '1M' | 'ALL';

export type MarketSource = 'mock' | 'dreamdex';

export interface MarketPricePoint {
  timestamp: number;
  yesPrice: number;
}

/**
 * Frontend-facing market model.
 *
 * Populated either by mock data (data/mockMarkets.ts) or by real DreamDEX/
 * Somnia binary Event Contracts (services/somnia/adapter.ts). A real
 * BinaryMarket from the SDK does not carry a probability, volume, or price
 * history at discovery time — those fields are therefore optional here
 * rather than being backfilled with invented numbers. UI components must
 * handle their absence (see MarketCard, FeaturedMarket, MarketChart).
 */
export interface Market {
  id: string;
  category: MarketCategory;
  question: string;
  closesAt: string;
  status: MarketStatus;
  trend: 'up' | 'down' | 'flat';

  /** Known at discovery time for mock data; unknown for real markets until an order book fetch resolves. */
  yesPrice?: number;
  noPrice?: number;

  volumeLabel?: string;
  volumeUsd?: number;
  traderCount?: number;

  /** Absent for real markets that don't have a synthesized/real history available yet. */
  priceHistory?: Record<PriceRange, MarketPricePoint[]>;

  /** Where this record came from — never claim "on-chain"/"verified" UI copy unless this is 'dreamdex'. */
  source?: MarketSource;

  // Real DreamDEX Event Contract metadata (all optional — only present for source === 'dreamdex')
  symbol?: string;
  strike?: number;
  winningOutcome?: 'yes' | 'no' | null;
  marketAddress?: string;
  /** Set when an order-book probability lookup found insufficient depth to price the market. */
  liquidityNote?: string;
}
