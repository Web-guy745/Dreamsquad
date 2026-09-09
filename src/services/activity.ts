/**
 * Local activity feed for this browser only. This is NOT a real-time,
 * multi-user, cross-device feed — it logs actual actions taken in this
 * DreamSquad session (create/trade/resolve), nothing fabricated.
 */

export type ActivityType =
  | 'market-created'
  | 'position-taken'
  | 'market-resolved'
  | 'creator-earned';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  timestamp: string;
  marketId: string;
  asset?: string;
  question: string;
  outcome?: 'yes' | 'no';
  amount?: number;
  creatorEarnings?: number;
}

const STORAGE_KEY = 'dreamsquad:activity:v1';
const MAX_ENTRIES = 30;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the app usable if localStorage is unavailable.
  }
}

export function logActivity(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): void {
  const existing = readJson<ActivityEntry[]>(STORAGE_KEY, []);
  const next: ActivityEntry = {
    ...entry,
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  writeJson(STORAGE_KEY, [next, ...existing].slice(0, MAX_ENTRIES));
}

export function getRecentActivity(limit = 8): ActivityEntry[] {
  return readJson<ActivityEntry[]>(STORAGE_KEY, []).slice(0, limit);
}
