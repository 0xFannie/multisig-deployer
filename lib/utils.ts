import { SUPPORTED_NETWORKS } from '../components/DeployedContractsList'

/**
 * 获取区块链浏览器 URL（用于地址）
 */
export function getExplorerUrlForAddress(address: string, chainId: number): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/address/',
    137: 'https://polygonscan.com/address/',
    56: 'https://bscscan.com/address/',
    43114: 'https://snowtrace.io/address/',
    250: 'https://ftmscan.com/address/',
    42161: 'https://arbiscan.io/address/',
    10: 'https://optimistic.etherscan.io/address/',
    8453: 'https://basescan.org/address/',
    324: 'https://explorer.zksync.io/address/',
    534352: 'https://scrollscan.com/address/',
    1101: 'https://zkevm.polygonscan.com/address/',
    59144: 'https://lineascan.build/address/',
    11155111: 'https://sepolia.etherscan.io/address/',
    5: 'https://goerli.etherscan.io/address/',
  }
  return explorers[chainId] ? `${explorers[chainId]}${address}` : `https://etherscan.io/address/${address}`
}

/**
 * 获取区块链浏览器 URL（用于交易哈希）
 */
export function getExplorerUrlForTx(network: string, hash: string): string | null {
  const networkMap: Record<string, { baseUrl: string; type: 'address' | 'tx' }> = {
    'Ethereum': { baseUrl: 'https://etherscan.io', type: 'tx' },
    'Polygon': { baseUrl: 'https://polygonscan.com', type: 'tx' },
    'BNB Chain': { baseUrl: 'https://bscscan.com', type: 'tx' },
    'BSC': { baseUrl: 'https://bscscan.com', type: 'tx' },
    'Avalanche': { baseUrl: 'https://snowtrace.io', type: 'tx' },
    'Fantom': { baseUrl: 'https://ftmscan.com', type: 'tx' },
    'Arbitrum One': { baseUrl: 'https://arbiscan.io', type: 'tx' },
    'Optimism': { baseUrl: 'https://optimistic.etherscan.io', type: 'tx' },
    'Base': { baseUrl: 'https://basescan.org', type: 'tx' },
    'zkSync Era': { baseUrl: 'https://explorer.zksync.io', type: 'tx' },
    'Scroll': { baseUrl: 'https://scrollscan.com', type: 'tx' },
    'Polygon zkEVM': { baseUrl: 'https://zkevm.polygonscan.com', type: 'tx' },
    'Linea': { baseUrl: 'https://lineascan.build', type: 'tx' },
    'Sepolia': { baseUrl: 'https://sepolia.etherscan.io', type: 'tx' },
    'Goerli': { baseUrl: 'https://goerli.etherscan.io', type: 'tx' },
  }

  const config = networkMap[network]
  if (!config) return null
  return `${config.baseUrl}/${config.type}/${hash}`
}

/**
 * 获取网络名称
 */
export function getNetworkName(chainId: number, t?: (key: string) => string): string {
  const network = SUPPORTED_NETWORKS.find(n => n.id === chainId)
  return network?.name || (t ? t('index.unknownNetwork') : 'Unknown Network')
}

/**
 * 获取网络图标
 */
export function getNetworkIcon(chainId: number): string {
  const network = SUPPORTED_NETWORKS.find(n => n.id === chainId)
  return network?.icon || '?'
}

/**
 * 获取网络颜色类名
 */
export function getNetworkColor(chainId: number): string {
  const network = SUPPORTED_NETWORKS.find(n => n.id === chainId)
  return network?.color || 'text-gray-400'
}

/**
 * 格式化地址显示（前6位...后4位）
 */
export function formatAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address || address.length < startLength + endLength) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

