import {
  SomniaMarkets,
  SOMNIA_MAINNET_ADDRESSES,
} from '@somnia-chain/markets-sdk';
import { somniaMainnet } from '@somnia-chain/markets-sdk/chains';

const INDEXER_URL = 'https://prd.smk.somnia.host/v1/graphql';
const WS_RPC_URL = 'wss://api.infra.mainnet.somnia.network/ws';

let client: SomniaMarkets | null = null;

export function getSomniaMarketsClient(): SomniaMarkets {
  if (!client) {
    client = new SomniaMarkets({
      indexerUrl: INDEXER_URL,
      chain: somniaMainnet,
      wsRpcUrl: WS_RPC_URL,
      addresses: SOMNIA_MAINNET_ADDRESSES,
    });
  }

  return client;
}
