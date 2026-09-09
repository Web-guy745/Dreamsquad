import { useMemo, useState } from 'react';
import { Activity as ActivityIcon, Plus, TrendingUp, Users } from 'lucide-react';
import OpinionMarketCard, { num } from '../components/OpinionMarketCard';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';
import EmptyState from '../components/EmptyState';
import { getRecentActivity } from '../services/activity';
import { showToast } from '../utils/toast';
import {
  getOpinionMarkets,
  getTrendingOpinionMarkets,
  getEndingSoonOpinionMarkets,
  getUserCreatedMarkets,
  getUserPosition,
  getOpinionMarketById,
  placePrediction,
  getResolvedOpinionMarkets,
  getLeaderboard,
    resolveOpinionMarket,
  resolveFromDreamDex,
  getTotalOpinionVolume,
} from '../services/opinionMarkets';
import './OpinionMarkets.css';

interface OpinionMarketsProps {
  onCreate: () => void;
  onOpenDetail: (marketId: string) => void;
  onOpenCreator: (address: string) => void;
  refreshKey: number;
}

function OpinionMarkets({ onCreate, onOpenDetail, onOpenCreator, refreshKey: externalRefreshKey }: OpinionMarketsProps): JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0);

  const effectiveRefreshKey = `${externalRefreshKey}-${refreshKey}`;

  const allMarkets = useMemo(() => getOpinionMarkets(), [effectiveRefreshKey]);
  const trending = useMemo(() => getTrendingOpinionMarkets(), [effectiveRefreshKey]);
  const endingSoon = useMemo(() => getEndingSoonOpinionMarkets(), [effectiveRefreshKey]);
  const yourCalls = useMemo(() => getUserCreatedMarkets(), [effectiveRefreshKey]);
  const resolvedMarkets = useMemo(() => getResolvedOpinionMarkets(), [effectiveRefreshKey]);
  const leaderboard = useMemo(() => getLeaderboard(), [effectiveRefreshKey]);
  const totalVolume = useMemo(() => getTotalOpinionVolume(), [effectiveRefreshKey]);
  const activeMarketCount = useMemo(() => allMarkets.filter((m) => m.status === 'open').length, [allMarkets]);
  const recentActivity = useMemo(() => getRecentActivity(6), [effectiveRefreshKey]);

  const handleVote = (marketId: string, outcome: 'yes' | 'no', amount: number): void => {
    const market = getOpinionMarketById(marketId);
    if (!market) return;
    const result = placePrediction(market, outcome, amount);
    if (result.success) {
      showToast(`Position placed. Your ${outcome.toUpperCase()} prediction is live.`);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleDemoResolve = async (
    marketId: string,
    outcome: 'yes' | 'no',
  ): Promise<void> => {
    const success = resolveOpinionMarket(marketId, outcome);

    if (success) {
      showToast(`Market resolved ${outcome.toUpperCase()}.`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleResolve = async (marketId: string): Promise<void> => {
    const success = await resolveFromDreamDex(marketId);

    if (success) {
      showToast('Market resolved from DreamDEX.');
      setRefreshKey((k) => k + 1);
      return;
    }

    showToast('Market awaiting DreamDEX resolution.');
  };

  return (
    <div className="page opinion-markets-page">
      <div className="page__header">
        <p className="page__eyebrow">Opinion Markets</p>
        <h1 className="page__heading">Turn predictions into markets.</h1>
        <p className="page__subheading">Create an opinion market around a DreamDEX Event Contract, let others take YES or NO positions, and earn a share of the trading fees when your call resolves.</p>
      </div>

      <div className="opinion-markets-page__summary">
        <div className="surface-card opinion-markets-page__summary-stat">
          <ActivityIcon size={14} />
          <span className="opinion-markets-page__summary-value">{activeMarketCount}</span>
          <span className="opinion-markets-page__summary-label">Active Markets</span>
        </div>
        <div className="surface-card opinion-markets-page__summary-stat">
          <TrendingUp size={14} />
          <span className="opinion-markets-page__summary-value">{num(totalVolume)}</span>
          <span className="opinion-markets-page__summary-label">Total Volume</span>
        </div>
        <div className="surface-card opinion-markets-page__summary-stat">
          <Users size={14} />
          <span className="opinion-markets-page__summary-value">{yourCalls.length}</span>
          <span className="opinion-markets-page__summary-label">Your Markets</span>
        </div>
      </div>

      <button type="button" className="btn btn--primary btn--block opinion-markets-page__create" onClick={onCreate}>
        <Plus size={16} />
        Create Opinion Market
      </button>

      <div className="page__section">
        <h2 className="page__section-title">Trending</h2>
        <div className="opinion-markets-page__list">
          {trending.length === 0 && <EmptyState message="No open opinion markets yet." />}
          {trending.map((market) => (
            <OpinionMarketCard
              key={market.id}
              market={market}
              userPosition={getUserPosition(market.id)}
              onOpenDetail={onOpenDetail}
              onOpenCreator={onOpenCreator}
              onVote={(outcome, amount) => handleVote(market.id, outcome, amount)}
              onResolve={() => handleResolve(market.id)}
          onDemoResolve={(outcome) => handleDemoResolve(market.id, outcome)}
            />
          ))}
        </div>
      </div>

      <div className="page__section">
        <h2 className="page__section-title">Ending Soon</h2>
        <div className="opinion-markets-page__list">
          {endingSoon.slice(0, 3).map((market) => (
            <OpinionMarketCard
              key={market.id}
              market={market}
              userPosition={getUserPosition(market.id)}
              onOpenDetail={onOpenDetail}
              onOpenCreator={onOpenCreator}
              onVote={(outcome, amount) => handleVote(market.id, outcome, amount)}
              onResolve={() => handleResolve(market.id)}
          onDemoResolve={(outcome) => handleDemoResolve(market.id, outcome)}
            />
          ))}
        </div>
      </div>

      <div className="page__section">
        <h2 className="page__section-title">Your Calls</h2>
        <div className="opinion-markets-page__list">
          {yourCalls.length === 0 && <EmptyState message="Opinion markets you create will show up here." />}
          {yourCalls.map((market) => (
            <OpinionMarketCard
              key={market.id}
              market={market}
              userPosition={getUserPosition(market.id)}
              onOpenDetail={onOpenDetail}
              onOpenCreator={onOpenCreator}
              onVote={(outcome, amount) => handleVote(market.id, outcome, amount)}
              onResolve={() => handleResolve(market.id)}
          onDemoResolve={(outcome) => handleDemoResolve(market.id, outcome)}
            />
          ))}
        </div>
      </div>

      <div className="page__section">
        <h2 className="page__section-title">Recently Resolved</h2>
        <div className="opinion-markets-page__list">
          {resolvedMarkets.length === 0 && (
            <EmptyState message="Resolved markets will appear here." />
          )}
          {resolvedMarkets.slice(0, 3).map((market) => (
            <OpinionMarketCard
              key={market.id}
              market={market}
              userPosition={getUserPosition(market.id)}
              onOpenDetail={onOpenDetail}
              onOpenCreator={onOpenCreator}
              onVote={(outcome, amount) =>
                handleVote(market.id, outcome, amount)
              }
            />
          ))}
        </div>
      </div>

      <div className="page__section">
        <h2 className="page__section-title">Live Activity</h2>
        <ActivityFeed entries={recentActivity} />
      </div>

      <div className="page__section">
        <h2 className="page__section-title">Leaderboard</h2>
        <Leaderboard entries={leaderboard} onSelect={onOpenCreator} />
      </div>
    </div>
  );
}

export default OpinionMarkets;
