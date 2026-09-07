import type {
  PredictionOutcome,
  TournamentPrediction,
  TournamentStageId,
  TournamentState,
} from '../types/tournament';
import type { Market } from '../types/market';

const STORAGE_KEY = 'dreamsquad-tournament-v1';

const INITIAL_STATE: TournamentState = {
  predictions: [],
  points: 0,
  currentStage: 'group-stage',
  qualified: false,
  knockoutWon: false,
  semiFinalWon: false,
  finalWins: 0,
  finalLosses: 0,
  champion: false,
};

function readState(): TournamentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...INITIAL_STATE, predictions: [] };
    }

    const parsed = JSON.parse(raw) as TournamentState;

    if (!parsed || !Array.isArray(parsed.predictions)) {
      return { ...INITIAL_STATE, predictions: [] };
    }

    return {
      predictions: parsed.predictions,
      points: Number.isFinite(parsed.points) ? parsed.points : 0,
      currentStage: parsed.currentStage ?? 'group-stage',
      qualified: Boolean(parsed.qualified),
      knockoutWon: Boolean(parsed.knockoutWon),
      semiFinalWon: Boolean(parsed.semiFinalWon),
      finalWins: Number.isFinite(parsed.finalWins) ? parsed.finalWins : 0,
      finalLosses: Number.isFinite(parsed.finalLosses) ? parsed.finalLosses : 0,
      champion: Boolean(parsed.champion),
    };
  } catch {
    return { ...INITIAL_STATE, predictions: [] };
  }
}

function writeState(state: TournamentState): TournamentState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function getTournamentState(): TournamentState {
  return readState();
}

export function resetTournament(): TournamentState {
  return writeState({
    ...INITIAL_STATE,
    predictions: [],
  });
}

