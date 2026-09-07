import { getSomniaMarketsClient } from './client';

export class DreamDexUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DreamDexUnavailableError';
  }
}

/**
 * Loads live binary Event Contract markets from DreamDEX.
 *
 * The installed SomniaMarkets SDK exposes market discovery through
 * loadMarkets()/fetchMarkets(). We filter the returned UnifiedMarket
 * objects to active binary markets here.
 */
export async function fetchLiveBinaryMarkets(): Promise<unknown[]> {
  const client = getSomniaMarketsClient();

  try {
    await client.loadMarkets();
    const markets = await client.fetchMarkets();

    return markets.filter(
      (market) => market.type === 'binary' && market.active,
    );
  } catch (error) {
    throw new DreamDexUnavailableError(
      'Could not load Event Contract markets from DreamDEX/Somnia.',
      error,
    );
  }
}

/**
 * Fetches the order book for a single Event Contract market.
 */
export async function fetchMarketOrderBook(
  ref: string,
  limit = 20,
): Promise<unknown> {
  const client = getSomniaMarketsClient();

  try {
    return await client.fetchOrderBook(ref, limit);
  } catch (error) {
    throw new DreamDexUnavailableError(
      `Could not load the order book for market "${ref}".`,
      error,
    );
  }
}

/**
 * Fetches the resolved outcome for a DreamDEX binary Event Contract.
 *
 * Uses the market ID directly so a market can still be resolved after
 * it leaves the live market list.
 */
export async function fetchMarketResolution(
  marketId: string,
): Promise<'yes' | 'no' | null> {
  const client = getSomniaMarketsClient();

  try {
    await client.loadMarkets();
    const markets = await client.fetchMarkets();

    const market = markets.find((item) => {
      const info = item.info as {
        marketId?: string;
        winningOutcome?: number | null;
      };

      return info.marketId?.toLowerCase() === marketId.toLowerCase();
    });

    if (!market) {
      return null;
    }

    const info = market.info as {
      winningOutcome?: number | null;
    };

    if (info.winningOutcome === 0) {
      return 'yes';
    }

    if (info.winningOutcome === 1) {
      return 'no';
    }

    return null;
  } catch (error) {
    throw new DreamDexUnavailableError(
      `Could not resolve Event Contract "${marketId}".`,
      error,
    );
  }
}
