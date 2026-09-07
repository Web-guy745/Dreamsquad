import type { LucideIcon } from 'lucide-react';

export type TournamentStageId =
  | 'group-stage'
  | 'knockouts'
  | 'semi-finals'
  | 'the-final';

export type PredictionOutcome = 'yes' | 'no';

export interface TournamentStage {
  id: TournamentStageId;
  index: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface TournamentPrediction {
  id: string;
  marketId: string;
  marketSymbol?: string;
  question: string;
  outcome: PredictionOutcome;
  stage: TournamentStageId;
  points: number;
  locked: boolean;
  createdAt: string;
  resolvedOutcome?: PredictionOutcome | null;
}

export interface TournamentState {
  predictions: TournamentPrediction[];
  points: number;
  currentStage: TournamentStageId;
  qualified: boolean;
  knockoutWon: boolean;
  semiFinalWon: boolean;
  finalWins: number;
  finalLosses: number;
  champion: boolean;
}
