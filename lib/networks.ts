export interface NetworkConfig {
  name: string
  chainId: number
  symbol: string
  color: string
  type: 'mainnet' | 'testnet'
  explorer: string
  faucet?: string
  rpcUrl: string
  safeService?: string
}

export const networks: Record<string, NetworkConfig> = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    symbol: 'ETH',
    color: 'blue',
    type: 'mainnet',
    explorer: 'https://etherscan.io',
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL!,
    safeService: 'https://safe-transaction-mainnet.safe.global'
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    symbol: 'MATIC',
    color: 'purple',
    type: 'mainnet',
    explorer: 'https://polygonscan.com',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL!,
    safeService: 'https://safe-transaction-polygon.safe.global'
  },
  bsc: {
    name: 'BSC',
    chainId: 56,
    symbol: 'BNB',
    color: 'yellow',
    type: 'mainnet',
    explorer: 'https://bscscan.com',
    rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL!,
    safeService: 'https://safe-transaction-bsc.safe.global'
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    symbol: 'ETH',
    color: 'blue',
    type: 'mainnet',
    explorer: 'https://arbiscan.io',
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL!,
    safeService: 'https://safe-transaction-arbitrum.safe.global'
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    symbol: 'ETH',
    color: 'green',
    type: 'testnet',
    explorer: 'https://sepolia.etherscan.io',
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
    faucet: 'https://sepoliafaucet.com',
    safeService: 'https://safe-transaction-sepolia.safe.global'
  },
  mumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    symbol: 'MATIC',
    color: 'purple',
    type: 'testnet',
    explorer: 'https://mumbai.polygonscan.com',
    rpcUrl: `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
    faucet: 'https://faucet.polygon.technology',
    safeService: 'https://safe-transaction-mumbai.safe.global'
  },
  bscTestnet: {
    name: 'BSC Testnet',
    chainId: 97,
    symbol: 'BNB',
    color: 'yellow',
    type: 'testnet',
    explorer: 'https://testnet.bscscan.com',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    faucet: 'https://testnet.bnbchain.org/faucet-smart'
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    symbol: 'ETH',
    color: 'blue',
    type: 'testnet',
    explorer: 'https://sepolia.arbiscan.io',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    faucet: 'https://bridge.arbitrum.io'
  }
}