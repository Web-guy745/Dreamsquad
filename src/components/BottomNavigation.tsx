import { LineChart, Radio, Search, Users, Vote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './BottomNavigation.css';

export type AppTab = 'predict' | 'live' | 'opinions' | 'search' | 'social';

interface TabItem {
  id: AppTab;
  label: string;
  icon: LucideIcon;
}

// NOTE: "LineChart" is used as the compatible market/chart icon for the
// Predict tab (equivalent intent to ChartNoAxesCombined).
const TABS: TabItem[] = [
  { id: 'predict', label: 'Predict', icon: LineChart },
  { id: 'live', label: 'Live', icon: Radio },
  { id: 'opinions', label: 'Opinions', icon: Vote },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'social', label: 'Social', icon: Users },
];

interface BottomNavigationProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

function BottomNavigation({ activeTab, onChange }: BottomNavigationProps): JSX.Element {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => onChange(id)}
            aria-label={label}
            aria-current={isActive ? 'true' : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
            <span className="bottom-nav__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavigation;
