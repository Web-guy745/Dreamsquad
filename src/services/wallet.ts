import { defineChain } from 'viem';

export const somnia = defineChain({
  id: 5031,
  name: 'Somnia',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.infra.mainnet.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network',
    },
  },
});

export const SOMNIA_CHAIN_ID = somnia.id;

const WALLET_STORAGE_KEY = 'dreamsquad:connected-wallet:v1';

interface EthereumProvider {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
}

function getEthereum(): EthereumProvider | undefined {
  return (
    window as Window & {
      ethereum?: EthereumProvider;
    }
  ).ethereum;
}

export function getConnectedWalletAddress(): string | null {
  try {
    const stored = window.localStorage.getItem(WALLET_STORAGE_KEY);
    return stored || null;
  } catch {
    return null;
  }
}

export function setConnectedWalletAddress(address: string | null): void {
  try {
    if (address) {
      window.localStorage.setItem(WALLET_STORAGE_KEY, address.toLowerCase());
    } else {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);
    }

    window.dispatchEvent(new Event('dreamsquad:wallet-changed'));
  } catch {
    // Keep the app usable if localStorage is unavailable.
  }
}

export async function connectWallet(): Promise<string> {
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new Error(
      'No compatible wallet detected. Open DreamSquad in MetaMask or another EVM wallet browser.',
    );
  }

  const accounts = (await ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];

  const address = accounts[0];

  if (!address) {
    throw new Error('No wallet account was returned.');
  }

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
    } else {
      throw switchError;
    }
  }

  setConnectedWalletAddress(address);

  return address;
}

export function clearConnectedWallet(): void {
  setConnectedWalletAddress(null);
}

export function getWalletIdentity(): string {
  return getConnectedWalletAddress() || 'guest';
}

export const WALLET_CHANGED_EVENT = 'dreamsquad:wallet-changed';

export function subscribeToWalletChanges(
  listener: () => void,
): () => void {
  window.addEventListener(WALLET_CHANGED_EVENT, listener);

  return () => {
    window.removeEventListener(WALLET_CHANGED_EVENT, listener);
  };
}
