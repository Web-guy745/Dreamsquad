import { WifiOff, RotateCcw } from 'lucide-react';
import './DataSourceNotice.css';

interface DataSourceNoticeProps {
  onRetry: () => void;
}

/**
 * Shown when DreamDEX market data was unavailable and the app fell back to
 * mock/preview data. The app never blocks on this — content underneath
 * still renders — but the retry action lets the user re-attempt a live
 * DreamDEX fetch without a full page reload.
 */
function DataSourceNotice({ onRetry }: DataSourceNoticeProps): JSX.Element {
  return (
    <div className="data-source-notice" role="status">
      <WifiOff size={13} strokeWidth={2.2} />
      <span>DreamDEX market data unavailable — showing preview markets</span>
      <button type="button" className="data-source-notice__retry" onClick={onRetry} aria-label="Retry loading live markets">
        <RotateCcw size={12} strokeWidth={2.4} />
        Retry
      </button>
    </div>
  );
}

export default DataSourceNotice;
