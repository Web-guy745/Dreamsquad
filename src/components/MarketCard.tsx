import { useEffect, useState } from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Market } from '../types/market';
import { fetchOrderBookProbability } from '../services/markets';
import './MarketCard.css';

interface MarketCardProps {
  market: Market;
  onClick: (id: string) => void;
}

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

function MarketCard({ market, onClick }: MarketCardProps): JSX.Element {
  const TrendIcon = TREND_ICON[market.trend];
  const [liveYesPrice, setLiveYesPrice] = useState<number | null | undefined>(
    market.source === 'dreamdex' ? undefined : market.yesPrice,
  );

  useEffect(() => {
    let cancelled = false;

    if (market.source !== 'dreamdex') {
      setLiveYesPrice(market.yesPrice);
      return () => {
        cancelled = true;
      };
    }

    setLiveYesPrice(undefined);

    fetchOrderBookProbability(market).then((price) => {
      if (!cancelled) {
        setLiveYesPrice(price);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [market]);

  const hasPrice = typeof liveYesPrice === 'number';

  return (
    <button
      type="button"
      className="surface-card surface-card--interactive market-card"
      onClick={() => onClick(market.id)}
    >
      <div className="market-card__main">
        <span className="market-card__category">{market.category}</span>
        <p className="market-card__question">{market.question}</p>
        <div className="market-card__meta">
          <span className={`market-card__trend market-card__trend--${market.trend}`}>
            <TrendIcon size={13} strokeWidth={2.4} />
            {hasPrice ? `YES ${liveYesPrice}¢` : liveYesPrice === null ? 'Thin liquidity' : 'Price pending'}
          </span>
          <span className="market-card__volume">
            {market.volumeLabel ? `Volume ${market.volumeLabel}` : 'Live market data'}
          </span>
        </div>
      </div>
      <ChevronRight size={18} className="market-card__chevron" aria-hidden="true" />
    </button>
  );
}

export default MarketCard;
