import type { MarketPricePoint, PriceRange } from '../types/market';

/**
 * Generates a plausible-looking random-walk price series ending exactly on
 * `endPrice`. Used to backfill chart data for markets that don't come with
 * a real historical series attached (all current mock markets, and any
 * live Somnia market whose discovery payload doesn't include history).
 *
 * This is illustrative only — it never represents real on-chain history.
 */
export function generatePriceHistory(endPrice: number, points: number, volatility: number): MarketPricePoint[] {
  const history: MarketPricePoint[] = [];
  let price = endPrice;
  const now = Date.now();

  for (let i = points - 1; i >= 0; i -= 1) {
    history.push({ timestamp: now - i * 60_000, yesPrice: Math.round(price) });
    const drift = (Math.random() - 0.5) * volatility;
    price = Math.min(96, Math.max(4, price + drift));
  }

  history[history.length - 1] = { timestamp: now, yesPrice: endPrice };
  return history;
}

/** Builds the full 1D/1W/1M/ALL set expected by the Market type. */
export function buildPriceHistorySet(endPrice: number): Record<PriceRange, MarketPricePoint[]> {
  return {
    '1D': generatePriceHistory(endPrice, 24, 3),
    '1W': generatePriceHistory(endPrice, 28, 5),
    '1M': generatePriceHistory(endPrice, 30, 7),
    ALL: generatePriceHistory(endPrice, 40, 9),
  };
}
