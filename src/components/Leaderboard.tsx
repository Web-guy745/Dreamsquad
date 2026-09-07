import { Crown } from 'lucide-react';
import type { LeaderboardEntry } from '../types/opinionMarket';
import './Leaderboard.css';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

function Leaderboard({ entries }: LeaderboardProps): JSX.Element {
  return (
    <div className="surface-card leaderboard">
      {entries.map((entry, index) => (
        <div key={entry.id} className={`leaderboard__row ${entry.isCurrentUser ? 'leaderboard__row--you' : ''}`}>
          <span className="leaderboard__rank">{index === 0 ? <Crown size={14} strokeWidth={2.4} /> : index + 1}</span>
          <span className="leaderboard__name">
            {entry.displayName}
            {!entry.isCurrentUser && <span className="leaderboard__demo-tag">Demo</span>}
            {entry.isCurrentUser && <span className="leaderboard__you-tag">You</span>}
          </span>
          <span className="leaderboard__accuracy">{entry.accuracy}%</span>
          <span className="leaderboard__xp">{entry.xp.toLocaleString()} XP</span>
        </div>
      ))}
    </div>
  );
}

export default Leaderboard;
