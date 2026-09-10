import type { Market, MarketCategory, MarketStatus } from '../../types/market';

/**
 * Maps the SDK's verified BinaryMarket fields onto the app's Market type.
 * BinaryMarket carries no probability, volume, or price history at
 * discovery time — those stay undefined here rather than being invented.
 * Field access stays defensive (unknown/type-guards) because indexer
 * records can be partial even when the type says a field exists.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return undefined;
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function readTimestamp(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      const trimmed = value.trim();

      // DreamDEX indexer timestamps can arrive as Unix seconds encoded
      // as strings. Normalize those before passing them to Date.
      if (/^\\d+(?:\\.\\d+)?$/.test(trimmed)) {
        const numericValue = Number(trimmed);

        if (Number.isFinite(numericValue)) {
          const milliseconds =
            numericValue > 10_000_000_000
              ? numericValue
              : numericValue * 1000;

          const date = new Date(milliseconds);

          if (!Number.isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }

      // Preserve ISO/RFC date strings when they are already valid.
      const date = new Date(trimmed);

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const date = new Date(
        value > 10_000_000_000 ? value : value * 1000,
      );

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }

  return undefined;
}

function inferCategory(_asset: string | undefined, _question: string): MarketCategory {
  return 'Crypto';
}

function inferStatus(record: Record<string, unknown>, closesAt: string | undefined): MarketStatus {
  const finalized = record.finalized;
  const active = record.active;
  const rawStatus = readString(record, ['status']);

  if (finalized === true) return 'closed';
  if (rawStatus) {
    const normalized = rawStatus.toLowerCase();
    if (normalized.includes('resolved') || normalized.includes('settled') || normalized.includes('closed')) {
      return 'closed';
    }
    if (normalized.includes('expired')) return 'closed';
  }
  if (active === false) return 'closed';

  if (closesAt) {
    const closesInMs = new Date(closesAt).getTime() - Date.now();
    if (Number.isFinite(closesInMs)) {
      if (closesInMs <= 0) return 'closed';
      if (closesInMs <= 48 * 60 * 60 * 1000) return 'closing-soon';
    }
  }

  return 'live';
}

function readWinningOutcome(record: Record<string, unknown>): 'yes' | 'no' | null {
  const value = record.winningOutcome;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'yes' || normalized === 'no') return normalized;
  }
  if (typeof value === 'number') {
    return value === 1 ? 'yes' : value === 0 ? 'no' : null;
  }
  return null;
}

/**
 * Converts one raw BinaryMarket record into the app's Market type. Returns
 * null when a record is missing the minimum fields needed to render a
 * card (an id and a question/oracle question) rather than producing a
 * broken entry.
 */
export function adaptBinaryMarket(raw: unknown): Market | null {
  if (!isRecord(raw)) return null;

  // SomniaMarkets returns UnifiedMarket objects. The common fields
  // (id/type/active) live at the top level, while BinaryMarket-specific
  // fields live inside `info`.
  const info = isRecord(raw.info) ? raw.info : raw;

  const id =
    readString(info, ['marketId', 'marketAddress', 'id']) ??
    readString(raw, ['id']);

  const question =
    readString(info, ['question', 'oracleQuestion']) ??
    readString(raw, ['question', 'oracleQuestion']);

  if (!id || !question) return null;

  const asset =
    readString(info, ['asset']) ??
    readString(raw, ['asset', 'base', 'symbol']);

  const symbol = readString(raw, ['symbol']);

  const closesAt =
    readTimestamp(info, ['expiry', 'tradingStart']) ??
    readTimestamp(raw, ['expiry', 'tradingStart']);

  const strike =
    readNumber(info, ['strike']) ??
    readNumber(raw, ['strike']);

  const marketAddress =
    readString(info, ['marketAddress']) ??
    readString(raw, ['marketAddress']);

  return {
    id,
    category: inferCategory(asset, question),
    question,
    closesAt: closesAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: inferStatus(
      { ...raw, ...info },
      closesAt,
    ),
    trend: 'flat',
    source: 'dreamdex',
    symbol: symbol ?? asset,
    strike,
    marketAddress,
    winningOutcome: readWinningOutcome(info),
  };
}

export function adaptBinaryMarkets(rawList: unknown[]): Market[] {
  return rawList.map((raw) => adaptBinaryMarket(raw)).filter((market): market is Market => market !== null);
}

/**
 * Derives an implied YES probability from a raw order book, parsed
 * defensively since the SDK's fetchOrderBook() return shape wasn't part of
 * the verified facts for this task. Looks for bid/ask arrays with a
 * numeric price field and computes a best-bid/best-ask mid price.
 *
 * Returns null when there isn't enough depth to price the market — callers
 * should show "Thin liquidity" rather than a fabricated number.
 */
export function deriveImpliedYesProbability(rawOrderBook: unknown): number | null {
  if (!isRecord(rawOrderBook)) return null;

  const bids = rawOrderBook.bids;
  const asks = rawOrderBook.asks;

  if (!Array.isArray(bids) || !Array.isArray(asks) || bids.length === 0 || asks.length === 0) {
    return null;
  }

  const readTuplePrice = (level: unknown): number | undefined => {
    if (Array.isArray(level) && typeof level[0] === 'number' && Number.isFinite(level[0])) {
      return level[0];
    }

    if (isRecord(level)) {
      return readNumber(level, ['price', 'p']);
    }

    return undefined;
  };

  const bestBid = readTuplePrice(bids[0]);
  const bestAsk = readTuplePrice(asks[0]);

  if (bestBid === undefined || bestAsk === undefined) return null;

  const mid = (bestBid + bestAsk) / 2;
  const percent = mid <= 1 ? mid * 100 : mid;

  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;

  return Math.round(percent);
}
