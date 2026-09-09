import { useState } from 'react';
import Navbar from './components/Navbar';
import BottomNavigation, { type AppTab } from './components/BottomNavigation';
import AmbientBackground from './components/AmbientBackground';
import ToastHost from './components/ToastHost';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Live from './pages/Live';
import Search from './pages/Search';
import Profile from './pages/Profile';
import MarketDetail from './pages/MarketDetail';
import Tournament from './pages/Tournament';
import OpinionMarkets from './pages/OpinionMarkets';
import OpinionMarketDetail from './pages/OpinionMarketDetail';
import CreateOpinionMarket from './pages/CreateOpinionMarket';
import CreatorProfile from './pages/CreatorProfile';
import './App.css';

function App(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTab>('opinions');
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [selectedOpinionMarketId, setSelectedOpinionMarketId] = useState<string | null>(null);
  const [selectedCreatorAddress, setSelectedCreatorAddress] = useState<string | null>(null);
  const [showTournament, setShowTournament] = useState<boolean>(false);
  const [showCreateOpinion, setShowCreateOpinion] = useState<boolean>(false);
  const [opinionMarketsRefreshKey, setOpinionMarketsRefreshKey] = useState(0);

  const handleTabChange = (tab: AppTab): void => {
    setActiveTab(tab);
    setSelectedMarketId(null);
    setSelectedOpinionMarketId(null);
    setSelectedCreatorAddress(null);
    setShowTournament(false);
    setShowCreateOpinion(false);
  };

  const handleSelectMarket = (id: string): void => setSelectedMarketId(id);
  const handleCloseMarket = (): void => setSelectedMarketId(null);
  const handleOpenOpinionDetail = (id: string): void => setSelectedOpinionMarketId(id);
  const handleCloseOpinionDetail = (): void => {
    setSelectedOpinionMarketId(null);
    setOpinionMarketsRefreshKey((key) => key + 1);
  };
  const handleOpenCreator = (address: string): void => setSelectedCreatorAddress(address);
  const handleCloseCreator = (): void => setSelectedCreatorAddress(null);
  const handleOpenTournament = (): void => setShowTournament(true);
  const handleCloseTournament = (): void => setShowTournament(false);
  const handleOpenCreateOpinion = (): void => setShowCreateOpinion(true);
  const handleCloseCreateOpinion = (): void => {
    setShowCreateOpinion(false);
    setOpinionMarketsRefreshKey((key) => key + 1);
  };
  const handleOpinionMarketCreated = (): void => {
    setOpinionMarketsRefreshKey((key) => key + 1);
  };
  const handleViewCreatedMarket = (marketId: string): void => {
    setShowCreateOpinion(false);
    setSelectedOpinionMarketId(marketId);
  };
  const handleProfileClick = (): void => handleTabChange('social');

  if (!isAuthenticated) {
    return (
      <div className="app">
        <AmbientBackground />
        <ToastHost />
        <Landing onContinue={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  let content: JSX.Element;
  if (selectedCreatorAddress) {
    content = <CreatorProfile address={selectedCreatorAddress} onBack={handleCloseCreator} />;
  } else if (selectedMarketId) {
    content = <MarketDetail marketId={selectedMarketId} onBack={handleCloseMarket} />;
  } else if (selectedOpinionMarketId) {
    content = (
      <OpinionMarketDetail
        marketId={selectedOpinionMarketId}
        onBack={handleCloseOpinionDetail}
        onOpenCreator={handleOpenCreator}
      />
    );
  } else if (showTournament) {
    content = <Tournament onBack={handleCloseTournament} />;
  } else if (showCreateOpinion) {
    content = (
      <CreateOpinionMarket
        onBack={handleCloseCreateOpinion}
        onCreated={handleOpinionMarketCreated}
        onViewMarket={handleViewCreatedMarket}
      />
    );
  } else {
    switch (activeTab) {
      case 'live':
        content = <Live onSelectMarket={handleSelectMarket} />;
        break;
      case 'opinions':
        content = (
          <OpinionMarkets
            onCreate={handleOpenCreateOpinion}
            onOpenDetail={handleOpenOpinionDetail}
            onOpenCreator={handleOpenCreator}
            refreshKey={opinionMarketsRefreshKey}
          />
        );
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
      <ToastHost />
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
