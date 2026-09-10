import { useEffect, useRef, useState } from 'react';
import {
  Share2,
  X,
  Copy,
  Send,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react';
import SharePreviewCard from './SharePreviewCard';
import { logActivity } from '../services/activity';
import { showToast } from '../utils/toast';
import type { OpinionMarket, OpinionPosition } from '../types/opinionMarket';
import {
  buildSharePreview,
  buildShareUrl,
  buildShareText,
  buildShareTargets,
  openShareWindow,
  shareNative,
  copyShareLink,
} from '../utils/sharePrediction';
import './SharePrediction.css';

interface SharePredictionProps {
  market: OpinionMarket;
  userPosition?: OpinionPosition;
  question: string;
  asset: string;
  yesPercent: number;
  noPercent: number;
  poolLabel: string;
}

function SharePrediction({
  market,
  userPosition,
  question,
  asset,
  yesPercent,
  noPercent,
  poolLabel,
}: SharePredictionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!isOpen) return undefined;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = (): void => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const preview = buildSharePreview(market, question, asset, yesPercent, noPercent, poolLabel);
  const shareUrl = buildShareUrl(market, preview);
  const shareText = buildShareText(question, asset, yesPercent, userPosition);
  const targets = buildShareTargets(shareText, shareUrl);

  const recordShare = (): void => {
    logActivity({
      type: 'prediction-shared',
      marketId: market.id,
      asset,
      question,
    });
  };

  const handleCopyLink = async (): Promise<void> => {
    const success = await copyShareLink(shareUrl);
    if (success) {
      showToast('Link copied to clipboard.');
      recordShare();
    } else {
      showToast('Could not copy link.', 'error');
    }
  };

  const handlePlatformShare = (target: 'x' | 'whatsapp' | 'telegram'): void => {
    const opened = openShareWindow(targets[target]);
    if (opened) {
      recordShare();
    } else {
      showToast('Could not open share window.', 'error');
    }
  };

  const handleNativeShare = async (): Promise<void> => {
    const result = await shareNative({
      title: 'DreamSquad Opinion Market',
      text: shareText,
      url: shareUrl,
    });

    if (result === 'shared') {
      recordShare();
      handleClose();
    } else if (result === 'error') {
      showToast('Could not share right now.', 'error');
    }
    // 'cancelled' and 'unsupported' are silent — no error toast.
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="btn btn--secondary btn--block share-prediction__trigger"
        onClick={() => setIsOpen(true)}
      >
        <Share2 size={15} />
        Share Prediction
      </button>

      {isOpen && (
        <div
          className="share-prediction__overlay"
          onClick={handleClose}
          role="presentation"
        >
          <div
            className="share-prediction__sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Share this opinion market"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-prediction__sheet-header">
              <p className="share-prediction__sheet-title">Share Prediction</p>
              <button
                type="button"
                ref={closeButtonRef}
                className="share-prediction__close"
                onClick={handleClose}
                aria-label="Close share sheet"
              >
                <X size={16} />
              </button>
            </div>

            <SharePreviewCard preview={preview} />

            <div className="share-prediction__actions">
              <button
                type="button"
                className="share-prediction__action share-prediction__action--x"
                onClick={() => handlePlatformShare('x')}
                aria-label="Share on X"
              >
                <span className="share-prediction__action-icon">𝕏</span>
                Share on X
              </button>

              <button
                type="button"
                className="share-prediction__action share-prediction__action--whatsapp"
                onClick={() => handlePlatformShare('whatsapp')}
                aria-label="Share on WhatsApp"
              >
                <MessageCircle size={16} strokeWidth={2.2} />
                WhatsApp
              </button>

              <button
                type="button"
                className="share-prediction__action share-prediction__action--telegram"
                onClick={() => handlePlatformShare('telegram')}
                aria-label="Share on Telegram"
              >
                <Send size={16} strokeWidth={2.2} />
                Telegram
              </button>

              <button
                type="button"
                className="share-prediction__action"
                onClick={handleCopyLink}
                aria-label="Copy share link"
              >
                <Copy size={16} strokeWidth={2.2} />
                Copy Link
              </button>

              {supportsNativeShare && (
                <button
                  type="button"
                  className="share-prediction__action"
                  onClick={handleNativeShare}
                  aria-label="More share options"
                >
                  <MoreHorizontal size={16} strokeWidth={2.2} />
                  More
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SharePrediction;
