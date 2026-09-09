import { Zap, TrendingUp, Trophy, Coins } from 'lucide-react';
import type { ActivityEntry } from '../services/activity';
import EmptyState from './EmptyState';
import './ActivityFeed.css';

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function renderEntry(entry: ActivityEntry): JSX.Element {
  switch (entry.type) {
    case 'market-created':
      return (
        <>
          <span className="activity-feed__icon activity-feed__icon--created">
            <Zap size={13} strokeWidth={2.4} />
          </span>
          <div className="activity-feed__body">
            <p className="activity-feed__headline">New opinion market created</p>
            <p className="activity-feed__detail">
              {entry.asset && <span className="activity-feed__asset">{entry.asset}</span>} {entry.question}
            </p>
          </div>
        </>
      );
    case 'position-taken':
      return (
        <>
          <span className={`activity-feed__icon activity-feed__icon--${entry.outcome}`}>
            <TrendingUp size={13} strokeWidth={2.4} />
          </span>
          <div className="activity-feed__body">
            <p className="activity-feed__headline">
              {entry.outcome?.toUpperCase()} position taken
            </p>
            <p className="activity-feed__detail">
              {entry.amount} credits · {entry.question}
            </p>
          </div>
        </>
      );
    case 'market-resolved':
      return (
        <>
          <span className="activity-feed__icon activity-feed__icon--resolved">
            <Trophy size={13} strokeWidth={2.4} />
          </span>
          <div className="activity-feed__body">
            <p className="activity-feed__headline">Market resolved</p>
            <p className="activity-feed__detail">
              {entry.outcome?.toUpperCase()} WON · {entry.question}
            </p>
          </div>
        </>
      );
    case 'creator-earned':
      return (
        <>
          <span className="activity-feed__icon activity-feed__icon--earned">
            <Coins size={13} strokeWidth={2.4} />
          </span>
          <div className="activity-feed__body">
            <p className="activity-feed__headline">Creator earned fees</p>
            <p className="activity-feed__detail">
              {entry.creatorEarnings} credits · {entry.question}
            </p>
          </div>
        </>
      );
    default:
      return <></>;
  }
}

function ActivityFeed({ entries }: ActivityFeedProps): JSX.Element {
  if (entries.length === 0) {
    return <EmptyState message="No recent activity." />;
  }

  return (
    <div className="activity-feed">
      {entries.map((entry) => (
        <div key={entry.id} className="surface-card activity-feed__row">
          {renderEntry(entry)}
          <span className="activity-feed__time">{timeAgo(entry.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}

export default ActivityFeed;
