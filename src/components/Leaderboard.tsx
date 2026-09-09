import { Crown } from 'lucide-react';
import type { LeaderboardEntry } from '../types/opinionMarket';
import EmptyState from './EmptyState';
import './Leaderboard.css';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onSelect?: (address: string) => void;
}

function Leaderboard({ entries, onSelect }: LeaderboardProps): JSX.Element {
  if (entries.length === 0) {
    return <EmptyState message="No rankings yet." />;
  }

  return (
    <div className="surface-card leaderboard">
      {entries.map((entry, index) => {
        const isClickable = Boolean(onSelect) && entry.id !== 'guest';
        return (
          <button
            key={entry.id}
            type="button"
            className={`leaderboard__row ${entry.isCurrentUser ? 'leaderboard__row--you' : ''}`}
            onClick={isClickable ? () => onSelect?.(entry.id) : undefined}
            disabled={!isClickable}
          >
            <span className="leaderboard__rank">{index === 0 ? <Crown size={14} strokeWidth={2.4} /> : index + 1}</span>
            <span className="leaderboard__name">
              {entry.displayName}
              {entry.isCurrentUser && <span className="leaderboard__you-tag">You</span>}
            </span>
            <span className="leaderboard__predictions">{entry.predictions} calls</span>
            <span className="leaderboard__accuracy">{entry.accuracy}%</span>
            <span className="leaderboard__xp">{entry.xp.toLocaleString()} XP</span>
          </button>
        );
      })}
    </div>
  );
}

export default Leaderboard;
