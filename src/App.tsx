import { useState } from 'react';
import Navbar from './components/Navbar';
import BottomNavigation, { type AppTab } from './components/BottomNavigation';
import AmbientBackground from './components/AmbientBackground';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Live from './pages/Live';
import Search from './pages/Search';
import Profile from './pages/Profile';
import MarketDetail from './pages/MarketDetail';
import Tournament from './pages/Tournament';
import OpinionMarkets from './pages/OpinionMarkets';
import CreateOpinionMarket from './pages/CreateOpinionMarket';
import './App.css';

function App(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTab>('opinions');
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [showTournament, setShowTournament] = useState<boolean>(false);
  const [showCreateOpinion, setShowCreateOpinion] = useState<boolean>(false);
  const [opinionMarketsRefreshKey, setOpinionMarketsRefreshKey] = useState(0);

  const handleTabChange = (tab: AppTab): void => {
    setActiveTab(tab);
    setSelectedMarketId(null);
    setShowTournament(false);
    setShowCreateOpinion(false);
  };

  const handleSelectMarket = (id: string): void => setSelectedMarketId(id);
  const handleCloseMarket = (): void => setSelectedMarketId(null);
  const handleOpenTournament = (): void => setShowTournament(true);
  const handleCloseTournament = (): void => setShowTournament(false);
  const handleOpenCreateOpinion = (): void => setShowCreateOpinion(true);
  const handleCloseCreateOpinion = (): void => setShowCreateOpinion(false);
  const handleOpinionMarketCreated = (): void => {
    setShowCreateOpinion(false);
    setOpinionMarketsRefreshKey((key) => key + 1);
  };
  const handleProfileClick = (): void => handleTabChange('social');

  if (!isAuthenticated) {
    return (
      <div className="app">
        <AmbientBackground />
        <Landing onContinue={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  let content: JSX.Element;
  if (selectedMarketId) {
    content = <MarketDetail marketId={selectedMarketId} onBack={handleCloseMarket} />;
  } else if (showTournament) {
    content = <Tournament onBack={handleCloseTournament} />;
  } else if (showCreateOpinion) {
    content = <CreateOpinionMarket onBack={handleCloseCreateOpinion} onCreated={handleOpinionMarketCreated} />;
  } else {
    switch (activeTab) {
      case 'live':
        content = <Live onSelectMarket={handleSelectMarket} />;
        break;
      case 'opinions':
        content = <OpinionMarkets onCreate={handleOpenCreateOpinion} refreshKey={opinionMarketsRefreshKey} />;
        break;
      case 'search':
        content = <Search onSelectMarket={handleSelectMarket} />;
        break;
      case 'social':
        content = <Profile />;
        break;
      case 'predict':
      default:
        content = <Home onSelectMarket={handleSelectMarket} onOpenTournament={handleOpenTournament} />;
        break;
    }
  }

  return (
    <div className="app">
      <AmbientBackground />
      <div className="app__shell">
        <Navbar
          isAuthenticated
          onLogin={() => setIsAuthenticated(false)}
          onSignUp={() => setIsAuthenticated(false)}
          onProfileClick={handleProfileClick}
        />

        <main className="app__main">{content}</main>

        <BottomNavigation activeTab={activeTab} onChange={handleTabChange} />
      </div>
    </div>
  );
}

export default App;
