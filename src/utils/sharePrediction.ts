import type { OpinionMarket, OpinionPosition } from '../types/opinionMarket';

/**
 * Everything needed to render a share preview card, and nothing else.
 * This is the ONLY data that ever gets encoded into a shared URL — no
 * wallet identity, no position data, no localStorage internals.
 */
export interface SharePreviewPayload {
  question: string;
  asset: string;
  yesPercent: number;
  noPercent: number;
  poolLabel: string;
  endsLabel: string;
}

const MARKET_PARAM = 'market';
const PREVIEW_PARAM = 'p';

function base64UrlEncode(value: string): string {
  const base64 = btoa(unescape(encodeURIComponent(value)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return decodeURIComponent(escape(atob(padded)));
}

/** Compact single-unit duration label, e.g. "18m", "2h", "3d", "Closed". */
export function formatCompactDuration(deadline: string): string {
  const deadlineMs = new Date(deadline).getTime();
  if (!Number.isFinite(deadlineMs)) return 'Unknown';

  const remainingMs = deadlineMs - Date.now();
  if (remainingMs <= 0) return 'Closed';

  const minutes = Math.floor(remainingMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function buildSharePreview(
  market: OpinionMarket,
  question: string,
  asset: string,
  yesPercent: number,
  noPercent: number,
  poolLabel: string,
): SharePreviewPayload {
  return {
    question,
    asset,
    yesPercent,
    noPercent,
    poolLabel,
    endsLabel: formatCompactDuration(market.deadline),
  };
}

/** Builds the full shareable URL for a market, embedding a read-only preview payload. */
export function buildShareUrl(market: OpinionMarket, preview: SharePreviewPayload): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set(MARKET_PARAM, market.id);
  url.searchParams.set(PREVIEW_PARAM, base64UrlEncode(JSON.stringify(preview)));
  return url.toString();
}

/** Reads a shared market id + preview payload from the current URL, if present. */
export function parseSharedMarketFromLocation(): { marketId: string | null; preview: SharePreviewPayload | null } {
  const params = new URLSearchParams(window.location.search);
  const marketId = params.get(MARKET_PARAM);
  const rawPreview = params.get(PREVIEW_PARAM);

  let preview: SharePreviewPayload | null = null;
  if (rawPreview) {
    try {
      const decoded = JSON.parse(base64UrlDecode(rawPreview)) as Partial<SharePreviewPayload>;
      if (typeof decoded.question === 'string' && typeof decoded.asset === 'string') {
        preview = {
          question: decoded.question,
          asset: decoded.asset,
          yesPercent: typeof decoded.yesPercent === 'number' ? decoded.yesPercent : 50,
          noPercent: typeof decoded.noPercent === 'number' ? decoded.noPercent : 50,
          poolLabel: typeof decoded.poolLabel === 'string' ? decoded.poolLabel : 'No pool yet',
          endsLabel: typeof decoded.endsLabel === 'string' ? decoded.endsLabel : 'Unknown',
        };
      }
    } catch {
      preview = null;
    }
  }

  return { marketId, preview };
}

/** Removes the share query params from the URL bar without a page reload or history entry. */
export function clearShareParamsFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(MARKET_PARAM);
  url.searchParams.delete(PREVIEW_PARAM);
  window.history.replaceState(null, '', url.toString());
}

/**
 * Share message text. Never claims a position the user doesn't have —
 * uses neutral "community"/"new prediction" wording when there's no
 * userPosition.
 */
export function buildShareText(
  question: string,
  asset: string,
  yesPercent: number,
  userPosition?: OpinionPosition,
): string {
  if (userPosition) {
    const sideLabel = userPosition.outcome.toUpperCase();
    return `My DreamSquad call: ${sideLabel} on "${question}"\nStaked ${userPosition.amount} demo credits · Market says YES ${yesPercent}%\n\n${asset} · Powered by DreamDEX Event Contract\nPredict with me on DreamSquad 👇`;
  }

  return `New DreamSquad prediction: "${question}"\nThe community is predicting YES ${yesPercent}%\n\n${asset} · Powered by DreamDEX Event Contract\nTake a side on DreamSquad 👇`;
}

export interface ShareTargets {
  x: string;
  whatsapp: string;
  telegram: string;
}

export function buildShareTargets(text: string, url: string): ShareTargets {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  return {
    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
  };
}

export function openShareWindow(shareUrl: string): boolean {
  try {
    const win = window.open(shareUrl, '_blank', 'noopener,noreferrer');
    return win !== null;
  } catch {
    return false;
  }
}

export type NativeShareResult = 'shared' | 'cancelled' | 'unsupported' | 'error';

export async function shareNative(data: { title: string; text: string; url: string }): Promise<NativeShareResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unsupported';
  }

  try {
    await navigator.share(data);
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'cancelled';
    }
    return 'error';
  }
}

export async function copyShareLink(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // fall through to legacy fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
