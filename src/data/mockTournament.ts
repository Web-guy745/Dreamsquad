import { Users, Swords, Trophy, Crown } from 'lucide-react';
import type { TournamentStage } from '../types/tournament';

export const TOURNAMENT_STAGES: TournamentStage[] = [
  {
    id: 'group-stage',
    index: '01',
    title: 'Group Stage',
    description: 'Discover markets and build your strategy.',
    icon: Users,
  },
  {
    id: 'knockouts',
    index: '02',
    title: 'Knockouts',
    description: 'Higher stakes. Stronger competition.',
    icon: Swords,
  },
  {
    id: 'semi-finals',
    index: '03',
    title: 'Semi-Finals',
    description: 'Only the strongest predictions survive.',
    icon: Trophy,
  },
  {
    id: 'the-final',
    index: '04',
    title: 'The Final',
    description: 'Compete for the DreamSquad championship.',
    icon: Crown,
  },
];
