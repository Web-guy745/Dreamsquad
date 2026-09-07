import { Sparkle } from 'lucide-react';
import './DreamSquadLogo.css';

interface DreamSquadLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

function DreamSquadLogo({ size = 'md', showWordmark = true }: DreamSquadLogoProps): JSX.Element {
  return (
    <span className={`ds-logo ds-logo--${size}`}>
      <span className="ds-logo__mark">
        <Sparkle size={size === 'lg' ? 22 : size === 'sm' ? 14 : 17} strokeWidth={2.5} />
      </span>
      {showWordmark && <span className="ds-logo__wordmark">DreamSquad</span>}
    </span>
  );
}

export default DreamSquadLogo;
