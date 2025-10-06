import { http, createConfig } from 'wagmi'
import { arbitrum, mainnet, polygon, bsc, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// 移除 localhost，优先使用真实网络
export const chains = [mainnet, polygon, bsc, arbitrum, sepolia] as const

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, bsc, arbitrum, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [sepolia.id]: http(),
  },
})

export function initWeb3Modal() {
  // 简化配置，仅使用 wagmi
  // 如需 WalletConnect 支持，请安装并配置 @web3modal/wagmi
  return null
}
