import { useMemo, useState } from 'react';
import MarketCard from '../components/MarketCard';
import MarketCardSkeleton from '../components/MarketCardSkeleton';
import EmptyState from '../components/EmptyState';
import DataSourceNotice from '../components/DataSourceNotice';
import { useMarkets, useMarketsByStatus, getMarketDataSource, useRetryMarkets } from '../hooks/useMarkets';
import type { Market } from '../types/market';
import './Live.css';

type LiveFilter = 'Live' | 'Trending' | 'Closing Soon';

const FILTERS: LiveFilter[] = ['Live', 'Trending', 'Closing Soon'];

interface LiveProps {
  onSelectMarket: (id: string) => void;
}

function Live({ onSelectMarket }: LiveProps): JSX.Element {
  const [filter, setFilter] = useState<LiveFilter>('Live');
  const retryMarkets = useRetryMarkets();

  const liveQuery = useMarketsByStatus('live');
  const closingSoonQuery = useMarketsByStatus('closing-soon');
  const allQuery = useMarkets();

  const activeQuery = filter === 'Live' ? liveQuery : filter === 'Closing Soon' ? closingSoonQuery : allQuery;

  const markets: Market[] = useMemo(() => {
    if (filter === 'Trending') {
      return [...(allQuery.data ?? [])].sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0));
    }
    return activeQuery.data ?? [];
  }, [filter, activeQuery.data, allQuery.data]);

  const showMockNotice = activeQuery.isSuccess && getMarketDataSource() === 'mock';

  return (
    <div className="page live-page">
      <div className="page__header">
        <p className="page__eyebrow">Live Markets</p>
        <h1 className="page__heading">Watch the market move</h1>
      </div>

      {showMockNotice && <DataSourceNotice onRetry={retryMarkets} />}

      <div className="live-page__filters" role="tablist" aria-label="Live market filters">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            className={`live-page__filter ${filter === item ? 'live-page__filter--active' : ''}`}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {activeQuery.isLoading && <p className="markets-loading-text">Loading DreamDEX markets…</p>}

      <div className="market-list">
        {activeQuery.isLoading && <MarketCardSkeleton />}
        {!activeQuery.isLoading && markets.length === 0 && (
          <EmptyState message="No live Event Contracts available right now." />
        )}
        {!activeQuery.isLoading &&
          markets.map((market) => <MarketCard key={market.id} market={market} onClick={onSelectMarket} />)}
      </div>
    </div>
  );
}

export default Live;
