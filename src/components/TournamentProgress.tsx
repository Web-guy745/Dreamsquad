import type { TournamentStage, TournamentStageId } from '../types/tournament';
import './TournamentProgress.css';

interface TournamentProgressProps {
  stages: TournamentStage[];
  currentStage?: TournamentStageId;
}

function TournamentProgress({
  stages,
  currentStage = 'group-stage',
}: TournamentProgressProps): JSX.Element {
  const currentIndex = stages.findIndex(
    (stage) => stage.id === currentStage,
  );

  return (
    <ol className="tournament-progress">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        const isComplete = i < currentIndex;
        const isCurrent = stage.id === currentStage;

        const stateClass = isComplete
          ? 'is-complete'
          : isCurrent
            ? 'is-current'
            : 'is-upcoming';

        return (
          <li
            key={stage.id}
            className={`tournament-progress__item ${stateClass}`}
          >
            <div className="tournament-progress__rail">
              <span className="tournament-progress__badge">
                <Icon size={18} strokeWidth={2.2} />
              </span>

              {i < stages.length - 1 && (
                <span
                  className={`tournament-progress__line ${
                    i < currentIndex ? 'is-complete' : ''
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="surface-card tournament-progress__card">
              <span className="tournament-progress__index">
                {stage.index}
              </span>

              <h3 className="tournament-progress__title">
                {stage.title}
              </h3>

              <p className="tournament-progress__description">
                {stage.description}
              </p>

              <span className="tournament-progress__state">
                {isComplete
                  ? 'Completed'
                  : isCurrent
                    ? 'Current Stage'
                    : 'Locked'}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default TournamentProgress;
