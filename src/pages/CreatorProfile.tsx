import { useMemo } from 'react';
import { Award, Coins, Flame, LayoutGrid, Percent, Target, User } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import {
  getReputationForAddress,
  getMarketsCreatedCount,
  getCreatorEarningsForAddress,
} from '../services/opinionMarkets';
import { getWalletIdentity } from '../services/wallet';
import { calculateAccuracy, calculateRank } from '../utils/xp';
import { num } from '../components/OpinionMarketCard';
import './CreatorProfile.css';

interface CreatorProfileProps {
  address: string;
  onBack: () => void;
}

function shortenAddress(address: string): string {
  if (address === 'guest') return 'Guest';
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CreatorProfile({ address, onBack }: CreatorProfileProps): JSX.Element {
  const reputation = useMemo(() => getReputationForAddress(address), [address]);
  const marketsCreated = useMemo(() => getMarketsCreatedCount(address), [address]);
  const creatorEarnings = useMemo(() => getCreatorEarningsForAddress(address), [address]);
  const accuracy = calculateAccuracy(reputation.correct, reputation.predictions);
  const rank = calculateRank(reputation.xp);
  const isCurrentUser = address === getWalletIdentity();
  const hasData = reputation.predictions > 0 || reputation.xp > 0 || marketsCreated > 0;

  return (
    <div className="page creator-profile-page">
      <ScreenHeader onBack={onBack} />

      <div className="creator-profile__header">
        <span className="creator-profile__avatar">
          <User size={26} strokeWidth={2} />
        </span>
        <p className="creator-profile__eyebrow">CREATOR</p>
        <h1 className="creator-profile__address">
          {shortenAddress(address)}
          {isCurrentUser && <span className="creator-profile__you-tag">You</span>}
        </h1>
        {hasData && (
          <p className="creator-profile__rank">
            <Award size={12} strokeWidth={2.4} /> {rank}
          </p>
        )}
      </div>

      {!hasData && (
        <div className="surface-card creator-profile__empty">
          <p>No activity recorded for this creator yet in this browser.</p>
        </div>
      )}

      <div className="creator-profile__stats">
        <div className="surface-card creator-profile__stat">
          <span className="creator-profile__stat-icon"><Percent size={16} strokeWidth={2.2} /></span>
          <span className="creator-profile__stat-value">{reputation.predictions > 0 ? `${accuracy}%` : '—'}</span>
          <span className="creator-profile__stat-label">Accuracy</span>
        </div>
        <div className="surface-card creator-profile__stat">
          <span className="creator-profile__stat-icon"><Target size={16} strokeWidth={2.2} /></span>
          <span className="creator-profile__stat-value">{reputation.predictions}</span>
          <span className="creator-profile__stat-label">Predictions</span>
        </div>
        <div className="surface-card creator-profile__stat">
          <span className="creator-profile__stat-icon"><Award size={16} strokeWidth={2.2} /></span>
          <span className="creator-profile__stat-value">{reputation.correct}</span>
          <span className="creator-profile__stat-label">Correct</span>
        </div>
        <div className="surface-card creator-profile__stat">
          <span className="creator-profile__stat-icon"><Award size={16} strokeWidth={2.2} /></span>
          <span className="creator-profile__stat-value">{reputation.xp.toLocaleString()}</span>
          <span className="creator-profile__stat-label">XP</span>
        </div>
        <div className="surface-card creator-profile__stat">
          <span className="creator-profile__stat-icon"><Flame size={16} strokeWidth={2.2} /></span>
          <span className="creator-profile__stat-value">{reputation.currentStreak}</span>
          <span className="creator-profile__stat-label">Current Streak</span>
        </div>
        <div className="surface-card creator-profile__stat">
          <span className="creator-profile__stat-icon"><LayoutGrid size={16} strokeWidth={2.2} /></span>
          <span className="creator-profile__stat-value">{marketsCreated}</span>
          <span className="creator-profile__stat-label">Markets Created</span>
        </div>
      </div>

      {marketsCreated > 0 && (
        <div className="surface-card creator-profile__earnings">
          <p className="creator-profile__section-title">Creator Earnings</p>
          <p className="creator-profile__earnings-value">
            <Coins size={16} strokeWidth={2.2} /> {num(creatorEarnings)} credits
          </p>
          <p className="creator-profile__earnings-note">
            Demo credits earned from trading fees across {marketsCreated} opinion market{marketsCreated === 1 ? '' : 's'}.
          </p>
        </div>
      )}
    </div>
  );
}

export default CreatorProfile;
