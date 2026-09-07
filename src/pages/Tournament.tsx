import { useState } from 'react';
import { CheckCircle2, ChevronRight, Lock, Trophy } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import TournamentProgress from '../components/TournamentProgress';
import { TOURNAMENT_STAGES } from '../data/mockTournament';
import {
  advanceTournament,
  canAdvanceTournament,
  recordFinalGame,
  resolveKnockoutBattle,
  resolveSemiFinalBattle,
  getTournamentStageLabel,
  getTournamentState,
  resetTournament,
  runTournamentDemo,
} from '../services/tournament';
import type { TournamentState } from '../types/tournament';
import './Tournament.css';

interface TournamentProps {
  onBack: () => void;
}

function Tournament({ onBack }: TournamentProps): JSX.Element {
  const [state, setState] = useState<TournamentState>(() =>
    getTournamentState(),
  );

  const handleReset = (): void => {
    setState(resetTournament());
  };

  const handleRunDemo = (): void => {
    setState(runTournamentDemo());
  };

  const handleAdvance = (): void => {
    setState(advanceTournament());
  };

  const handleKnockoutResult = (won: boolean): void => {
    setState(resolveKnockoutBattle(won));
  };

  const handleSemiFinalResult = (won: boolean): void => {
    setState(resolveSemiFinalBattle(won));
  };

  const handleFinalGame = (won: boolean): void => {
    setState(recordFinalGame(won));
  };

  const groupPredictions = state.predictions.filter(
    (prediction) => prediction.stage === 'group-stage',
  );

  const currentStageLabel = getTournamentStageLabel(state.currentStage);
  const canAdvance = canAdvanceTournament();

  const stageMessage =
    state.currentStage === 'group-stage'
      ? 'Lock 5 Event Contract predictions and reach 9 points to qualify.'
      : state.currentStage === 'knockouts'
        ? 'You qualified. Win the knockout round to reach the semi-finals.'
        : state.currentStage === 'semi-finals'
          ? 'One more battle stands between you and the final.'
          : 'You made it to the final. Best-of-five decides the champion.';

  return (
    <div className="page tournament-page">
      <ScreenHeader onBack={onBack} />

      <div className="page__header">
        <p className="page__eyebrow">DreamSquad Tournament</p>
        <h1 className="page__heading">Four stages between you and the final.</h1>
        <p className="page__subheading">
          Predict smarter. Advance further. Reach the final.
        </p>
      </div>

      <TournamentProgress stages={TOURNAMENT_STAGES} currentStage={state.currentStage} />

      <div className="page__section">
        <div className="surface-card tournament-page__demo-card">
          <div className="tournament-page__demo-copy">
            <span className="tournament-page__score-label">
              Judge Mode · Instant Simulation
            </span>

            <strong>
              {state.champion
                ? 'DreamSquad Champion'
                : state.currentStage === 'group-stage'
                  ? 'Start the tournament'
                  : `Now playing · ${currentStageLabel}`}
            </strong>

            <p>
              {state.champion
                ? 'The full tournament journey is complete.'
                : state.currentStage === 'group-stage'
                  ? 'Run a complete tournament simulation without waiting for real Event Contract resolution.'
                  : stageMessage}
            </p>
          </div>

          {!state.champion && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleRunDemo}
            >
              {state.currentStage === 'group-stage'
                ? 'Play Tournament Demo'
                : 'Restart Demo'}
            </button>
          )}
        </div>
      </div>

      <div className="page__section tournament-page__scoreboard">
        <div className="surface-card tournament-page__score-card">
          <span className="tournament-page__score-label">Current Stage</span>
          <strong>{currentStageLabel}</strong>
        </div>

        <div className="surface-card tournament-page__score-card">
          <span className="tournament-page__score-label">Points</span>
          <strong>{state.points}</strong>
        </div>

        <div className="surface-card tournament-page__score-card">
          <span className="tournament-page__score-label">Locked Picks</span>
          <strong>{groupPredictions.length}</strong>
        </div>
      </div>

      <div className="page__section">
        <div className="surface-card tournament-page__status-card">
          <div className="tournament-page__status-icon">
            {state.qualified ? <Trophy size={22} /> : <Lock size={22} />}
          </div>

          <div className="tournament-page__status-copy">
            <span className="tournament-page__score-label">
              {state.qualified ? 'Qualification secured' : 'Tournament status'}
            </span>
            <strong>{currentStageLabel}</strong>
            <p>{stageMessage}</p>
          </div>
        </div>
      </div>

      <div className="page__section">
        <div className="tournament-page__section-header">
          <div>
            <h2 className="page__section-title">Your Group Stage</h2>
            <p className="page__subheading">
              Lock predictions from live DreamDEX Event Contracts.
            </p>
          </div>
        </div>

        {groupPredictions.length === 0 ? (
          <div className="surface-card tournament-page__empty">
            <Trophy size={24} />
            <strong>No fixtures locked yet</strong>
            <p>
              Open a live Event Contract and choose YES or NO to add your first
              fixture.
            </p>
          </div>
        ) : (
          <div className="tournament-page__predictions">
            {groupPredictions.map((prediction) => (
              <div
                key={prediction.id}
                className="surface-card tournament-page__prediction"
              >
                <div className="tournament-page__prediction-top">
                  <span className="tournament-page__prediction-stage">
                    GROUP FIXTURE
                  </span>

                  {prediction.locked && (
                    <span className="tournament-page__locked">
                      <Lock size={13} />
                      LOCKED
                    </span>
                  )}
                </div>

                <p className="tournament-page__question">
                  {prediction.question}
                </p>

                <div className="tournament-page__prediction-bottom">
                  <span
                    className={`tournament-page__pick tournament-page__pick--${prediction.outcome}`}
                  >
                    {prediction.outcome.toUpperCase()}
                  </span>

                  {prediction.resolvedOutcome ? (
                    <span className="tournament-page__result">
                      {prediction.outcome === prediction.resolvedOutcome ? (
                        <>
                          <CheckCircle2 size={14} />+{prediction.points} pts
                        </>
                      ) : (
                        '0 pts'
                      )}
                    </span>
                  ) : (
                    <span className="tournament-page__pending">
                      Awaiting resolution
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {state.currentStage === 'knockouts' && (
        <div className="page__section">
          <div className="surface-card tournament-page__battle-card">
            <span className="tournament-page__score-label">
              Demo Battle · Knockouts
            </span>

            <h2>DreamSquad vs Rival</h2>

            <p>
              Your Group Stage performance earned a knockout match.
              Choose the result to simulate the battle.
            </p>

            {state.knockoutWon ? (
              <div className="tournament-page__battle-result">
                <CheckCircle2 size={18} />
                Knockout won. You can advance to the Semi-finals.
              </div>
            ) : (
              <div className="tournament-page__battle-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => handleKnockoutResult(true)}
                >
                  Win Battle
                </button>

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => handleKnockoutResult(false)}
                >
                  Lose Battle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.currentStage === 'semi-finals' && (
        <div className="page__section">
          <div className="surface-card tournament-page__battle-card">
            <span className="tournament-page__score-label">
              Demo Battle · Semi-finals
            </span>

            <h2>DreamSquad vs Rival</h2>

            <p>
              One battle separates you from the DreamSquad Final.
            </p>

            {state.semiFinalWon ? (
              <div className="tournament-page__battle-result">
                <CheckCircle2 size={18} />
                Semi-final won. You can advance to The Final.
              </div>
            ) : (
              <div className="tournament-page__battle-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => handleSemiFinalResult(true)}
                >
                  Win Battle
                </button>

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => handleSemiFinalResult(false)}
                >
                  Lose Battle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.currentStage === 'the-final' && (
        <div className="page__section">
          <div className="surface-card tournament-page__battle-card">
            <span className="tournament-page__score-label">
              Best-of-5 · The Final
            </span>

            <h2>
              {state.champion
                ? 'DreamSquad Champion'
                : 'DreamSquad vs Rival'}
            </h2>

            <p>
              First to 3 wins becomes the DreamSquad champion.
            </p>

            <div className="tournament-page__final-score">
              <strong>{state.finalWins}</strong>
              <span>—</span>
              <strong>{state.finalLosses}</strong>
            </div>

            {state.champion ? (
              <div className="tournament-page__battle-result">
                <Trophy size={18} />
                Champion crowned. You won the best-of-five Final.
              </div>
            ) : state.finalLosses >= 3 ? (
              <div className="tournament-page__battle-result">
                Final lost. Reset the demo to play again.
              </div>
            ) : (
              <div className="tournament-page__battle-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => handleFinalGame(true)}
                >
                  Win Game
                </button>

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => handleFinalGame(false)}
                >
                  Lose Game
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page__section tournament-page__advance">
        <div className="surface-card tournament-page__advance-card">
          <div>
            <span className="tournament-page__score-label">
              {state.currentStage === 'the-final'
                ? 'Championship'
                : 'Next round'}
            </span>
            <strong>
              {state.currentStage === 'group-stage'
                ? 'Qualify for Knockouts'
                : state.currentStage === 'knockouts'
                  ? 'Advance to Semi-finals'
                  : state.currentStage === 'semi-finals'
                    ? 'Reach The Final'
                    : 'Final reached'}
            </strong>
          </div>

          {state.currentStage !== 'the-final' && (
            <button
              type="button"
              className="btn btn--primary tournament-page__advance-button"
              onClick={handleAdvance}
              disabled={!canAdvance}
            >
              Advance
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="tournament-page__actions">
        <button
          type="button"
          className="btn btn--secondary btn--block"
          onClick={handleReset}
          disabled={state.predictions.length === 0}
        >
          Reset Tournament Demo
        </button>
      </div>
    </div>
  );
}

export default Tournament;
