import { useEffect, useState } from 'react';
import './Countdown.css';

interface CountdownProps {
  deadline: string;
  /** When true, skips the live timer and renders a closed label immediately. */
  closed?: boolean;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Live-updating countdown to a deadline. Ticks every second and cleans up
 * its interval on unmount/deadline change. Never shows negative time and
 * degrades to a static "CLOSED" state for invalid/missing/past deadlines.
 */
function Countdown({ deadline, closed }: CountdownProps): JSX.Element {
  const deadlineMs = new Date(deadline).getTime();
  const isValidDeadline = Number.isFinite(deadlineMs);

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!isValidDeadline || closed) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isValidDeadline, closed, deadline]);

  if (!isValidDeadline) {
    return (
      <span className="countdown countdown--closed">
        <span className="countdown__label">CLOSED</span>
      </span>
    );
  }

  const remainingMs = deadlineMs - now;
  const isClosed = closed || remainingMs <= 0;

  if (isClosed) {
    return (
      <span className="countdown countdown--closed">
        <span className="countdown__label">CLOSED</span>
      </span>
    );
  }

  const isEndingSoon = remainingMs <= 60_000;

  return (
    <span className={`countdown ${isEndingSoon ? 'countdown--soon' : ''}`}>
      <span className="countdown__label">{isEndingSoon ? 'Ending soon' : 'Ends in'}</span>
      <span className="countdown__value">{formatRemaining(remainingMs)}</span>
    </span>
  );
}

export default Countdown;
