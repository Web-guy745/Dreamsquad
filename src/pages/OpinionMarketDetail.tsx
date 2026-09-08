import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Zap,
  DollarSign,
  Users,
  Percent,
  Link2,
} from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import Countdown from '../components/Countdown';
import EmptyState from '../components/EmptyState';
import { cleanAsset, cleanQuestion, num } from '../components/OpinionMarketCard';
import {
  getOpinionMarketById,
  getUserPosition,
  placePrediction,
  calculatePotentialPayout,
  resolveOpinionMarket,
  resolveFromDreamDex,
} from '../services/opinionMarkets';
import { getWalletIdentity } from '../services/wallet';
import type { OpinionOutcome } from '../types/opinionMarket';
import './OpinionMarketDetail.css';

interface OpinionMarketDetailProps {
  marketId: string;
  onBack: () => void;
}

const QUICK_AMOUNTS = [10, 25, 50, 100];

function formatDeadlineDate(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return 'Unknown';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function truncateMiddle(value: string, head = 10, tail = 6): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function OpinionMarketDetail({ marketId, onBack }: OpinionMarketDetailProps): JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOutcome, setSelectedOutcome] = useState<OpinionOutcome>('yes');
  const [amount, setAmount] = useState('25');
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [resolveMessage, setResolveMessage] = useState<string | null>(null);

  const market = useMemo(() => getOpinionMarketById(marketId), [marketId, refreshKey]);
  const userPosition = useMemo(() => getUserPosition(marketId), [marketId, refreshKey]);

  if (!market) {
    return (
      <div className="page opinion-detail-page">
        <ScreenHeader onBack={onBack} />
        <EmptyState message="This opinion market could not be found. It may have been removed." />
      </div>
    );
  }

  const totalPool = market.yesPool + market.noPool;
  const hasLiquidity = totalPool > 0;
  const yesPercent = hasLiquidity ? Math.round((market.yesPool / totalPool) * 100) : 50;
  const noPercent = 100 - yesPercent;

  const deadlineMs = new Date(market.deadline).getTime();
  const isPastDeadline = Number.isFinite(deadlineMs) && deadlineMs <= Date.now();
  const isResolved = market.status === 'resolved-yes' || market.status === 'resolved-no';
  const isOpenForTrading = market.status === 'open' && !isPastDeadline;

  const parsedAmount = Number(amount);
  const isAmountValid = amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const potentialPayout = isAmountValid ? calculatePotentialPayout(market, selectedOutcome, parsedAmount) : 0;
  const potentialProfit = isAmountValid ? Math.max(potentialPayout - parsedAmount, 0) : 0;

  const isCreator = market.creator === getWalletIdentity();

  const handleTrade = (): void => {
    setTradeError(null);

    if (!isAmountValid) {
      setTradeError('Enter a stake amount greater than zero.');
      return;
    }

    const result = placePrediction(market, selectedOutcome, parsedAmount);

    if (!result.success) {
      if (result.alreadyPredicted) {
        setTradeError('You already have a position in this market.');
      } else {
        setTradeError('Could not place this position. The market may have closed.');
      }
      return;
    }

    setRefreshKey((key) => key + 1);
  };

  const handleCheckResolution = async (): Promise<void> => {
    setResolveMessage(null);
    const success = await resolveFromDreamDex(market.id);

    if (success) {
      setRefreshKey((key) => key + 1);
      return;
    }

    setResolveMessage(
      'DreamDEX has not resolved this Event Contract yet. This market will resolve here once DreamDEX provides a winning outcome.',
    );
  };

  const handleDemoResolve = (outcome: OpinionOutcome): void => {
    const success = resolveOpinionMarket(market.id, outcome);
    if (success) setRefreshKey((key) => key + 1);
  };

  return (
    <div className="page opinion-detail-page">
      <ScreenHeader onBack={onBack} />

      <div className="opinion-detail__header">
        <div className="opinion-detail__header-top">
          <span className="opinion-detail__asset">{cleanAsset(market)} · UP/DOWN</span>
          {isResolved ? (
            <span className={`opinion-detail__status opinion-detail__status--${market.resolvedOutcome}`}>
              {market.resolvedOutcome === 'yes' ? 'RESOLVED YES' : 'RESOLVED NO'}
            </span>
          ) : isPastDeadline ? (
            <span className="opinion-detail__status opinion-detail__status--closed">AWAITING RESOLUTION</span>
          ) : (
            <span className="opinion-detail__status opinion-detail__status--open">OPEN</span>
          )}
        </div>

        <h1 className="opinion-detail__question">{cleanQuestion(market)}</h1>
        <p className="opinion-detail__contract">DreamDEX Event Contract: {market.dreamDexQuestion}</p>
      </div>

      <div className="surface-card opinion-detail__probability">
        <div className="opinion-detail__prob-row">
          <div className="opinion-detail__prob-label">
            <span className="opinion-detail__prob-yes-text">YES {yesPercent}%</span>
          </div>
          <div className="opinion-detail__prob-bar">
            <div className="opinion-detail__prob-fill opinion-detail__prob-fill--yes" style={{ width: `${yesPercent}%` }} />
          </div>
        </div>
        <div className="opinion-detail__prob-row">
          <div className="opinion-detail__prob-label">
            <span className="opinion-detail__prob-no-text">NO {noPercent}%</span>
          </div>
          <div className="opinion-detail__prob-bar">
            <div className="opinion-detail__prob-fill opinion-detail__prob-fill--no" style={{ width: `${noPercent}%` }} />
          </div>
        </div>
        {!hasLiquidity && <p className="opinion-detail__liquidity-note">No positions yet — be the first to take a side.</p>}
      </div>

      <div className="opinion-detail__stats-grid">
        <div className="surface-card opinion-detail__stat">
          <span className="opinion-detail__stat-icon"><DollarSign size={14} /></span>
          <span className="opinion-detail__stat-value">{num(market.volume)}</span>
          <span className="opinion-detail__stat-label">Total Volume</span>
        </div>
        <div className="surface-card opinion-detail__stat">
          <span className="opinion-detail__stat-icon"><Users size={14} /></span>
          <span className="opinion-detail__stat-value">{market.yesCount} / {market.noCount}</span>
          <span className="opinion-detail__stat-label">YES / NO Positions</span>
        </div>
        <div className="surface-card opinion-detail__stat">
          <span className="opinion-detail__stat-icon"><Percent size={14} /></span>
          <span className="opinion-detail__stat-value">{market.feeBps / 100}%</span>
          <span className="opinion-detail__stat-label">Creator Fee</span>
        </div>
        <div className="surface-card opinion-detail__stat">
          <Countdown deadline={market.deadline} closed={isResolved} />
        </div>
      </div>

      <div className="surface-card opinion-detail__creator">
        <p className="opinion-detail__section-title">Creator</p>
        <div className="opinion-detail__creator-row">
          <span className="opinion-detail__creator-address">{market.creator}</span>
          <span className="opinion-detail__creator-fee">{market.feeBps / 100}% fee · creator keeps {market.creatorFeeShare * 100}%</span>
        </div>
        {market.creatorEarnings > 0 && (
          <p className="opinion-detail__creator-earnings">
            {isCreator ? 'Your earnings' : 'Creator earnings'}: <strong>{num(market.creatorEarnings)}</strong> credits
          </p>
        )}
        <p className="opinion-detail__creator-note">
          Creators earn a share of trading fees when their opinion market resolves.
        </p>
        {market.settlementStatus === 'demo-settled' && (
          <span className="opinion-detail__demo-badge">Demo settlement</span>
        )}
      </div>

      <div className="surface-card opinion-detail__dreamdex">
        <p className="opinion-detail__section-title">Powered by DreamDEX Event Contract</p>
        <div className="opinion-detail__dreamdex-row">
          <span className="opinion-detail__dreamdex-label">Question</span>
          <span className="opinion-detail__dreamdex-value">{market.dreamDexQuestion}</span>
        </div>
        <div className="opinion-detail__dreamdex-row">
          <span className="opinion-detail__dreamdex-label">Event Contract ID</span>
          <span className="opinion-detail__dreamdex-value opinion-detail__dreamdex-value--mono">
            {truncateMiddle(market.dreamDexMarketId)}
          </span>
        </div>
        {market.dreamDexMarketAddress && (
          <div className="opinion-detail__dreamdex-row">
            <span className="opinion-detail__dreamdex-label">
              <Link2 size={11} /> Contract Address
            </span>
            <span className="opinion-detail__dreamdex-value opinion-detail__dreamdex-value--mono">
              {truncateMiddle(market.dreamDexMarketAddress)}
            </span>
          </div>
        )}
        {market.asset && (
          <div className="opinion-detail__dreamdex-row">
            <span className="opinion-detail__dreamdex-label">Asset</span>
            <span className="opinion-detail__dreamdex-value">{market.asset}</span>
          </div>
        )}
        {market.targetPrice !== undefined && (
          <div className="opinion-detail__dreamdex-row">
            <span className="opinion-detail__dreamdex-label">Strike / Target</span>
            <span className="opinion-detail__dreamdex-value">{market.targetPrice}</span>
          </div>
        )}
        <div className="opinion-detail__dreamdex-row">
          <span className="opinion-detail__dreamdex-label">Market Closes</span>
          <span className="opinion-detail__dreamdex-value">{formatDeadlineDate(market.deadline)}</span>
        </div>
      </div>

      {isResolved ? (
        <div className="surface-card opinion-detail__resolution">
          <p className="opinion-detail__section-title">Market Resolved</p>
          <p className="opinion-detail__resolution-outcome">
            {market.resolvedOutcome === 'yes' ? 'YES WON' : 'NO WON'}
          </p>

          {userPosition && market.resolvedOutcome && (
            <div className="opinion-detail__result">
              <p className="opinion-detail__result-label">YOUR POSITION</p>
              <p className="opinion-detail__result-position">
                {userPosition.outcome.toUpperCase()} · {num(userPosition.amount)} credits
              </p>
              <p className={`opinion-detail__result-outcome ${userPosition.outcome === market.resolvedOutcome ? 'opinion-detail__result-outcome--correct' : 'opinion-detail__result-outcome--incorrect'}`}>
                {userPosition.outcome === market.resolvedOutcome ? (
                  <><CheckCircle2 size={14} /> Correct</>
                ) : (
                  <><XCircle size={14} /> Incorrect</>
                )}
              </p>
              {userPosition.potentialPayout !== undefined && (
                <p className="opinion-detail__result-payout">
                  Final payout: <strong>{num(userPosition.potentialPayout)}</strong> credits
                </p>
              )}
            </div>
          )}
        </div>
      ) : userPosition ? (
        <div className="surface-card opinion-detail__position">
          <p className="opinion-detail__section-title">Your Position</p>
          <p className={`opinion-detail__position-outcome opinion-detail__position-outcome--${userPosition.outcome}`}>
            {userPosition.outcome.toUpperCase()}
          </p>
          <p className="opinion-detail__position-amount">{num(userPosition.amount)} credits</p>
          {userPosition.potentialPayout !== undefined && (
            <p className="opinion-detail__position-payout">
              Potential payout: <strong>{num(userPosition.potentialPayout)}</strong> credits
            </p>
          )}

          {isPastDeadline && (
            <div className="opinion-detail__resolve-block">
              <p className="opinion-detail__resolve-help">
                This market settles when DreamDEX provides the winning outcome.
              </p>
              <button type="button" className="btn btn--secondary btn--block" onClick={handleCheckResolution}>
                Check DreamDEX Resolution
              </button>
              {resolveMessage && <p className="opinion-detail__resolve-message">{resolveMessage}</p>}
              <div className="opinion-detail__demo-fallback">
                <span className="opinion-detail__demo-fallback-label">Demo Mode · Presentation Fallback</span>
                <div className="opinion-detail__demo-fallback-actions">
                  <button type="button" onClick={() => handleDemoResolve('yes')}>Demo YES</button>
                  <button type="button" onClick={() => handleDemoResolve('no')}>Demo NO</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : isOpenForTrading ? (
        <div className="surface-card opinion-detail__trade">
          <p className="opinion-detail__section-title">Your Position</p>

          <div className="opinion-detail__outcome-toggle">
            <button
              type="button"
              className={`opinion-detail__outcome-btn opinion-detail__outcome-btn--yes ${selectedOutcome === 'yes' ? 'opinion-detail__outcome-btn--active' : ''}`}
              onClick={() => setSelectedOutcome('yes')}
            >
              YES
            </button>
            <button
              type="button"
              className={`opinion-detail__outcome-btn opinion-detail__outcome-btn--no ${selectedOutcome === 'no' ? 'opinion-detail__outcome-btn--active' : ''}`}
              onClick={() => setSelectedOutcome('no')}
            >
              NO
            </button>
          </div>

          <label className="opinion-detail__amount-field">
            <span>Amount</span>
            <div className="opinion-detail__amount-input">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setTradeError(null);
                }}
              />
              <span>credits</span>
            </div>
          </label>

          <div className="opinion-detail__quick-amounts">
            {QUICK_AMOUNTS.map((quick) => (
              <button
                key={quick}
                type="button"
                className={`opinion-detail__quick-amount ${Number(amount) === quick ? 'opinion-detail__quick-amount--active' : ''}`}
                onClick={() => {
                  setAmount(String(quick));
                  setTradeError(null);
                }}
              >
                {quick}
              </button>
            ))}
          </div>

          <div className="opinion-detail__preview">
            <div className="opinion-detail__preview-row">
              <span>Potential payout</span>
              <strong>{isAmountValid ? num(potentialPayout) : '—'} credits</strong>
            </div>
            <div className="opinion-detail__preview-row">
              <span>Potential profit</span>
              <strong>{isAmountValid ? num(potentialProfit) : '—'} credits</strong>
            </div>
          </div>

          {tradeError && <p className="opinion-detail__trade-error">{tradeError}</p>}

          <button
            type="button"
            className={`btn btn--block opinion-detail__submit opinion-detail__submit--${selectedOutcome}`}
            onClick={handleTrade}
          >
            <Zap size={15} />
            Take {selectedOutcome.toUpperCase()}
          </button>

          <p className="opinion-detail__demo-disclaimer">
            XP prediction — stakes are demo credits, not real money.
          </p>
        </div>
      ) : (
        <div className="surface-card opinion-detail__closed-note">
          <p>This market has closed and is awaiting DreamDEX resolution.</p>
        </div>
      )}
    </div>
  );
}

export default OpinionMarketDetail;