export function addPrediction(
  market: Market,
  outcome: PredictionOutcome,
): TournamentPrediction | null {
  if (!market.id || !market.question) {
    return null;
  }

  const state = readState();

  // Group Stage predictions are the only predictions currently
  // created directly from DreamDEX Event Contracts.
  if (state.currentStage !== 'group-stage') {
    return null;
  }

  const existing = state.predictions.find(
    (prediction) => prediction.marketId === market.id,
  );

  if (existing) {
    return existing;
  }

  const resolvedOutcome = market.winningOutcome ?? null;
  const initialPoints =
    resolvedOutcome && outcome === resolvedOutcome ? 3 : 0;

  const prediction: TournamentPrediction = {
    id: `prediction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    marketId: market.id,
    marketSymbol: market.symbol,
    question: market.question,
    outcome,
    stage: state.currentStage,
    points: initialPoints,
    locked: true,
    createdAt: new Date().toISOString(),
    resolvedOutcome,
  };

  return writeState({
    ...state,
    points: state.points + initialPoints,
    predictions: [...state.predictions, prediction],
  }).predictions.at(-1) ?? null;
}

export function resolvePrediction(
  predictionId: string,
  resolvedOutcome: PredictionOutcome,
): TournamentState {
  const state = readState();

  let pointsAwarded = 0;

  const predictions = state.predictions.map((prediction) => {
    if (prediction.id !== predictionId || prediction.resolvedOutcome) {
      return prediction;
    }

    const correct = prediction.outcome === resolvedOutcome;
    pointsAwarded = correct ? 3 : 0;

    return {
      ...prediction,
      resolvedOutcome,
      points: pointsAwarded,
    };
  });

  return writeState({
    ...state,
    predictions,
    points: state.points + pointsAwarded,
  });
}

export function getStagePredictionCount(
  stage: TournamentStageId,
): number {
  return readState().predictions.filter(
    (prediction) => prediction.stage === stage,
  ).length;
}

export function getStagePoints(stage: TournamentStageId): number {
  return readState().predictions
    .filter((prediction) => prediction.stage === stage)
    .reduce((total, prediction) => total + prediction.points, 0);
}

export function canAdvanceFromGroupStage(): boolean {
  const state = readState();

  if (state.currentStage !== 'group-stage') {
    return false;
  }

  const groupPredictions = state.predictions.filter(
    (prediction) => prediction.stage === 'group-stage',
  );

  if (groupPredictions.length < 5) {
    return false;
  }

  const points = groupPredictions.reduce(
    (total, prediction) => total + prediction.points,
    0,
  );

  return points >= 9;
}

export function advanceTournament(): TournamentState {
  const state = readState();

  if (
    state.currentStage === 'group-stage' &&
    canAdvanceFromGroupStage()
  ) {
    return writeState({
      ...state,
      currentStage: 'knockouts',
      qualified: true,
    });
  }

  if (state.currentStage === 'knockouts' && state.knockoutWon) {
    return writeState({
      ...state,
      currentStage: 'semi-finals',
    });
  }

  if (state.currentStage === 'semi-finals' && state.semiFinalWon) {
    return writeState({
      ...state,
      currentStage: 'the-final',
      finalWins: 0,
      finalLosses: 0,
      champion: false,
    });
  }

  return state;
}

export function resolveKnockoutBattle(won: boolean): TournamentState {
  const state = readState();

  if (state.currentStage !== 'knockouts') {
    return state;
  }

  if (!won) {
    return writeState({
      ...state,
      knockoutWon: false,
    });
  }

  return writeState({
    ...state,
    knockoutWon: true,
  });
}

export function resolveSemiFinalBattle(won: boolean): TournamentState {
  const state = readState();

  if (state.currentStage !== 'semi-finals') {
    return state;
  }

  if (!won) {
    return writeState({
      ...state,
      semiFinalWon: false,
    });
  }

  return writeState({
    ...state,
    semiFinalWon: true,
  });
}

export function recordFinalGame(won: boolean): TournamentState {
  const state = readState();

  if (state.currentStage !== 'the-final' || state.champion) {
    return state;
  }

  const finalWins = state.finalWins + (won ? 1 : 0);
  const finalLosses = state.finalLosses + (won ? 0 : 1);

  if (finalWins >= 3) {
    return writeState({
      ...state,
      finalWins,
      finalLosses,
      champion: true,
    });
  }

  if (finalLosses >= 3) {
    return writeState({
      ...state,
      finalWins,
      finalLosses,
      champion: false,
    });
  }

  return writeState({
    ...state,
    finalWins,
    finalLosses,
  });
}

export function canAdvanceTournament(): boolean {
  const state = readState();

  switch (state.currentStage) {
    case 'group-stage':
      return canAdvanceFromGroupStage();

    case 'knockouts':
      return state.knockoutWon;

    case 'semi-finals':
      return state.semiFinalWon;

    case 'the-final':
      return state.champion;

    default:
      return false;
  }
}

export function getTournamentStageLabel(
  stage: TournamentStageId,
): string {
  switch (stage) {
    case 'group-stage':
      return 'Group Stage';

    case 'knockouts':
      return 'Knockout Rounds';

    case 'semi-finals':
      return 'Semi-finals';

    case 'the-final':
      return 'The Final';

    default:
      return stage;
  }
}

export function isTournamentComplete(): boolean {
  return readState().champion;
}

export function runTournamentDemo(): TournamentState {
  const demoPredictions: TournamentPrediction[] = Array.from(
    { length: 5 },
    (_, index) => ({
      id: `demo-prediction-${Date.now()}-${index}`,
      marketId: `demo-market-${index + 1}`,
      marketSymbol: `DEMO-${index + 1}`,
      question: [
        'Will BTC finish above the target at expiry?',
        'Will ETH finish above the target at expiry?',
        'Will SOMI finish above the target at expiry?',
        'Will BTC hold above support at expiry?',
        'Will ETH break resistance at expiry?',
      ][index],
      outcome: 'yes',
      stage: 'group-stage',
      points: index < 4 ? 3 : 0,
      locked: true,
      createdAt: new Date().toISOString(),
      resolvedOutcome: index < 4 ? 'yes' : 'no',
    }),
  );

  return writeState({
    ...INITIAL_STATE,
    predictions: demoPredictions,
    points: 12,
  });
}
