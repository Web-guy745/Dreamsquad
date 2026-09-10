import { useEffect, useRef, useState } from 'react';
import {
  Share2,
  X,
  Copy,
  Send,
  MessageCircle,
  MoreHorizontal,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import { toBlob } from 'html-to-image';
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);

  const supportsNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function';

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

  const preview = buildSharePreview(
    market,
    question,
    asset,
    yesPercent,
    noPercent,
    poolLabel,
  );

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

  const createBannerBlob = async (): Promise<Blob | null> => {
    const element = previewCardRef.current;

    if (!element) {
      showToast('Could not prepare the banner.', 'error');
      return null;
    }

    setIsGeneratingImage(true);

    try {
      return await toBlob(element, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#08070d',
      });
    } catch {
      showToast('Could not generate the banner.', 'error');
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getBannerFilename = (): string => {
    const cleanAsset = asset
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    return `dreamsquad-${cleanAsset || 'opinion-market'}.png`;
  };

  const handleSaveBanner = async (): Promise<void> => {
    const blob = await createBannerBlob();

    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = getBannerFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    recordShare();
    showToast('DreamSquad banner saved.');
  };

  const handleShareImage = async (): Promise<void> => {
    const blob = await createBannerBlob();

    if (!blob) return;

    const file = new File([blob], getBannerFilename(), {
      type: 'image/png',
    });

    try {
      const canShareFiles =
        supportsNativeShare &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        await navigator.share({
          title: 'DreamSquad Opinion Market',
          text: shareText,
          files: [file],
        });

        recordShare();
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = getBannerFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      showToast('Banner saved. Attach it to your post.');
      recordShare();
    } catch (error) {
      const shareError = error as DOMException;

      if (shareError?.name === 'AbortError') {
        return;
      }

      showToast('Could not share the banner.', 'error');
    }
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

  const handlePlatformShare = (
    target: 'x' | 'whatsapp' | 'telegram',
  ): void => {
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
        Share Your Call
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
              <div>
                <p className="share-prediction__sheet-title">
                  Share Your Call
                </p>
                <p className="share-prediction__sheet-subtitle">
                  Let the community take a side.
                </p>
              </div>

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

            <div
              ref={previewCardRef}
              className="share-prediction__image-target"
            >
              <SharePreviewCard preview={preview} />
            </div>

            <div className="share-prediction__image-actions">
              <button
                type="button"
                className="share-prediction__image-action share-prediction__image-action--primary"
                onClick={handleShareImage}
                disabled={isGeneratingImage}
              >
                <ImageIcon size={16} strokeWidth={2.2} />
                {isGeneratingImage ? 'Preparing...' : 'Share Image'}
              </button>

              <button
                type="button"
                className="share-prediction__image-action"
                onClick={handleSaveBanner}
                disabled={isGeneratingImage}
              >
                <Download size={16} strokeWidth={2.2} />
                Save Banner
              </button>
            </div>

            <div className="share-prediction__divider">
              <span>OR SHARE LINK</span>
            </div>

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
