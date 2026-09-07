import { useEffect, useState } from 'react';
import { Users, Clock, BarChart3, Loader2 } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import MarketChart from '../components/MarketChart';
import ProbabilityButton from '../components/ProbabilityButton';
import { useMarket, useRetryMarkets } from '../hooks/useMarkets';
import { fetchOrderBookProbability } from '../services/markets';
import { addPrediction, getTournamentState } from '../services/tournament';
import './MarketDetail.css';

interface MarketDetailProps {
  marketId: string;
  onBack: () => void;
}

function formatCloseDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MarketDetail({ marketId, onBack }: MarketDetailProps): JSX.Element {
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no' | null>(null);
  const [predictionSaved, setPredictionSaved] = useState(false);
  const { data: market, isLoading, isSuccess, isError } = useMarket(marketId);
  const retryMarkets = useRetryMarkets();

  // For real DreamDEX markets, the discovery payload doesn't include a
  // probability — resolve one from the live order book once the market is
  // open. Mock markets already carry yesPrice/noPrice and skip this.
  const [orderBookYesPrice, setOrderBookYesPrice] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    setOrderBookYesPrice(undefined);
    setPredictionSaved(false);

    if (market) {
      const existingPrediction = getTournamentState().predictions.find(
        (prediction) => prediction.marketId === market.id,
      );

      if (existingPrediction) {
        setSelectedOutcome(existingPrediction.outcome);
        setPredictionSaved(true);
      } else {
        setSelectedOutcome(null);
      }
    }

    if (!market || market.source !== 'dreamdex') return;

    let cancelled = false;
    fetchOrderBookProbability(market).then((result) => {
      if (!cancelled) setOrderBookYesPrice(result);
    });
    return () => {
      cancelled = true;
    };
  }, [market]);

  const isRealMarket = market?.source === 'dreamdex';
  const resolvedYesPrice = isRealMarket ? orderBookYesPrice ?? undefined : market?.yesPrice;
  const resolvedNoPrice =
    isRealMarket && typeof resolvedYesPrice === 'number' ? 100 - resolvedYesPrice : market?.noPrice;
  const isPricingRealMarket = isRealMarket && orderBookYesPrice === undefined;
  const isThinLiquidity = isRealMarket && orderBookYesPrice === null;

  return (
    <div className="page market-detail">
      <ScreenHeader onBack={onBack} />

      {isLoading && <p className="market-detail__status">Loading DreamDEX markets…</p>}
      {isError && (
        <div className="market-detail__status-block">
          <p className="market-detail__status">DreamDEX market data unavailable</p>
          <button type="button" className="btn btn--secondary" onClick={retryMarkets}>
            Retry
          </button>
        </div>
      )}
      {isSuccess && !market && <p className="market-detail__status">No live Event Contracts available for this market.</p>}

      {market && (
        <>
          <span className="market-detail__category">{market.category.toUpperCase()}</span>
          <h1 className="market-detail__question">{market.question}</h1>

          <div className="market-detail__summary">
            <div className="market-detail__summary-item">
              <span className="market-detail__summary-label market-detail__summary-label--yes">YES</span>
              <span className="market-detail__summary-value market-detail__summary-value--yes">
                {isPricingRealMarket ? (
                  <Loader2 size={20} className="market-detail__spinner" aria-label="Loading price" />
                ) : typeof resolvedYesPrice === 'number' ? (
                  `${resolvedYesPrice}%`
                ) : (
                  '—'
                )}
              </span>
            </div>
            <div className="market-detail__summary-item">
              <span className="market-detail__summary-label market-detail__summary-label--no">NO</span>
              <span className="market-detail__summary-value market-detail__summary-value--no">
                {isPricingRealMarket ? (
                  <Loader2 size={20} className="market-detail__spinner" aria-label="Loading price" />
                ) : typeof resolvedNoPrice === 'number' ? (
                  `${resolvedNoPrice}%`
                ) : (
                  '—'
                )}
              </span>
            </div>
          </div>

          {isThinLiquidity && <p className="market-detail__liquidity-note">Thin liquidity — not enough order book depth to price this market yet.</p>}
          {isRealMarket && (
            <p className="market-detail__source-note">
              Probability derived from the live DreamDEX order book, not an oracle estimate.
            </p>
          )}

          <div className="page__section">
            <MarketChart market={market} />
          </div>

          <div className="surface-card market-detail__info">
            <div className="market-detail__info-row">
              <span className="market-detail__info-label">
                <BarChart3 size={14} strokeWidth={2.2} />
                Volume
              </span>
              <span className="market-detail__info-value">{market.volumeLabel ?? 'Live market data'}</span>
            </div>
            <div className="market-detail__info-row">
              <span className="market-detail__info-label">
                <Clock size={14} strokeWidth={2.2} />
                Closes
              </span>
              <span className="market-detail__info-value">{formatCloseDateTime(market.closesAt)}</span>
            </div>
            {typeof market.traderCount === 'number' && (
              <div className="market-detail__info-row">
                <span className="market-detail__info-label">
                  <Users size={14} strokeWidth={2.2} />
                  Traders
                </span>
                <span className="market-detail__info-value">{market.traderCount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="market-detail__trade">
            <p className="market-detail__trade-note">
              Select your prediction to lock this Event Contract into your DreamSquad.
            </p>
            {predictionSaved && (
              <p className="market-detail__source-note">
                Prediction locked for the Group Stage.
              </p>
            )}
            <div className="market-detail__trade-buttons">
              <ProbabilityButton
                outcome="yes"
                price={resolvedYesPrice}
                selected={selectedOutcome === 'yes'}
                onClick={() => {
                  const nextOutcome = selectedOutcome === 'yes' ? null : 'yes';
                  setSelectedOutcome(nextOutcome);
                  if (nextOutcome && market) {
                    addPrediction(market, nextOutcome);
                    setPredictionSaved(true);
                  }
                }}
              />
              <ProbabilityButton
                outcome="no"
                price={resolvedNoPrice}
                selected={selectedOutcome === 'no'}
                onClick={() => {
                  const nextOutcome = selectedOutcome === 'no' ? null : 'no';
                  setSelectedOutcome(nextOutcome);
                  if (nextOutcome && market) {
                    addPrediction(market, nextOutcome);
                    setPredictionSaved(true);
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MarketDetail;
