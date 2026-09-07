import { Trophy, Clock, Activity } from 'lucide-react';
import type { Market } from '../types/market';
import './FeaturedMarket.css';

interface FeaturedMarketProps {
  market: Market;
  onClick: (id: string) => void;
}

function formatCloseDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function FeaturedMarket({ market, onClick }: FeaturedMarketProps): JSX.Element {
  const hasProbability = typeof market.yesPrice === 'number' && typeof market.noPrice === 'number';

  return (
    <button type="button" className="surface-card surface-card--interactive featured-market" onClick={() => onClick(market.id)}>
      <div className="glow featured-market__glow" aria-hidden="true" />

      <div className="featured-market__top">
        <span className="featured-market__category">
          <Trophy size={13} strokeWidth={2.4} />
          {market.category.toUpperCase()}
        </span>
        <span className="featured-market__closes">
          <Clock size={12} strokeWidth={2.2} />
          Closes {formatCloseDate(market.closesAt)}
        </span>
      </div>

      <h3 className="featured-market__title">{market.question}</h3>

      {hasProbability ? (
        <div className="featured-market__rows">
          <div className="featured-market__row">
            <span className="featured-market__row-label">YES</span>
            <div className="featured-market__bar">
              <div className="featured-market__bar-fill featured-market__bar-fill--yes" style={{ width: `${market.yesPrice}%` }} />
            </div>
            <span className="featured-market__row-value featured-market__row-value--yes">{market.yesPrice}%</span>
          </div>
          <div className="featured-market__row">
            <span className="featured-market__row-label">NO</span>
            <div className="featured-market__bar">
              <div className="featured-market__bar-fill featured-market__bar-fill--no" style={{ width: `${market.noPrice}%` }} />
            </div>
            <span className="featured-market__row-value featured-market__row-value--no">{market.noPrice}%</span>
          </div>
        </div>
      ) : (
        <p className="featured-market__pending">{market.liquidityNote ?? 'Open the market for live order-book pricing'}</p>
      )}

      <div className="featured-market__footer">
        <span className="featured-market__volume">
          {market.volumeLabel ? `Volume ${market.volumeLabel}` : 'Live market data'}
        </span>
        {typeof market.traderCount === 'number' && (
          <span className="featured-market__activity">
            <Activity size={12} strokeWidth={2.4} />
            {market.traderCount.toLocaleString()} traders
          </span>
        )}
      </div>
    </button>
  );
}

export default FeaturedMarket;
