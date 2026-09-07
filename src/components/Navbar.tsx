import { User } from 'lucide-react';
import DreamSquadLogo from './DreamSquadLogo';
import './Navbar.css';

interface NavbarProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onSignUp: () => void;
  onProfileClick: () => void;
}

function Navbar({ isAuthenticated, onLogin, onSignUp, onProfileClick }: NavbarProps): JSX.Element {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <DreamSquadLogo size="sm" />

        {isAuthenticated ? (
          <button type="button" className="navbar__profile" onClick={onProfileClick} aria-label="Profile">
            <User size={18} strokeWidth={2.2} />
          </button>
        ) : (
          <div className="navbar__auth">
            <button type="button" className="navbar__login" onClick={onLogin}>
              Log in
            </button>
            <button type="button" className="btn btn--primary navbar__signup" onClick={onSignUp}>
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
