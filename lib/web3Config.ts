import { http, createConfig } from 'wagmi'
import { 
  mainnet, 
  polygon, 
  bsc, 
  arbitrum, 
  optimism, 
  avalanche, 
  fantom, 
  base, 
  linea,
  zkSync,
  scroll,
  polygonZkEvm,
  sepolia,
  goerli
} from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  phantomWallet,
  okxWallet,
  backpackWallet,
  bitgetWallet,
  gateWallet,
  imTokenWallet,
  krakenWallet,
  ledgerWallet,
  oneKeyWallet,
  rabbyWallet,
  tokenPocketWallet,
  uniswapWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'

// 支持的主流区块链网络
export const chains = [
  mainnet,
  polygon,
  bsc,
  arbitrum,
  optimism,
  avalanche,
  fantom,
  base,
  linea,
  zkSync,
  scroll,
  polygonZkEvm,
  sepolia,
  goerli
] as const

// WalletConnect Project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4e80782ec5f114d7d96d3b1b60c6493'

const supportedChains = [
  mainnet,
  polygon,
  bsc,
  arbitrum,
  optimism,
  avalanche,
  fantom,
  base,
  linea,
  zkSync,
  scroll,
  polygonZkEvm,
  sepolia,
  goerli
] as const

// 创建自定义钱包连接器
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        phantomWallet,
        okxWallet,
        uniswapWallet,
      ],
    },
    {
      groupName: 'More Wallets',
      wallets: [
        backpackWallet,
        bitgetWallet,
        gateWallet,
        imTokenWallet,
        krakenWallet,
        ledgerWallet,
        oneKeyWallet,
        rabbyWallet,
        tokenPocketWallet,
        injectedWallet, // 注入钱包回退选项
      ],
    },
  ],
  {
    appName: 'MultiSig Wallet Deployer',
    projectId: projectId,
  }
)

// 创建 wagmi 配置
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [avalanche.id]: http(),
    [fantom.id]: http(),
    [base.id]: http(),
    [linea.id]: http(),
    [zkSync.id]: http(),
    [scroll.id]: http(),
    [polygonZkEvm.id]: http(),
    [sepolia.id]: http(),
    [goerli.id]: http(),
  },
  ssr: true,
})

// 旧配置已移除，现在使用自定义钱包列表配置

export function initWeb3Modal() {
  // RainbowKit 会自动处理钱包连接
  return null
}
