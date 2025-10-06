// 部署的合约地址配置
export const DEPLOYED_CONTRACTS = {
  // Layer 1 Mainnets
  ethereum: {
    MultiSigWallet: '', // 需要在 Ethereum 主网部署后填写
    chainId: 1,
  },
  polygon: {
    MultiSigWallet: '', // 需要在 Polygon 主网部署后填写
    chainId: 137,
  },
  bsc: {
    MultiSigWallet: '', // 需要在 BSC 主网部署后填写
    chainId: 56,
  },
  avalanche: {
    MultiSigWallet: '', // 需要在 Avalanche 主网部署后填写
    chainId: 43114,
  },
  fantom: {
    MultiSigWallet: '', // 需要在 Fantom 主网部署后填写
    chainId: 250,
  },
  // Layer 2
  arbitrum: {
    MultiSigWallet: '', // 需要在 Arbitrum One 部署后填写
    chainId: 42161,
  },
  optimism: {
    MultiSigWallet: '', // 需要在 Optimism 部署后填写
    chainId: 10,
  },
  base: {
    MultiSigWallet: '', // 需要在 Base 部署后填写
    chainId: 8453,
  },
  // zkEVM
  zkSync: {
    MultiSigWallet: '', // 需要在 zkSync Era 部署后填写
    chainId: 324,
  },
  scroll: {
    MultiSigWallet: '', // 需要在 Scroll 部署后填写
    chainId: 534352,
  },
  polygonZkEvm: {
    MultiSigWallet: '', // 需要在 Polygon zkEVM 部署后填写
    chainId: 1101,
  },
  linea: {
    MultiSigWallet: '', // 需要在 Linea 部署后填写
    chainId: 59144,
  },
  // Testnets
  sepolia: {
    MultiSigWallet: '', // 部署后填写
    chainId: 11155111,
  },
  goerli: {
    MultiSigWallet: '', // 部署后填写
    chainId: 5,
  },
}

// 获取当前网络的合约地址
export function getContractAddress(chainId: number): string | null {
  const network = Object.entries(DEPLOYED_CONTRACTS).find(
    ([_, config]) => config.chainId === chainId
  )
  return network ? network[1].MultiSigWallet : null
}

