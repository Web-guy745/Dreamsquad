import { WifiOff } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import SharePreviewCard from '../components/SharePreviewCard';
import type { SharePreviewPayload } from '../utils/sharePrediction';
import './SharedPredictionPreview.css';

interface SharedPredictionPreviewProps {
  preview: SharePreviewPayload | null;
  onBack: () => void;
}

function SharedPredictionPreview({ preview, onBack }: SharedPredictionPreviewProps): JSX.Element {
  return (
    <div className="page shared-preview-page">
      <ScreenHeader onBack={onBack} />

      <div className="shared-preview-page__notice">
        <WifiOff size={20} strokeWidth={1.8} />
        <p className="shared-preview-page__notice-title">Shared prediction unavailable on this device</p>
        <p className="shared-preview-page__notice-text">
          Opinion Markets are stored locally in each browser. This market was shared from a different
          device or browser, so live trading data isn't available here — but here's what was shared:
        </p>
      </div>

      {preview ? (
        <SharePreviewCard preview={preview} />
      ) : (
        <p className="shared-preview-page__notice-text">No preview information was included in this link.</p>
      )}

      <p className="shared-preview-page__hint">
        Open Opinion Markets on this device to explore live DreamDEX-backed predictions.
      </p>
    </div>
  );
}

export default SharedPredictionPreview;
