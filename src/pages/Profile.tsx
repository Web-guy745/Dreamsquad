import { useEffect, useState } from 'react';
import { User, Target, Percent, Flame, Zap, Award, Wallet, LayoutGrid } from 'lucide-react';
import { getUserReputation, getUserCreatedMarkets } from '../services/opinionMarkets';
import {
  getConnectedWalletAddress,
  subscribeToWalletChanges,
} from '../services/wallet';
import { calculateAccuracy, calculateRank } from '../utils/xp';
import EmptyState from '../components/EmptyState';
import './Profile.css';

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const RESULT_LABEL: Record<'pending' | 'correct' | 'incorrect', string> = {
  pending: 'Pending',
  correct: 'Correct',
  incorrect: 'Incorrect',
};

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function Profile(): JSX.Element {
  const [walletAddress, setWalletAddress] = useState<string | null>(
    getConnectedWalletAddress(),
  );
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const ethereum = (
      window as Window & {
        ethereum?: {
          request: (args: {
            method: string;
            params?: unknown[];
          }) => Promise<unknown>;
          on?: (event: string, handler: (accounts: string[]) => void) => void;
          removeListener?: (
            event: string,
            handler: (accounts: string[]) => void,
          ) => void;
        };
      }
    ).ethereum;

    if (!ethereum) return;

    const checkWallet = async (): Promise<void> => {
      try {
        const accounts = (await ethereum.request({
          method: 'eth_accounts',
        })) as string[];

        setWalletAddress(accounts[0] || null);
      } catch {
        setWalletAddress(null);
      }
    };

    const handleAccountsChanged = (accounts: string[]): void => {
      setWalletAddress(accounts[0] || null);
    };

    void checkWallet();
    ethereum.on?.('accountsChanged', handleAccountsChanged);

    const pollWallet = async (): Promise<void> => {
      try {
        const accounts = (await ethereum.request({
          method: 'eth_accounts',
        })) as string[];

        const address = accounts[0] || null;

        if (address !== walletAddress) {
          setWalletAddress(address);

          if (address) {
            const storedAddress = getConnectedWalletAddress();

            if (storedAddress !== address.toLowerCase()) {
              const wallet = address.toLowerCase();
              window.localStorage.setItem(
                'dreamsquad:connected-wallet:v1',
                wallet,
              );
              window.dispatchEvent(new Event('dreamsquad:wallet-changed'));
            }
          }
        }
      } catch {
        // Ignore temporary wallet provider errors.
      }
    };

    const intervalId = window.setInterval(() => {
      void pollWallet();
    }, 1000);

    const unsubscribe = subscribeToWalletChanges(() => {
      setWalletAddress(getConnectedWalletAddress());
    });

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  const handleConnectWallet = async (): Promise<void> => {
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
      window.alert(
        'No compatible wallet detected. Open DreamSquad in MetaMask or another EVM wallet browser.',
      );
      return;
    }

    try {
      setConnecting(true);

      const accounts = (await ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      setWalletAddress(accounts[0] || null);

      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13A7' }],
        });
      } catch (switchError) {
        const error = switchError as { code?: number };

        if (error.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13A7',
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
        }
      }
    } catch {
      setWalletAddress(null);
    } finally {
      setConnecting(false);
    }
  };

  const reputation = getUserReputation();
  const accuracy = calculateAccuracy(reputation.correct, reputation.predictions);
  const rank = calculateRank(reputation.xp);
  const marketsCreated = getUserCreatedMarkets().length;

  return (
    <div className="page profile-page">
      <div className="profile-page__avatar-wrap">
        <span className="profile-page__avatar">
          <User size={28} strokeWidth={2} />
        </span>
        <h1 className="profile-page__name">Your DreamSquad Profile</h1>
        <p className="profile-page__subtitle">
          <Award size={12} strokeWidth={2.4} /> {rank} · {reputation.xp.toLocaleString()} XP
        </p>
      </div>

      <div className="surface-card profile-page__wallet-card">
        <div className="profile-page__wallet-icon">
          <Wallet size={18} strokeWidth={2.2} />
        </div>
        <div className="profile-page__wallet-copy">
          <span className="profile-page__wallet-label">Wallet</span>
          {walletAddress ? (
            <>
              <strong>{shortenAddress(walletAddress)}</strong>
              <span className="profile-page__wallet-status">Connected on Somnia</span>
            </>
          ) : (
            <span className="profile-page__wallet-status">
              Connect a wallet to use onchain features.
            </span>
          )}
        </div>
        <button
          type="button"
          className="profile-page__wallet-button"
          onClick={handleConnectWallet}
          disabled={connecting}
        >
          {connecting
            ? 'Connecting…'
            : walletAddress
              ? 'Change'
              : 'Connect'}
        </button>
      </div>

      <div className="profile-page__stats">
        <div className="surface-card profile-page__stat">
          <span className="profile-page__stat-icon">
            <Target size={16} strokeWidth={2.2} />
          </span>
          <span className="profile-page__stat-value">{reputation.predictions}</span>
          <span className="profile-page__stat-label">Predictions</span>
        </div>
        <div className="surface-card profile-page__stat">
          <span className="profile-page__stat-icon">
            <Percent size={16} strokeWidth={2.2} />
          </span>
          <span className="profile-page__stat-value">{reputation.predictions > 0 ? `${accuracy}%` : '—'}</span>
          <span className="profile-page__stat-label">Accuracy</span>
        </div>
        <div className="surface-card profile-page__stat">
          <span className="profile-page__stat-icon">
            <Flame size={16} strokeWidth={2.2} />
          </span>
          <span className="profile-page__stat-value">{reputation.currentStreak}</span>
          <span className="profile-page__stat-label">Streak</span>
        </div>
      </div>

      <div className="profile-page__stats profile-page__stats--secondary">
        <div className="surface-card profile-page__stat">
          <span className="profile-page__stat-value">{reputation.correct}</span>
          <span className="profile-page__stat-label">Correct</span>
        </div>
        <div className="surface-card profile-page__stat">
          <span className="profile-page__stat-value">{reputation.bestStreak}</span>
          <span className="profile-page__stat-label">Best Streak</span>
        </div>
        <div className="surface-card profile-page__stat">
          <span className="profile-page__stat-value">{reputation.xp.toLocaleString()}</span>
          <span className="profile-page__stat-label">Total XP</span>
        </div>
        <div className="surface-card profile-page__stat">
          <span className="profile-page__stat-icon">
            <LayoutGrid size={16} strokeWidth={2.2} />
          </span>
          <span className="profile-page__stat-value">{marketsCreated}</span>
          <span className="profile-page__stat-label">Markets Created</span>
        </div>
      </div>

      <div className="page__section">
        <h2 className="page__section-title">Prediction History</h2>
        {reputation.history.length === 0 ? (
          <EmptyState message="Your Opinion Market predictions will show up here." />
        ) : (
          <div className="profile-page__history">
            {reputation.history.map((entry, i) => (
              <div key={`${entry.marketId}-${i}`} className="surface-card profile-page__history-row">
                <div className="profile-page__history-main">
                  <span className="profile-page__history-asset">{entry.asset}</span>
                  <p className="profile-page__history-question">{entry.question}</p>
                  <span className="profile-page__history-date">{formatTimestamp(entry.timestamp)}</span>
                </div>
                <div className="profile-page__history-side">
                  <span className={`profile-page__history-result profile-page__history-result--${entry.result}`}>
                    {RESULT_LABEL[entry.result]}
                  </span>
                  <span className="profile-page__history-xp">
                    <Zap size={11} strokeWidth={2.4} />+{entry.xpEarned} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
