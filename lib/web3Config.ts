import { http, createConfig, Config } from 'wagmi'
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

// 延迟加载 RainbowKit，避免服务器端模块兼容性问题
let wagmiConfigInstance: Config | null = null

async function createWagmiConfig(): Promise<Config> {
  if (wagmiConfigInstance) {
    return wagmiConfigInstance
  }

  // 只在客户端加载 RainbowKit
  if (typeof window === 'undefined') {
    // 服务器端：创建最小配置，不使用 RainbowKit
    wagmiConfigInstance = createConfig({
      chains: supportedChains,
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
  } else {
    // 客户端：动态导入 RainbowKit
    const { connectorsForWallets } = await import('@rainbow-me/rainbowkit')
    const {
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
    } = await import('@rainbow-me/rainbowkit/wallets')

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
            injectedWallet,
          ],
        },
      ],
      {
        appName: 'MultiSig Wallet Deployer',
        projectId: projectId,
      }
    )

    wagmiConfigInstance = createConfig({
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
  }

  return wagmiConfigInstance
}

// 导出函数来获取配置（延迟加载）
export async function getWagmiConfig(): Promise<Config> {
  return createWagmiConfig()
}

// 为了向后兼容，提供一个同步访问器（仅在客户端可用）
export const wagmiConfig = typeof window !== 'undefined' 
  ? (() => {
      // 在客户端，立即开始加载配置
      createWagmiConfig().catch(console.error)
      // 返回一个临时配置，实际配置会在加载完成后替换
      return createConfig({
        chains: supportedChains,
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
    })()
  : createConfig({
      chains: supportedChains,
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
