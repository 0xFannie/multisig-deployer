import { http, createConfig } from 'wagmi'
import { arbitrum, mainnet, polygon, bsc, sepolia, localhost } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const chains = [localhost, mainnet, polygon, bsc, arbitrum, sepolia] as const

export const wagmiConfig = createConfig({
  chains: [localhost, mainnet, polygon, bsc, arbitrum, sepolia],
  connectors: [injected()],
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
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
