import { ArrowLeft } from 'lucide-react';
import DreamSquadLogo from './DreamSquadLogo';
import './ScreenHeader.css';

interface ScreenHeaderProps {
  onBack: () => void;
}

function ScreenHeader({ onBack }: ScreenHeaderProps): JSX.Element {
  return (
    <div className="screen-header">
      <button type="button" className="screen-header__back" onClick={onBack} aria-label="Back">
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>
      <DreamSquadLogo size="sm" showWordmark={false} />
    </div>
  );
}

export default ScreenHeader;
