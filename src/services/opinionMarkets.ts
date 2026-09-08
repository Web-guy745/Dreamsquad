import { fetchMarketResolution } from './somnia/markets';
import { getWalletIdentity } from './wallet';
import type {
  OpinionMarket,
  OpinionPosition,
  OpinionOutcome,
  UserReputation,
  LeaderboardEntry,
  PredictionHistoryEntry,
} from '../types/opinionMarket';
import {
  calculatePredictionXP,
  calculateStreak,
  XP_RULES,
  calculateAccuracy,
} from '../utils/xp';

/**
 * Opinion Markets are creator-driven YES/NO markets built around
 * real DreamDEX Event Contracts.
 *
 * The current hackathon MVP keeps pool balances and settlement locally
 * in the browser. It does NOT claim to execute real-money/on-chain
 * settlement. The model is intentionally shaped for a future contract.
 */

const STORAGE_KEYS = {
  markets: 'dreamsquad:opinion-markets:v2',
  positions: 'dreamsquad:opinion-positions:v2',
  reputation: 'dreamsquad:reputation:v1',
} as const;

const DEFAULT_FEE_BPS = 500;
const CREATOR_FEE_SHARE = 0.5;
const DEMO_BET_AMOUNT = 100;

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

function userStorageKey(
  key: 'positions' | 'reputation',
): string {
  return `${STORAGE_KEYS[key]}:${getWalletIdentity()}`;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSeedMarket(
  id: string,
  creator: string,
  dreamDexMarketId: string,
  dreamDexQuestion: string,
  question: string,
  asset: string,
  deadlineMs: number,
  yesCount: number,
  noCount: number,
  yesPool: number,
  noPool: number,
): OpinionMarket {
  return {
    id,
    creator,
    dreamDexMarketId,
    dreamDexQuestion,
    question,
    asset,
    deadline: new Date(Date.now() + deadlineMs).toISOString(),
    createdAt: new Date().toISOString(),
    status: 'open',
    resolvedOutcome: null,
    yesCount,
    noCount,
    yesPool,
    noPool,
    volume: yesPool + noPool,
    feeBps: DEFAULT_FEE_BPS,
    creatorFeeShare: CREATOR_FEE_SHARE,
    creatorEarnings: 0,
    settlementStatus: 'pending',
    xpReward: XP_RULES.correctPrediction,
  };
}

function seedOpinionMarkets(): OpinionMarket[] {
  const day = 24 * 60 * 60 * 1000;

  return [
    createSeedMarket(
      'seed-sol-100',
      '0xF3a9…c221',
      'demo-dreamdex-sol-100',
      'SOL price event contract',
      'Will SOL hit $100 before Friday?',
      'SOL',
      3 * day,
      64,
      36,
      6400,
      3600,
    ),
    createSeedMarket(
      'seed-btc-120k',
      '0x8B12…9e04',
      'demo-dreamdex-btc-120k',
      'BTC price event contract',
      'Will BTC hit $120,000?',
      'BTC',
      9 * day,
      41,
      59,
      4100,
      5900,
    ),
    createSeedMarket(
      'seed-eth-above-4k',
      '0x2C77…4a1f',
      'demo-dreamdex-eth-4k',
      'ETH price event contract',
      'Will ETH stay above $4,000?',
      'ETH',
      30 * 60 * 60 * 1000,
      22,
      18,
      2200,
      1800,
    ),
    createSeedMarket(
      'seed-somi-below-1',
      '0x91Da…7bb0',
      'demo-dreamdex-somi-1',
      'SOMI price event contract',
      'Will SOMI stay below $1?',
      'SOMI',
      5 * day,
      12,
      9,
      1200,
      900,
    ),
  ];
}

function getAllMarkets(): OpinionMarket[] {
  const existing = readJson<OpinionMarket[] | null>(STORAGE_KEYS.markets, null);

  if (existing && existing.length > 0) {
    return existing;
  }

  const seeded = seedOpinionMarkets();
  writeJson(STORAGE_KEYS.markets, seeded);
  return seeded;
}

function saveAllMarkets(markets: OpinionMarket[]): void {
  writeJson(STORAGE_KEYS.markets, markets);
}

export function getOpinionMarkets(): OpinionMarket[] {
  return getAllMarkets();
}

export function getResolvedOpinionMarkets(): OpinionMarket[] {
  return [...getAllMarkets()]
    .filter(
      (market) =>
        market.status === 'resolved-yes' ||
        market.status === 'resolved-no',
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );
}


export function getOpinionMarketById(
  id: string,
): OpinionMarket | undefined {
  return getAllMarkets().find((market) => market.id === id);
}

export function getTrendingOpinionMarkets(): OpinionMarket[] {
  return [...getAllMarkets()]
    .filter((market) => market.status === 'open')
    .sort((a, b) => {
      if (b.volume !== a.volume) {
        return b.volume - a.volume;
      }

      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    });
}

export function getEndingSoonOpinionMarkets(): OpinionMarket[] {
  return [...getAllMarkets()]
    .filter((market) => market.status === 'open')
    .sort(
      (a, b) =>
        new Date(a.deadline).getTime() -
        new Date(b.deadline).getTime(),
    );
}

export function getUserCreatedMarkets(): OpinionMarket[] {
  const identity = getWalletIdentity();

  return getAllMarkets().filter((market) => market.creator === identity);
}

export interface CreateOpinionMarketInput {
  dreamDexMarketId: string;
  dreamDexQuestion: string;
  dreamDexMarketAddress?: string;
  question: string;
  asset?: string;
  targetPrice?: number;
  deadline: string;
  feeBps?: number;
}

export interface CreateOpinionMarketResult {
  success: boolean;
  market?: OpinionMarket;
  error?: string;
}

export function createOpinionMarket(
  input: CreateOpinionMarketInput,
): CreateOpinionMarketResult {
  if (!input.dreamDexMarketId.trim()) {
    return {
      success: false,
      error: 'Select a DreamDEX Event Contract.',
    };
  }

  if (!input.dreamDexQuestion.trim()) {
    return {
      success: false,
      error: 'The selected Event Contract needs a question.',
    };
  }

  if (!input.question.trim()) {
    return {
      success: false,
      error: 'Opinion question is required.',
    };
  }

  if (
    input.targetPrice !== undefined &&
    (!Number.isFinite(input.targetPrice) || input.targetPrice <= 0)
  ) {
    return {
      success: false,
      error: 'Target price must be a positive number.',
    };
  }

  if (
    !input.deadline ||
    new Date(input.deadline).getTime() <= Date.now()
  ) {
    return {
      success: false,
      error: 'Deadline must be in the future.',
    };
  }

  const feeBps = input.feeBps ?? DEFAULT_FEE_BPS;

  if (!Number.isFinite(feeBps) || feeBps < 0 || feeBps > 1000) {
    return {
      success: false,
      error: 'Creator fee must be between 0% and 10%.',
    };
  }

  const market: OpinionMarket = {
    id: generateId('opinion'),
    creator: getWalletIdentity(),
    dreamDexMarketId: input.dreamDexMarketId,
    dreamDexQuestion: input.dreamDexQuestion,
    dreamDexMarketAddress: input.dreamDexMarketAddress,
    question: input.question.trim(),
    asset: input.asset,
    targetPrice: input.targetPrice,
    deadline: new Date(input.deadline).toISOString(),
    createdAt: new Date().toISOString(),
    status: 'open',
    resolvedOutcome: null,
    yesCount: 0,
    noCount: 0,
    yesPool: 0,
    noPool: 0,
    volume: 0,
    feeBps,
    creatorFeeShare: CREATOR_FEE_SHARE,
    creatorEarnings: 0,
    settlementStatus: 'pending',
    xpReward: XP_RULES.correctPrediction,
  };

  const markets = getAllMarkets();
  markets.unshift(market);
  saveAllMarkets(markets);
  console.log('[DreamSquad] Opinion market saved:', market);
  console.log('[DreamSquad] Total opinion markets:', markets.length);

  awardXp(XP_RULES.createPrediction);

  return {
    success: true,
    market,
  };
}

export function getUserPosition(
  marketId: string,
): OpinionPosition | undefined {
  const positions = readJson<OpinionPosition[]>(
    userStorageKey('positions'),
    [],
  );

  return positions.find((position) => position.marketId === marketId);
}

export interface PlacePredictionResult {
  success: boolean;
  alreadyPredicted?: boolean;
  xpAwarded?: number;
  amount?: number;
}

/**
 * Pure payout preview: given a market's CURRENT pools, what would a stake
 * of `amount` on `outcome` be worth if that outcome wins? Used both for
 * the live "potential payout" preview before a user trades, and internally
 * by placePrediction() so the two never drift apart.
 */
export function calculatePotentialPayout(
  market: OpinionMarket,
  outcome: OpinionOutcome,
  amount: number,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  const nextYesPool = market.yesPool + (outcome === 'yes' ? amount : 0);
  const nextNoPool = market.noPool + (outcome === 'no' ? amount : 0);
  const nextTotal = nextYesPool + nextNoPool;
  const fee = nextTotal * (market.feeBps / 10_000);
  const creatorFee = fee * market.creatorFeeShare;
  const traderPool = nextTotal - creatorFee - (fee - creatorFee);
  const winningPool = outcome === 'yes' ? nextYesPool : nextNoPool;

  return winningPool > 0 ? (amount / winningPool) * traderPool : amount;
}

export function placePrediction(
  market: OpinionMarket,
  outcome: OpinionOutcome,
  amount = DEMO_BET_AMOUNT,
): PlacePredictionResult {
  if (market.status !== 'open') {
    return { success: false };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false };
  }

  const positions = readJson<OpinionPosition[]>(
    userStorageKey('positions'),
    [],
  );

  if (
    positions.some(
      (position) => position.marketId === market.id,
    )
  ) {
    return {
      success: false,
      alreadyPredicted: true,
    };
  }

  const potentialPayout = calculatePotentialPayout(market, outcome, amount);

  positions.push({
    marketId: market.id,
    outcome,
    amount,
    potentialPayout,
    placedAt: new Date().toISOString(),
  });

  writeJson(userStorageKey('positions'), positions);

  const markets = getAllMarkets().map((item) => {
    if (item.id !== market.id) return item;

    return {
      ...item,
      yesCount:
        item.yesCount + (outcome === 'yes' ? 1 : 0),
      noCount:
        item.noCount + (outcome === 'no' ? 1 : 0),
      yesPool:
        item.yesPool + (outcome === 'yes' ? amount : 0),
      noPool:
        item.noPool + (outcome === 'no' ? amount : 0),
      volume: item.volume + amount,
    };
  });

  saveAllMarkets(markets);

  const reputation = getUserReputation();

  const historyEntry: PredictionHistoryEntry = {
    marketId: market.id,
    asset: market.asset,
    question: market.question,
    outcome,
    result: 'pending',
    amount,
    xpEarned: XP_RULES.makePrediction,
    timestamp: new Date().toISOString(),
  };

  const nextReputation: UserReputation = {
    ...reputation,
    xp: reputation.xp + XP_RULES.makePrediction,
    predictions: reputation.predictions + 1,
    history: [
      historyEntry,
      ...reputation.history,
    ].slice(0, 50),
  };

  writeJson(userStorageKey('reputation'), nextReputation);

  return {
    success: true,
    xpAwarded: XP_RULES.makePrediction,
    amount,
  };
}

