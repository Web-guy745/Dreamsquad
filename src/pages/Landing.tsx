import { lazy, Suspense, useState } from 'react';
import DreamSquadLogo from '../components/DreamSquadLogo';
import CanvasErrorBoundary from '../components/CanvasErrorBoundary';
import { useWebGLSupport } from '../hooks/useWebGLSupport';
import { setConnectedWalletAddress } from '../services/wallet';
import './Landing.css';

const SOMNIA_CHAIN_ID = '0x13A7';

const HeroScene = lazy(() => import('../components/HeroScene'));

const BACKGROUND_WORDS = ['OPINION', 'MARKETS', 'PREDICT', 'TRADE', 'CRYPTO', 'DREAMSQUAD'];

function LandingSceneFallback(): JSX.Element {
  return (
    <div className="landing__scene-fallback" aria-hidden="true">
      <div className="landing__scene-fallback-glow" />
      <div className="landing__scene-fallback-trophy" />
    </div>
  );
}

interface LandingProps {
  onContinue: () => void;
}

function Landing({ onContinue }: LandingProps): JSX.Element {
  const webglSupported = useWebGLSupport();
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const handleConnectWallet = async (): Promise<void> => {
    setWalletError(null);

    const ethereum = (
      window as Window & {
        ethereum?: {
          request: (args: {
            method: string;
            params?: unknown[];
          }) => Promise<unknown>;
        };
      }
    ).ethereum;

    if (!ethereum) {
      setWalletError(
        'No compatible wallet detected. Open DreamSquad in MetaMask or another EVM wallet browser.'
      );
      return;
    }

    try {
      setConnecting(true);

      await ethereum.request({
        method: 'eth_requestAccounts',
      });

      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SOMNIA_CHAIN_ID }],
        });
      } catch (switchError) {
        const error = switchError as { code?: number };

        if (error.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SOMNIA_CHAIN_ID,
                chainName: 'Somnia',
                nativeCurrency: {
                  name: 'Somnia',
                  symbol: 'SOMI',
                  decimals: 18,
                },
                rpcUrls: ['https://api.infra.mainnet.somnia.network'],
                blockExplorerUrls: ['https://explorer.somnia.network'],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      const accounts = (await ethereum.request({
        method: 'eth_accounts',
      })) as string[];

      if (accounts[0]) {
        setConnectedWalletAddress(accounts[0]);
      }

      onContinue();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Wallet connection failed.';
      setWalletError(message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing__words" aria-hidden="true">
        {BACKGROUND_WORDS.map((word) => (
          <span key={word} className="landing__word">
            {word}
          </span>
        ))}
      </div>

      <div className="landing__scene">
        {webglSupported ? (
          <CanvasErrorBoundary fallback={<LandingSceneFallback />}>
            <Suspense fallback={<LandingSceneFallback />}>
              <HeroScene />
            </Suspense>
          </CanvasErrorBoundary>
        ) : (
          <LandingSceneFallback />
        )}
      </div>

      <div className="landing__content">
        <DreamSquadLogo size="lg" />
        <h1 className="landing__headline">TURN YOUR OPINION INTO A MARKET.</h1>
        <p className="landing__subheading">Create a prediction around a live DreamDEX Event Contract, take a side, and see where the community stands.</p>

        <div className="landing__actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleConnectWallet}
            disabled={connecting}
          >
            {connecting ? 'Connecting…' : 'Connect Wallet'}
          </button>

          <button
            type="button"
            className="landing__continue-walletless"
            onClick={onContinue}
          >
            Continue without wallet
          </button>

          {walletError && (
            <p className="landing__wallet-error" role="alert">
              {walletError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Landing;
