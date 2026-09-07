export const XP_RULES = {
  createPrediction: 25,
  makePrediction: 10,
  correctPrediction: 100,
  streakBonusPerStep: 10,
  streakBonusCap: 100,
} as const;

/** XP awarded for a correct prediction, including a capped streak bonus. */
export function calculatePredictionXP(streakBeforeThisResult: number): number {
  const streakBonus = Math.min(streakBeforeThisResult * XP_RULES.streakBonusPerStep, XP_RULES.streakBonusCap);
  return XP_RULES.correctPrediction + streakBonus;
}

/** Next streak value given the previous streak and whether this result was correct. */
export function calculateStreak(previousStreak: number, wasCorrect: boolean): number {
  return wasCorrect ? previousStreak + 1 : 0;
}

export type Rank = 'Rookie' | 'Analyst' | 'Sharp' | 'Oracle' | 'Legend';

const RANK_THRESHOLDS: Array<{ minXp: number; rank: Rank }> = [
  { minXp: 0, rank: 'Rookie' },
  { minXp: 250, rank: 'Analyst' },
  { minXp: 750, rank: 'Sharp' },
  { minXp: 2000, rank: 'Oracle' },
  { minXp: 5000, rank: 'Legend' },
];

/** Simple XP-threshold rank ladder — easy to retune without touching call sites. */
export function calculateRank(xp: number): Rank {
  let current: Rank = 'Rookie';
  for (const tier of RANK_THRESHOLDS) {
    if (xp >= tier.minXp) current = tier.rank;
  }
  return current;
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