const DEFAULT_REPUTATION: UserReputation = {
  xp: 0,
  predictions: 0,
  correct: 0,
  currentStreak: 0,
  bestStreak: 0,
  history: [],
};

export function getUserReputation(): UserReputation {
  return readJson<UserReputation>(
    userStorageKey('reputation'),
    DEFAULT_REPUTATION,
  );
}

function awardXp(amount: number): void {
  const reputation = getUserReputation();

  writeJson(userStorageKey('reputation'), {
    ...reputation,
    xp: reputation.xp + amount,
  });
}

export async function resolveFromDreamDex(
  marketId: string,
): Promise<boolean> {
  const markets = getAllMarkets();
  const market = markets.find((item) => item.id === marketId);

  if (!market || market.status !== 'open') return false;

  const outcome = await fetchMarketResolution(
    market.dreamDexMarketId,
  );

  if (!outcome) return false;

  return resolveOpinionMarket(marketId, outcome);
}

export function resolveOpinionMarket(
  marketId: string,
  outcome: OpinionOutcome,
): boolean {
  const markets = getAllMarkets();
  const market = markets.find((item) => item.id === marketId);

  if (!market || market.status !== 'open') return false;

  const totalPool = market.yesPool + market.noPool;
  const fee = totalPool * (market.feeBps / 10_000);
  const creatorEarnings = fee * market.creatorFeeShare;
  const traderPool = totalPool - fee;

  const winningPool =
    outcome === 'yes' ? market.yesPool : market.noPool;

  const position = getUserPosition(marketId);

  if (position) {
    const payout =
      position.outcome === outcome && winningPool > 0
        ? (position.amount / winningPool) * traderPool
        : 0;

    const positions = readJson<OpinionPosition[]>(
      userStorageKey('positions'),
      [],
    );

    writeJson(
      userStorageKey('positions'),
      positions.map((item) =>
        item.marketId === marketId
          ? { ...item, potentialPayout: payout }
          : item,
      ),
    );

    resolvePrediction(
      marketId,
      position.outcome === outcome,
    );
  }

  const resolvedMarket: OpinionMarket = {
    ...market,
    status:
      outcome === 'yes'
        ? 'resolved-yes'
        : 'resolved-no',
    resolvedOutcome: outcome,
    creatorEarnings,
    settlementStatus: 'demo-settled',
  };

  saveAllMarkets(
    markets.map((item) =>
      item.id === marketId
        ? resolvedMarket
        : item,
    ),
  );

  return true;
}

