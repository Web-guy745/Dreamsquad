import { Zap } from 'lucide-react';
import type { SharePreviewPayload } from '../utils/sharePrediction';
import './SharePreviewCard.css';

interface SharePreviewCardProps {
  preview: SharePreviewPayload;
}

function SharePreviewCard({ preview }: SharePreviewCardProps): JSX.Element {
  const yesPercent = Math.max(0, Math.min(100, Math.round(preview.yesPercent)));
  const noPercent = Math.max(0, Math.min(100, Math.round(preview.noPercent)));

  return (
    <div className="share-preview-card">
      <div className="share-preview-card__glow" aria-hidden="true" />

      <div className="share-preview-card__top">
        <span className="share-preview-card__brand">
          <Zap size={11} strokeWidth={2.6} />
          DREAMSQUAD
        </span>

        <span className="share-preview-card__badge">
          OPINION MARKET
        </span>
      </div>

      <div className="share-preview-card__asset">
        {preview.asset}
      </div>

      <p className="share-preview-card__label">COMMUNITY CALL</p>

      <p className="share-preview-card__question">
        {preview.question}
      </p>

      <div className="share-preview-card__sentiment">
        <div className="share-preview-card__sentiment-header">
          <span className="share-preview-card__yes">
            YES {yesPercent}%
          </span>
          <span className="share-preview-card__no">
            NO {noPercent}%
          </span>
        </div>

        <div className="share-preview-card__odds-bar" aria-hidden="true">
          <div
            className="share-preview-card__yes-fill"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="share-preview-card__no-fill"
            style={{ width: `${noPercent}%` }}
          />
        </div>
      </div>

      <div className="share-preview-card__meta">
        <span>
          <strong>POOL</strong> {preview.poolLabel}
        </span>
        <span>
          <strong>ENDS IN</strong> {preview.endsLabel}
        </span>
      </div>

      <div className="share-preview-card__footer">
        <span>DREAMSQUAD</span>
        <span>Powered by DreamDEX Event Contracts</span>
      </div>
    </div>
  );
}

export default SharePreviewCard;
