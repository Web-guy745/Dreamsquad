import { useState } from 'react';
import { Trophy, ChevronRight, Bitcoin, Landmark } from 'lucide-react';
import CategoryTabs, { type CategoryFilter } from '../components/CategoryTabs';
import FeaturedMarket from '../components/FeaturedMarket';
import MarketCard from '../components/MarketCard';
import MarketCardSkeleton from '../components/MarketCardSkeleton';
import EmptyState from '../components/EmptyState';
import DataSourceNotice from '../components/DataSourceNotice';
import { useFeaturedMarket, useMarketsByCategory, getMarketDataSource, useRetryMarkets } from '../hooks/useMarkets';
import './Home.css';

interface HomeProps {
  onSelectMarket: (id: string) => void;
  onOpenTournament: () => void;
}

function Home({ onSelectMarket, onOpenTournament }: HomeProps): JSX.Element {
  const [category, setCategory] = useState<CategoryFilter>('Trending');
  const { data: featured } = useFeaturedMarket();
  const { data: markets, isLoading, isSuccess } = useMarketsByCategory(category);
  const retryMarkets = useRetryMarkets();

  const showMockNotice = isSuccess && getMarketDataSource() === 'mock';

  return (
    <div className="page home-page">
      {showMockNotice && <DataSourceNotice onRetry={retryMarkets} />}

      <CategoryTabs active={category} onChange={setCategory} />

      {featured && (
        <div className="page__section">
          <FeaturedMarket market={featured} onClick={onSelectMarket} />
        </div>
      )}

      <button type="button" className="home-page__tournament-banner" onClick={onOpenTournament}>
        <span className="home-page__tournament-icon">
          <Trophy size={18} strokeWidth={2.2} />
        </span>
        <span className="home-page__tournament-text">
          <span className="home-page__tournament-title">DreamSquad Tournament</span>
          <span className="home-page__tournament-subtitle">Predict smarter. Advance further.</span>
        </span>
        <ChevronRight size={18} className="home-page__tournament-chevron" aria-hidden="true" />
      </button>

      <div className="page__section">
        <h2 className="page__section-title">Trending Markets</h2>
        {isLoading && <p className="markets-loading-text">Loading DreamDEX markets…</p>}
        <div className="market-list">
          {isLoading && <MarketCardSkeleton />}
          {!isLoading && markets?.length === 0 && (
            <EmptyState message="No live Event Contracts available right now." />
          )}
          {!isLoading &&
            markets?.map((market) => <MarketCard key={market.id} market={market} onClick={onSelectMarket} />)}
        </div>
      </div>

      <div className="page__section">
        <h2 className="page__section-title">Top Events</h2>
        <div className="home-page__events">
          <div className="surface-card home-page__event-card">
            <span className="home-page__event-icon">
              <Bitcoin size={16} strokeWidth={2.2} />
            </span>
            <p className="home-page__event-title">Crypto Markets</p>
            <p className="home-page__event-stat">24 Active Markets</p>
            <p className="home-page__event-stat home-page__event-stat--muted">$4.2M Volume</p>
          </div>
          <div className="surface-card home-page__event-card">
            <span className="home-page__event-icon">
              <Landmark size={16} strokeWidth={2.2} />
            </span>
            <p className="home-page__event-title">Politics</p>
            <p className="home-page__event-stat">18 Active Markets</p>
            <p className="home-page__event-stat home-page__event-stat--muted">$3.1M Volume</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