export function resolvePrediction(
  marketId: string,
  wasCorrect: boolean,
): void {
  const reputation = getUserReputation();

  const nextStreak = calculateStreak(
    reputation.currentStreak,
    wasCorrect,
  );

  const xpDelta = wasCorrect
    ? calculatePredictionXP(
        reputation.currentStreak,
      )
    : 0;

  const history = reputation.history.map(
    (entry) =>
      entry.marketId === marketId &&
      entry.result === 'pending'
        ? {
            ...entry,
            result: wasCorrect
              ? 'correct'
              : 'incorrect',
            xpEarned:
              entry.xpEarned + xpDelta,
          }
        : entry,
  );

  writeJson(userStorageKey('reputation'), {
    ...reputation,
    xp: reputation.xp + xpDelta,
    correct:
      reputation.correct +
      (wasCorrect ? 1 : 0),
    currentStreak: nextStreak,
    bestStreak: Math.max(
      reputation.bestStreak,
      nextStreak,
    ),
    history,
  });
}

export function describeOpinionMarket(
  market: OpinionMarket,
): string {
  return market.question;
}

export function getCreatorEarnings(): number {
  const identity = getWalletIdentity();

  return getAllMarkets()
    .filter((market) => market.creator === identity)
    .reduce(
      (total, market) =>
        total + market.creatorEarnings,
      0,
    );
}

