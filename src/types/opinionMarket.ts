export type OpinionOutcome = 'yes' | 'no';

export type OpinionStatus =
  | 'open'
  | 'resolved-yes'
  | 'resolved-no'
  | 'expired';

export type SettlementStatus =
  | 'pending'
  | 'demo-settled'
  | 'onchain-settled';

export interface OpinionMarket {
  id: string;

  // Creator
  creator: string;

  // The real DreamDEX Event Contract this market is built around
  dreamDexMarketId: string;
  dreamDexQuestion: string;
  dreamDexMarketAddress?: string;

  // Human-friendly opinion market
  question: string;
  asset?: string;
  targetPrice?: number;

  // Timing
  deadline: string;
  createdAt: string;

  // Market state
  status: OpinionStatus;
  resolvedOutcome: OpinionOutcome | null;

  // YES / NO participation
  yesCount: number;
  noCount: number;
  yesPool: number;
  noPool: number;
  volume: number;

  // Economics
  feeBps: number;
  creatorFeeShare: number;
  creatorEarnings: number;

  // Settlement
  settlementStatus: SettlementStatus;
  onchainMarketId?: string;
  resolver?: string;

  // DreamSquad reputation layer
  xpReward: number;
}

export interface OpinionProbabilities {
  yesProbability: number;
  noProbability: number;
}

export interface OpinionPosition {
  marketId: string;
  outcome: OpinionOutcome;
  amount: number;
  potentialPayout?: number;
  placedAt: string;
}

export interface PredictionHistoryEntry {
  marketId: string;
  asset?: string;
  question: string;
  outcome: OpinionOutcome;
  result: 'pending' | 'correct' | 'incorrect';
  amount: number;
  potentialPayout?: number;
  xpEarned: number;
  timestamp: string;
}

export interface UserReputation {
  xp: number;
  predictions: number;
  correct: number;
  currentStreak: number;
  bestStreak: number;
  history: PredictionHistoryEntry[];
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  xp: number;
  accuracy: number;
  predictions: number;
  marketsCreated: number;
  isCurrentUser: boolean;
}
