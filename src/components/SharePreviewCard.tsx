import { Zap } from 'lucide-react';
import type { SharePreviewPayload } from '../utils/sharePrediction';
import './SharePreviewCard.css';

interface SharePreviewCardProps {
  preview: SharePreviewPayload;
}

function SharePreviewCard({ preview }: SharePreviewCardProps): JSX.Element {
  return (
    <div className="share-preview-card">
      <div className="share-preview-card__top">
        <span className="share-preview-card__brand">
          <Zap size={11} strokeWidth={2.6} /> DREAMSQUAD
        </span>
        <span className="share-preview-card__asset">{preview.asset} · UP/DOWN</span>
      </div>

      <p className="share-preview-card__question">{preview.question}</p>

      <div className="share-preview-card__odds">
        <div className="share-preview-card__odds-bar">
          <div className="share-preview-card__odds-fill" style={{ width: `${preview.yesPercent}%` }} />
        </div>
        <span className="share-preview-card__odds-label">YES {preview.yesPercent}%</span>
      </div>

      <div className="share-preview-card__meta">
        <span>Pool: {preview.poolLabel}</span>
        <span>Ends: {preview.endsLabel}</span>
      </div>

      <p className="share-preview-card__footer">Powered by DreamDEX Event Contract</p>
    </div>
  );
}

export default SharePreviewCard;
