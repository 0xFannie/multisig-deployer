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
import { injected } from 'wagmi/connectors'

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

export const wagmiConfig = createConfig({
  chains: [
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
  ],
  connectors: [injected()],
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
})

export function initWeb3Modal() {
  // 简化配置，仅使用 wagmi
  // 如需 WalletConnect 支持，请安装并配置 @web3modal/wagmi
  return null
}