export function getTotalOpinionVolume(): number {
  return getAllMarkets().reduce(
    (total, market) =>
      total + market.volume,
    0,
  );
}

const DEMO_LEADERBOARD: Array<{
  id: string;
  displayName: string;
  xp: number;
  accuracy: number;
}> = [
  {
    id: 'demo-1',
    displayName: 'ChainSage',
    xp: 4820,
    accuracy: 71,
  },
  {
    id: 'demo-2',
    displayName: 'PredictorX',
    xp: 3210,
    accuracy: 64,
  },
  {
    id: 'demo-3',
    displayName: 'SomniaFan',
    xp: 2150,
    accuracy: 58,
  },
  {
    id: 'demo-4',
    displayName: 'OracleOwl',
    xp: 1380,
    accuracy: 62,
  },
  {
    id: 'demo-5',
    displayName: 'DreamRunner',
    xp: 640,
    accuracy: 50,
  },
];

export function getLeaderboard(): LeaderboardEntry[] {
  const reputation = getUserReputation();

  const entries: LeaderboardEntry[] = [
    ...DEMO_LEADERBOARD.map((entry) => ({
      ...entry,
      isCurrentUser: false,
    })),
    {
      id: getWalletIdentity(),
      displayName:
        getWalletIdentity() === 'guest'
          ? 'Guest'
          : `${getWalletIdentity().slice(0, 6)}...${getWalletIdentity().slice(-4)}`,
      xp: reputation.xp,
      accuracy: calculateAccuracy(
        reputation.correct,
        reputation.predictions,
      ),
      isCurrentUser: true,
    },
  ];

  return entries.sort(
    (a, b) =>
      b.xp - a.xp ||
      b.accuracy - a.accuracy,
  );
}
