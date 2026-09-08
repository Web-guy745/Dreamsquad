import { CheckCircle2, Clock, DollarSign, TrendingUp, XCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import type { OpinionMarket, OpinionPosition } from '../types/opinionMarket';
import { getWalletIdentity } from '../services/wallet';
import './OpinionMarketCard.css';

interface Props {
  market: OpinionMarket;
  userPosition?: OpinionPosition;
  onVote: (outcome: 'yes' | 'no', amount: number) => void;
  onResolve?: () => void;
  onDemoResolve?: (outcome: 'yes' | 'no') => void;
  onOpenDetail?: (marketId: string) => void;
}

function deadline(iso: string) {
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'Ending today';
  if (days === 1) return 'Ends tomorrow';
  if (days <= 6) return `Ends ${d.toLocaleDateString(undefined, { weekday: 'long' })}`;
  return `Ends ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function num(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

export function cleanAsset(market: OpinionMarket): string {
  const raw = String(
    market.asset || market.dreamDexQuestion || ''
  ).trim();

  const firstToken = raw.match(/^[A-Za-z0-9]+/);

  if (firstToken) {
    return firstToken[0].toUpperCase();
  }

  return 'DREAMDEX';
}

export function cleanQuestion(market: OpinionMarket): string {
  const raw = market.question.trim();
  const asset = cleanAsset(market);

  const direction = raw.match(/\b(UP|DOWN)\b/i)?.[1]?.toUpperCase();

  if (
    raw.includes('-O-') ||
    raw.includes('/USDso') ||
    /[A-Z0-9]+-O-\d{2}[A-Z]{3}\d{2}/i.test(raw)
  ) {
    return direction
      ? `Would ${asset} finish ${direction}?`
      : `Would ${asset} finish UP or DOWN?`;
  }

  return raw;
}

export default function OpinionMarketCard({
  market,
  userPosition,
  onVote,
  onResolve,
  onDemoResolve,
  onOpenDetail,
}: Props): JSX.Element {
  const [amount, setAmount] = useState(String(userPosition?.amount || 100));
  const total = market.yesPool + market.noPool;
  const yes = total ? Math.round((market.yesPool / total) * 100) : 50;
  const no = 100 - yes;
  const hasPosition = Boolean(userPosition);
  const open = market.status === 'open';

  const trade = (outcome: 'yes' | 'no') => {
    const value = Number(amount);
    if (Number.isFinite(value) && value > 0) onVote(outcome, value);
  };

  return (
    <div className="surface-card opinion-card">
      <div
        className={`opinion-card__identity ${onOpenDetail ? 'opinion-card__identity--clickable' : ''}`}
        role={onOpenDetail ? 'button' : undefined}
        tabIndex={onOpenDetail ? 0 : undefined}
        onClick={onOpenDetail ? () => onOpenDetail(market.id) : undefined}
        onKeyDown={
          onOpenDetail
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenDetail(market.id);
                }
              }
            : undefined
        }
      >
        <div className="opinion-card__top">
          <span className="opinion-card__asset">{cleanAsset(market)} · UP/DOWN</span>
          <span className="opinion-card__reward">
            <Zap size={11} /> +{market.xpReward} XP
          </span>
        </div>

        <p className="opinion-card__question">{cleanQuestion(market)}</p>

        <p className="opinion-card__contract">
          DreamDEX Event Contract: {market.dreamDexQuestion}
        </p>

        <div className="opinion-card__odds">
          <span className="opinion-card__odds-yes">YES {yes}%</span>
          <span className="opinion-card__odds-no">NO {no}%</span>
        </div>

        <div className="opinion-card__meta">
          <span>by {market.creator}</span>
          <span>
            <Clock size={11} /> {deadline(market.deadline)}
          </span>
        </div>

        <div className="opinion-card__meta">
          <span><DollarSign size={11} /> Pool {num(total)}</span>
          <span><TrendingUp size={11} /> Volume {num(market.volume)}</span>
        </div>

        <div className="opinion-card__meta">
          <span>Fee {market.feeBps / 100}%</span>
          <span>Creator gets {market.creatorFeeShare * 100}%</span>
        </div>
      </div>

      {open ? (
        <>
          {!hasPosition && (
            <label className="opinion-card__stake">
              <span>Stake</span>
              <div className="opinion-card__stake-input">
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span>credits</span>
              </div>
            </label>
          )}

          <div className="opinion-card__actions">
            <button
              type="button"
              className="opinion-card__vote opinion-card__vote--yes"
              disabled={hasPosition}
              onClick={() => trade('yes')}
            >
              <span>YES</span>
              <small>Pool {num(market.yesPool)}</small>
            </button>

            <button
              type="button"
              className="opinion-card__vote opinion-card__vote--no"
              disabled={hasPosition}
              onClick={() => trade('no')}
            >
              <span>NO</span>
              <small>Pool {num(market.noPool)}</small>
            </button>
          </div>

          {hasPosition && (
            <p className="opinion-card__voted-note">
              You took a <strong>{userPosition?.outcome.toUpperCase()}</strong> position with{' '}
              <strong>{num(userPosition?.amount || 0)}</strong> credits.
              {userPosition?.potentialPayout !== undefined && (
                <> Potential payout: <strong>{num(userPosition.potentialPayout)}</strong> credits.</>
              )}
            </p>
          )}

          {hasPosition && onResolve && (
            <div className="opinion-card__demo-resolution">
              <span className="opinion-card__demo-label">DreamDEX Resolution</span>
              <p className="opinion-card__resolution-status">
                ⏳ Waiting for the Event Contract to resolve.
              </p>
              <p className="opinion-card__resolution-help">
                This market settles when DreamDEX provides the winning outcome.
              </p>
              <div className="opinion-card__resolve-actions">
                <button type="button" onClick={onResolve}>
                  Check DreamDEX Resolution
                </button>
              </div>

              {onDemoResolve && (
                <div className="opinion-card__demo-fallback">
                  <span className="opinion-card__demo-label">Demo Mode · Presentation Fallback</span>
                  <div className="opinion-card__resolve-actions">
                    <button type="button" onClick={() => onDemoResolve('yes')}>
                      Demo YES
                    </button>
                    <button type="button" onClick={() => onDemoResolve('no')}>
                      Demo NO
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="opinion-card__resolved">
          <span>Resolved: {market.resolvedOutcome?.toUpperCase() || 'EXPIRED'}</span>

          {userPosition && market.resolvedOutcome && (
            <>
              <span className="opinion-card__result">
                {userPosition.outcome === market.resolvedOutcome ? (
                  <><CheckCircle2 size={14} /> Correct · +XP</>
                ) : (
                  <><XCircle size={14} /> Incorrect</>
                )}
              </span>

              {userPosition.potentialPayout !== undefined && (
                <span className="opinion-card__payout">
                  Final payout: <strong>{num(userPosition.potentialPayout)}</strong> credits
                </span>
              )}
            </>
          )}
        </div>
      )}

      {market.creator === getWalletIdentity() && market.creatorEarnings > 0 && (
        <div className="opinion-card__voted-note">
          Creator earnings: <strong>{num(market.creatorEarnings)}</strong>
        </div>
      )}
    </div>
  );
}
