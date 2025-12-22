import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { useTranslation } from 'next-i18next'
import { 
  Wallet, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  CheckCircle2, 
  FileText, 
  Send,
  ExternalLink,
  Copy,
  Edit2,
  Save,
  X,
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import MultiSigWalletABI from '../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'
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
import { formatEther, formatUnits, erc20Abi } from 'viem'
import { TransferModal } from './TransferModal'
import { ConfirmDialog } from './ConfirmDialog'
import { getTokenAddresses } from '../lib/tokenAddresses'

// Network configuration
export const SUPPORTED_NETWORKS = [
  { id: mainnet.id, name: 'Ethereum', icon: '⟠', color: 'text-blue-400', type: 'mainnet', chain: mainnet },
  { id: polygon.id, name: 'Polygon', icon: '⬣', color: 'text-purple-400', type: 'mainnet', chain: polygon },
  { id: bsc.id, name: 'BNB Chain', icon: '◆', color: 'text-yellow-400', type: 'mainnet', chain: bsc },
  { id: avalanche.id, name: 'Avalanche', icon: '▲', color: 'text-red-400', type: 'mainnet', chain: avalanche },
  { id: fantom.id, name: 'Fantom', icon: '◈', color: 'text-blue-300', type: 'mainnet', chain: fantom },
  { id: arbitrum.id, name: 'Arbitrum One', icon: '◉', color: 'text-blue-500', type: 'layer2', chain: arbitrum },
  { id: optimism.id, name: 'Optimism', icon: '●', color: 'text-red-500', type: 'layer2', chain: optimism },
  { id: base.id, name: 'Base', icon: '🔵', color: 'text-blue-600', type: 'layer2', chain: base },
  { id: zkSync.id, name: 'zkSync Era', icon: '⚡', color: 'text-purple-500', type: 'zk', chain: zkSync },
  { id: scroll.id, name: 'Scroll', icon: '📜', color: 'text-orange-400', type: 'zk', chain: scroll },
  { id: polygonZkEvm.id, name: 'Polygon zkEVM', icon: '⬢', color: 'text-purple-600', type: 'zk', chain: polygonZkEvm },
  { id: linea.id, name: 'Linea', icon: '▰', color: 'text-cyan-400', type: 'zk', chain: linea },
  { id: sepolia.id, name: 'Sepolia', icon: '🧪', color: 'text-green-400', type: 'testnet', chain: sepolia },
  { id: goerli.id, name: 'Goerli', icon: '🧪', color: 'text-green-500', type: 'testnet', chain: goerli },
]

interface SavedContract {
  address: string
  chainId: number
  name?: string
  addedAt: number
  discoveredAt?: number // 自动发现的时间
}

interface ContractInfo {
  balance: string // Native token balance (ETH, MATIC, etc.)
  usdtBalance: string
  usdcBalance: string // USDC.e (bridged) or USDC (depending on chain)
  usdcNativeBalance: string // USDC Native (only for chains that support it)
  owners: string[]
  ownerEnsNames: Record<string, string> // Map of owner address to ENS name
  requiredConfirmations: number
  transactionCount: number
}

interface ManualQueryResult {
  address: string
  chainId: number
  info: ContractInfo | null
  loading: boolean
}

export interface DeployedContractsListProps {
  onInitiateTransfer?: (contractAddress: string, chainId: number) => void
}

export function DeployedContractsList({ onInitiateTransfer }: DeployedContractsListProps) {
  const { t } = useTranslation('common')
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [mounted, setMounted] = useState(false)
  const [contracts, setContracts] = useState<SavedContract[]>([])
  const [expandedContract, setExpandedContract] = useState<string | null>(null)
  const [contractInfos, setContractInfos] = useState<Record<string, ContractInfo>>({})
  const [loadingContracts, setLoadingContracts] = useState<Record<string, boolean>>({})
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editLabelValue, setEditLabelValue] = useState<string>('')
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [selectedContractForTransfer, setSelectedContractForTransfer] = useState<{
    address: string
    chainId: number
    info: ContractInfo
  } | null>(null)
  
  // 网络切换确认对话框状态
  const [networkSwitchDialog, setNetworkSwitchDialog] = useState<{
    isOpen: boolean
    networkName: string
    contractAddress: string
    contractChainId: number
    contractInfo: ContractInfo | null
  }>({
    isOpen: false,
    networkName: '',
    contractAddress: '',
    contractChainId: 0,
    contractInfo: null,
  })
  
  // 主动查询相关状态
  const [manualQueryAddress, setManualQueryAddress] = useState('')
  const [manualQueryChainId, setManualQueryChainId] = useState<number>(polygon.id)
  const [manualQueryResult, setManualQueryResult] = useState<ManualQueryResult | null>(null)
  const [manualQueryLoading, setManualQueryLoading] = useState(false)
  
  // 自动扫描状态
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<{ chain: string; status: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isConnected && address) {
      console.log('🔍 钱包已连接，开始加载已部署的合约...', { address, chainId })
      loadContracts()
      // 自动触发扫描（可选，因为扫描可能很慢）
      // autoScanContracts()
    } else if (mounted) {
      console.log('⏸️ 钱包未连接，清空合约列表')
      setContracts([])
      setContractInfos({})
      setManualQueryResult(null)
    }
  }, [mounted, isConnected, address])

  // 监听 localStorage 变化
  useEffect(() => {
    if (!mounted || !isConnected || !address) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'multisig_contracts') {
        console.log('📦 检测到 localStorage 变化，重新加载合约列表')
        loadContracts()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    const handleCustomStorageChange = () => {
      console.log('📦 检测到自定义存储变化事件，重新加载合约列表')
      loadContracts()
    }
    window.addEventListener('contractsUpdated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('contractsUpdated', handleCustomStorageChange)
    }
  }, [mounted, isConnected, address])

  // 验证合约是否是 MultiSigWallet
  const verifyContractIsMultiSig = async (contractAddress: string, chainId: number): Promise<boolean> => {
    try {
      const publicClient = getPublicClientForChain(chainId)
      if (!publicClient) return false

      await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getOwners',
      })
      return true
    } catch (error) {
      return false
    }
  }

  // 从交易哈希获取合约地址
  const getContractAddressFromTx = async (txHash: string, chainId: number): Promise<string | null> => {
    try {
      const publicClient = getPublicClientForChain(chainId)
      if (!publicClient) return null

      console.log(`🔍 查询交易 ${txHash} 在链 ${chainId} 上的收据...`)
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
      
      if (receipt.contractAddress) {
        console.log(`✅ 找到合约地址: ${receipt.contractAddress}`)
        return receipt.contractAddress
      }
      
      console.warn(`⚠️ 交易 ${txHash} 不是合约创建交易`)
      return null
    } catch (error) {
      console.error('获取交易收据失败:', error)
      return null
    }
  }

  const loadContracts = async () => {
    const saved = localStorage.getItem('multisig_contracts')
    let localContracts: SavedContract[] = []
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          localContracts = parsed
          console.log(`✅ 从 localStorage 加载了 ${localContracts.length} 个合约`)
        }
      } catch (error) {
        console.error('❌ 解析 localStorage 数据失败:', error)
      }
    }

    // 验证 localStorage 中的合约是否仍然有效
    const verifiedContracts: SavedContract[] = []
    for (const contract of localContracts) {
      try {
        const isValid = await verifyContractIsMultiSig(contract.address, contract.chainId)
        if (isValid) {
          verifiedContracts.push(contract)
        } else {
          console.warn(`⚠️ 合约 ${contract.address} 在链 ${contract.chainId} 上验证失败`)
        }
      } catch (error) {
        console.warn(`⚠️ 验证合约 ${contract.address} 时出错:`, error)
        // 即使验证失败，也保留合约（可能是网络问题）
        verifiedContracts.push(contract)
      }
    }

    // 按部署时间倒序排列
    const sorted = verifiedContracts.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    setContracts(sorted)
    console.log(`✅ 最终加载 ${sorted.length} 个已部署的合约`)
    
    // 强制刷新所有合约信息（包括余额）
    for (const contract of sorted) {
      await loadContractInfo(contract.address, contract.chainId, true)
    }
  }

  // 获取指定链的 public client
  const getPublicClientForChain = (chainId: number) => {
    const network = SUPPORTED_NETWORKS.find(n => n.id === chainId)
    if (!network) return null

    return createPublicClient({
      chain: network.chain,
      transport: http(),
    })
  }

  const getNetworkName = (chainId: number) => {
    const network = SUPPORTED_NETWORKS.find(n => n.id === chainId)
    return network?.name || t('index.unknownNetwork')
  }

  const getNetworkIcon = (chainId: number) => {
    const network = SUPPORTED_NETWORKS.find(n => n.id === chainId)
    return network?.icon || '?'
  }

  const getNetworkColor = (chainId: number) => {
    const network = SUPPORTED_NETWORKS.find(n => n.id === chainId)
    return network?.color || 'text-gray-400'
  }

  const getExplorerUrl = (address: string, chainId: number): string => {
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


  // 获取原生代币名称
  const getNativeTokenName = (chainId: number, showPreviousName?: boolean): string => {
    const tokenNames: Record<number, string> = {
      1: 'ETH',
      137: showPreviousName ? 'POL (previously MATIC)' : 'POL',
      56: 'BNB',
      43114: 'AVAX',
      250: 'FTM',
      42161: 'ETH',
      10: 'ETH',
      8453: 'ETH',
      324: 'ETH',
      534352: 'ETH',
      1101: 'ETH',
      59144: 'ETH',
      11155111: 'ETH',
      5: 'ETH',
    }
    return tokenNames[chainId] || 'ETH'
  }

  // 解析 ENS 域名（仅支持 Ethereum 主网）
  const resolveEnsName = async (address: string, chainId: number): Promise<string | null> => {
    if (chainId !== 1) return null // 只有 Ethereum 主网支持 ENS
    
    try {
      const publicClient = getPublicClientForChain(1)
      if (!publicClient) return null
      
      // 使用 ENS 反向解析
      const name = await publicClient.getEnsName({ address: address as `0x${string}` })
      return name || null
    } catch (error) {
      console.error('Failed to resolve ENS name:', error)
      return null
    }
  }

  // 跨链加载合约信息
  const loadContractInfo = async (contractAddress: string, contractChainId: number, forceRefresh: boolean = false) => {
    const contractKey = `${contractChainId}-${contractAddress}`
    
    // 如果已有缓存且不是强制刷新，则跳过
    if (contractInfos[contractKey] && !forceRefresh) {
      return
    }

    setLoadingContracts(prev => ({ ...prev, [contractKey]: true }))

    try {
      const publicClient = getPublicClientForChain(contractChainId)
      if (!publicClient) {
        throw new Error(`Unsupported chain: ${contractChainId}`)
      }

      const owners = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getOwners',
      }) as string[]

      const [required, txCount, balance] = await Promise.all([
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MultiSigWalletABI.abi,
          functionName: 'numConfirmationsRequired',
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MultiSigWalletABI.abi,
          functionName: 'getTransactionCount',
        }),
        publicClient.getBalance({
          address: contractAddress as `0x${string}`,
        }),
      ])

      // 查询 USDT 和 USDC 余额
      const tokenAddresses = getTokenAddresses(contractChainId)
      let usdtBalance = 0n
      let usdcBalance = 0n // USDC.e (bridged) or USDC
      let usdcNativeBalance = 0n // USDC Native
      
      if (tokenAddresses.usdt) {
        try {
          console.log(`🔍 [loadContractInfo] 正在查询 USDT 余额:`, {
            usdtAddress: tokenAddresses.usdt,
            contractAddress,
            chainId: contractChainId,
          })
          usdtBalance = await publicClient.readContract({
            address: tokenAddresses.usdt as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [contractAddress as `0x${string}`],
          }) as bigint
          console.log(`✅ [loadContractInfo] USDT 余额查询成功:`, {
            raw: usdtBalance.toString(),
            formatted: formatTokenBalance(usdtBalance.toString(), 6),
            contractAddress,
            chainId: contractChainId,
          })
        } catch (error) {
          console.error('❌ [loadContractInfo] Failed to fetch USDT balance:', error)
          console.error('Error details:', {
            usdtAddress: tokenAddresses.usdt,
            contractAddress,
            chainId: contractChainId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
          usdtBalance = 0n
        }
      } else {
        console.warn(`⚠️ [loadContractInfo] USDT 地址未配置，chainId: ${contractChainId}`)
      }

      if (tokenAddresses.usdc) {
        try {
          console.log(`🔍 [loadContractInfo] 正在查询 USDC 余额:`, {
            usdcAddress: tokenAddresses.usdc,
            contractAddress,
            chainId: contractChainId,
          })
          usdcBalance = await publicClient.readContract({
            address: tokenAddresses.usdc as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [contractAddress as `0x${string}`],
          }) as bigint
          console.log(`✅ [loadContractInfo] USDC 余额查询成功:`, {
            raw: usdcBalance.toString(),
            formatted: formatTokenBalance(usdcBalance.toString(), 6),
            contractAddress,
            chainId: contractChainId,
          })
        } catch (error) {
          console.error('❌ [loadContractInfo] Failed to fetch USDC balance:', error)
          console.error('Error details:', {
            usdcAddress: tokenAddresses.usdc,
            contractAddress,
            chainId: contractChainId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
          usdcBalance = 0n
        }
      } else {
        console.warn(`⚠️ [loadContractInfo] USDC 地址未配置，chainId: ${contractChainId}`)
      }

      // 查询 USDC Native 余额（如果链支持）
      if (tokenAddresses.usdcNative) {
        try {
          console.log(`🔍 [loadContractInfo] 正在查询 USDC Native 余额:`, {
            usdcNativeAddress: tokenAddresses.usdcNative,
            contractAddress,
            chainId: contractChainId,
          })
          usdcNativeBalance = await publicClient.readContract({
            address: tokenAddresses.usdcNative as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [contractAddress as `0x${string}`],
          }) as bigint
          console.log(`✅ [loadContractInfo] USDC Native 余额查询成功:`, {
            raw: usdcNativeBalance.toString(),
            formatted: formatTokenBalance(usdcNativeBalance.toString(), 6),
            contractAddress,
            chainId: contractChainId,
          })
        } catch (error) {
          console.error('❌ [loadContractInfo] Failed to fetch USDC Native balance:', error)
          console.error('Error details:', {
            usdcNativeAddress: tokenAddresses.usdcNative,
            contractAddress,
            chainId: contractChainId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
          usdcNativeBalance = 0n
        }
      }

      // 解析 ENS 域名（仅 Ethereum 主网）
      const ownerEnsNames: Record<string, string> = {}
      if (contractChainId === 1) {
        const ensPromises = owners.map(owner => 
          resolveEnsName(owner, contractChainId).then(name => ({ owner, name }))
        )
        const ensResults = await Promise.all(ensPromises)
        ensResults.forEach(({ owner, name }) => {
          if (name) ownerEnsNames[owner.toLowerCase()] = name
        })
      }

      const contractInfo = {
        owners,
        requiredConfirmations: Number(required),
        transactionCount: Number(txCount),
        balance: balance.toString(),
        usdtBalance: usdtBalance.toString(),
        usdcBalance: usdcBalance.toString(),
        usdcNativeBalance: usdcNativeBalance.toString(),
        ownerEnsNames,
      }
      
      console.log(`📊 合约信息已加载:`, {
        contractAddress,
        chainId: contractChainId,
        balance: contractInfo.balance,
        formattedBalance: formatBalance(contractInfo.balance, 18),
        usdtBalance: contractInfo.usdtBalance,
        formattedUSDT: formatTokenBalance(contractInfo.usdtBalance, 6),
        usdcBalance: contractInfo.usdcBalance,
        formattedUSDC: formatTokenBalance(contractInfo.usdcBalance, 6),
        usdcNativeBalance: contractInfo.usdcNativeBalance,
        formattedUSDCNative: formatTokenBalance(contractInfo.usdcNativeBalance, 6),
      })
      
      setContractInfos(prev => ({
        ...prev,
        [contractKey]: contractInfo
      }))
    } catch (error) {
      console.error('Failed to load contract info:', error)
      toast.error(t('view.loadFailed'))
    } finally {
      setLoadingContracts(prev => ({ ...prev, [contractKey]: false }))
    }
  }

  // 主动查询合约
  const handleManualQuery = async () => {
    if (!manualQueryAddress.trim()) {
      toast.error(t('view.invalidAddress'))
      return
    }

    let contractAddress = manualQueryAddress.trim()
    
    // 如果是交易哈希，先获取合约地址
    if (manualQueryAddress.startsWith('0x') && manualQueryAddress.length === 66) {
      setManualQueryLoading(true)
      try {
        const address = await getContractAddressFromTx(manualQueryAddress, manualQueryChainId)
        if (!address) {
          toast.error(t('deployedContracts.txNotFound'))
          setManualQueryLoading(false)
          return
        }
        contractAddress = address
      } catch (error) {
        toast.error(t('deployedContracts.txNotFound'))
        setManualQueryLoading(false)
        return
      }
    }

    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      toast.error(t('view.invalidAddress'))
      setManualQueryLoading(false)
      return
    }

    setManualQueryLoading(true)
    setManualQueryResult({
      address: contractAddress,
      chainId: manualQueryChainId,
      info: null,
      loading: true,
    })

    try {
      // 验证是否是 MultiSigWallet
      const isValid = await verifyContractIsMultiSig(contractAddress, manualQueryChainId)
      if (!isValid) {
        setManualQueryResult({
          address: contractAddress,
          chainId: manualQueryChainId,
          info: null,
          loading: false,
        })
        toast.error(t('deployedContracts.notMultiSig'))
        return
      }

      // 加载合约详情
      const publicClient = getPublicClientForChain(manualQueryChainId)
      if (!publicClient) {
        throw new Error(`Unsupported chain: ${manualQueryChainId}`)
      }

      const owners = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getOwners',
      }) as string[]

      const [required, txCount, balance] = await Promise.all([
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MultiSigWalletABI.abi,
          functionName: 'numConfirmationsRequired',
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MultiSigWalletABI.abi,
          functionName: 'getTransactionCount',
        }),
        publicClient.getBalance({
          address: contractAddress as `0x${string}`,
        }),
      ])

      // 查询 USDT 和 USDC 余额
      const tokenAddresses = getTokenAddresses(manualQueryChainId)
      let usdtBalance = 0n
      let usdcBalance = 0n // USDC.e (bridged) or USDC
      let usdcNativeBalance = 0n // USDC Native
      
      if (tokenAddresses.usdt) {
        try {
          usdtBalance = await publicClient.readContract({
            address: tokenAddresses.usdt as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [contractAddress as `0x${string}`],
          }) as bigint
        } catch (error) {
          console.warn('Failed to fetch USDT balance:', error)
          usdtBalance = 0n
        }
      }

      if (tokenAddresses.usdc) {
        try {
          console.log(`🔍 [手动查询] 正在读取 USDC 余额:`, {
            usdcAddress: tokenAddresses.usdc,
            contractAddress,
            chainId: manualQueryChainId,
          })
          usdcBalance = await publicClient.readContract({
            address: tokenAddresses.usdc as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [contractAddress as `0x${string}`],
          }) as bigint
          console.log(`✅ [手动查询] USDC 余额读取成功: ${usdcBalance.toString()} (原始值), ${formatTokenBalance(usdcBalance.toString(), 6)} (格式化后)`)
        } catch (error) {
          console.error('❌ [手动查询] Failed to fetch USDC balance:', error)
          console.error('Error details:', {
            usdcAddress: tokenAddresses.usdc,
            contractAddress,
            chainId: manualQueryChainId,
            error: error instanceof Error ? error.message : String(error),
          })
          usdcBalance = 0n
        }
      } else {
        console.warn('⚠️ [手动查询] USDC 地址未配置，chainId:', manualQueryChainId)
      }

      // 查询 USDC Native 余额（如果链支持）
      if (tokenAddresses.usdcNative) {
        try {
          console.log(`🔍 [手动查询] 正在读取 USDC Native 余额:`, {
            usdcNativeAddress: tokenAddresses.usdcNative,
            contractAddress,
            chainId: manualQueryChainId,
          })
          usdcNativeBalance = await publicClient.readContract({
            address: tokenAddresses.usdcNative as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [contractAddress as `0x${string}`],
          }) as bigint
          console.log(`✅ [手动查询] USDC Native 余额读取成功: ${usdcNativeBalance.toString()} (原始值), ${formatTokenBalance(usdcNativeBalance.toString(), 6)} (格式化后)`)
        } catch (error) {
          console.error('❌ [手动查询] Failed to fetch USDC Native balance:', error)
          console.error('Error details:', {
            usdcNativeAddress: tokenAddresses.usdcNative,
            contractAddress,
            chainId: manualQueryChainId,
            error: error instanceof Error ? error.message : String(error),
          })
          usdcNativeBalance = 0n
        }
      }

      // 解析 ENS 域名（仅 Ethereum 主网）
      const ownerEnsNames: Record<string, string> = {}
      if (manualQueryChainId === 1) {
        const ensPromises = owners.map(owner => 
          resolveEnsName(owner, manualQueryChainId).then(name => ({ owner, name }))
        )
        const ensResults = await Promise.all(ensPromises)
        ensResults.forEach(({ owner, name }) => {
          if (name) ownerEnsNames[owner.toLowerCase()] = name
        })
      }

      const contractInfo: ContractInfo = {
        owners,
        requiredConfirmations: Number(required),
        transactionCount: Number(txCount),
        balance: balance.toString(),
        usdtBalance: usdtBalance.toString(),
        usdcBalance: usdcBalance.toString(),
        usdcNativeBalance: usdcNativeBalance.toString(),
        ownerEnsNames,
      }

      setManualQueryResult({
        address: contractAddress,
        chainId: manualQueryChainId,
        info: contractInfo,
        loading: false,
      })

      toast.success(t('view.loadSuccess'))
    } catch (error) {
      console.error('查询合约失败:', error)
      setManualQueryResult({
        address: contractAddress,
        chainId: manualQueryChainId,
        info: null,
        loading: false,
      })
      toast.error(t('view.loadFailed'))
    } finally {
      setManualQueryLoading(false)
    }
  }

  // 将手动查询的合约添加到列表
  const addManualQueryToContracts = () => {
    if (!manualQueryResult || !manualQueryResult.info) return

    const exists = contracts.some(
      c => c.address.toLowerCase() === manualQueryResult.address.toLowerCase() && c.chainId === manualQueryResult.chainId
    )
    if (exists) {
      toast.error(t('deployedContracts.alreadyExists'))
      return
    }

    const newContract: SavedContract = {
      address: manualQueryResult.address,
      chainId: manualQueryResult.chainId,
      addedAt: Date.now(),
    }

    const updated = [newContract, ...contracts]
    setContracts(updated)
    localStorage.setItem('multisig_contracts', JSON.stringify(updated))
    window.dispatchEvent(new Event('contractsUpdated'))
    
    toast.success(t('deployedContracts.addedSuccess'))
    setManualQueryResult(null)
    setManualQueryAddress('')
  }

  const handleContractClick = (contract: SavedContract) => {
    const contractKey = `${contract.chainId}-${contract.address}`
    if (expandedContract === contractKey) {
      setExpandedContract(null)
    } else {
      setExpandedContract(contractKey)
      // 总是刷新合约信息（包括余额），确保数据是最新的
      loadContractInfo(contract.address, contract.chainId, true)
    }
  }

  const handleEditLabel = (contract: SavedContract) => {
    setEditingLabel(`${contract.chainId}-${contract.address}`)
    setEditLabelValue(contract.name || '')
  }

  const handleSaveLabel = (contract: SavedContract) => {
    const updated = contracts.map(c => 
      c.address === contract.address && c.chainId === contract.chainId
        ? { ...c, name: editLabelValue.trim() || undefined }
        : c
    )
    setContracts(updated)
    localStorage.setItem('multisig_contracts', JSON.stringify(updated))
    setEditingLabel(null)
    setEditLabelValue('')
    toast.success(t('deployedContracts.labelSaved'))
    window.dispatchEvent(new Event('contractsUpdated'))
  }

  const handleCancelEdit = () => {
    setEditingLabel(null)
    setEditLabelValue('')
  }

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success(t('deploy.addressCopied'))
    } catch (error) {
      toast.error(t('deploy.copyFailed'))
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (balance: string, decimals: number = 18) => {
    const amount = Number(balance) / 10 ** decimals
    if (amount === 0) return '0.0000'
    if (amount < 0.0001) return '<0.0001'
    return amount.toFixed(4)
  }

  const formatTokenBalance = (balance: string, decimals: number = 6) => {
    const amount = Number(balance) / 10 ** decimals
    if (amount === 0) return '0.00'
    if (amount < 0.01) return '<0.01'
    return amount.toFixed(2)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleTransfer = async (contractAddress: string, contractChainId: number) => {
    // 注意：contractKey 格式是 ${chainId}-${address}，与 loadContractInfo 保持一致
    const contractKey = `${contractChainId}-${contractAddress}`
    
    // 如果合约信息不存在，先加载
    let contractInfo = contractInfos[contractKey]
    if (!contractInfo) {
      // 显示加载提示
      const loadingToast = toast.loading(t('view.loadingWalletInfo'))
      
      try {
        // 等待合约信息加载完成
        await loadContractInfo(contractAddress, contractChainId)
        
        // 再次获取合约信息（使用正确的 key 格式）
        contractInfo = contractInfos[contractKey]
        
        if (!contractInfo) {
          toast.error(t('deployedContracts.loadContractInfoFirst'), { id: loadingToast })
          return
        }
        
        toast.dismiss(loadingToast)
      } catch (error) {
        console.error('Failed to load contract info:', error)
        toast.error(t('view.loadFailed'), { id: loadingToast })
        return
      }
    }

    // 检查网络是否匹配
    if (chainId !== contractChainId) {
      const network = SUPPORTED_NETWORKS.find(n => n.id === contractChainId)
      const networkName = network?.name || `Chain ${contractChainId}`
      
      // 显示确认对话框
      setNetworkSwitchDialog({
        isOpen: true,
        networkName,
        contractAddress,
        contractChainId,
        contractInfo,
      })
    } else {
      // 链已匹配，直接打开弹窗
      setSelectedContractForTransfer({
        address: contractAddress,
        chainId: contractChainId,
        info: contractInfo,
      })
      setTransferModalOpen(true)
    }
  }

  // 渲染合约详情卡片（用于自动查询的列表和手动查询结果）
  const renderContractDetails = (contract: SavedContract | { address: string; chainId: number }, info: ContractInfo | null, isLoading: boolean, isManualQuery?: boolean) => {
    const contractKey = `${contract.chainId}-${contract.address}`
    const isExpanded = expandedContract === contractKey || isManualQuery
    const isCurrentChain = contract.chainId === chainId
    const savedContract = 'addedAt' in contract ? contract : null

    return (
      <div
        key={contractKey}
        className="glass-card rounded-2xl overflow-hidden transition-all hover:border-primary-light/40"
      >
        {/* Contract Card Header */}
        <div
          onClick={() => !isManualQuery && handleContractClick(savedContract as SavedContract)}
          className={`w-full p-5 flex items-center justify-between hover:bg-primary-light/5 transition-all ${!isManualQuery ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-center gap-4 flex-1 text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-light/20 to-primary-gray/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-light" />
            </div>
            <div className="flex-1 min-w-0">
              {savedContract && (
                <div className="flex items-center gap-2 mb-2">
                  {editingLabel === contractKey ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editLabelValue}
                        onChange={(e) => setEditLabelValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 bg-primary-dark border border-primary-light/30 rounded text-white text-sm flex-1"
                        placeholder={t('deployedContracts.enterLabel')}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveLabel(savedContract)
                        }}
                        className="p-1 hover:bg-primary-light/20 rounded"
                      >
                        <Save className="w-4 h-4 text-green-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelEdit()
                        }}
                        className="p-1 hover:bg-primary-light/20 rounded"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-white font-semibold text-lg truncate">
                        {savedContract.name || `${t('deployedContracts.contract')} ${formatAddress(contract.address)}`}
                      </span>
                      {savedContract && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditLabel(savedContract)
                          }}
                          className="p-1 hover:bg-primary-light/20 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-primary-gray hover:text-primary-light" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-primary-light font-mono">{formatAddress(contract.address)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyAddress(contract.address)
                  }}
                  className="p-1 hover:bg-primary-light/20 rounded transition-all"
                  title={t('deploy.copyAddress')}
                >
                  <Copy className="w-4 h-4 text-primary-gray hover:text-primary-light" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(getExplorerUrl(contract.address, contract.chainId), '_blank', 'noopener,noreferrer')
                  }}
                  className="p-1 hover:bg-primary-light/20 rounded transition-all"
                  title={t('deploy.viewOnExplorer')}
                >
                  <ExternalLink className="w-4 h-4 text-primary-gray hover:text-primary-light" />
                </button>
                <span className="text-primary-gray">•</span>
                <span className={`text-lg ${getNetworkColor(contract.chainId)}`}>
                  {getNetworkIcon(contract.chainId)}
                </span>
                <span className="text-primary-gray">{getNetworkName(contract.chainId)}</span>
                {savedContract?.addedAt && (
                  <>
                    <span className="text-primary-gray">•</span>
                    <span className="text-primary-gray">
                      {t('deployedContracts.deployedAt')} {formatDate(savedContract.addedAt)}
                    </span>
                  </>
                )}
                {!isCurrentChain && (
                  <>
                    <span className="text-primary-gray">•</span>
                    <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                      {t('deployedContracts.differentNetwork')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          {!isManualQuery && (
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-primary-gray" />
              ) : (
                <ChevronDown className="w-5 h-5 text-primary-gray" />
              )}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {(isExpanded || isManualQuery) && (
          <div className="border-t border-primary-light/20 p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
                <span className="ml-3 text-primary-gray">{t('common.loading')}</span>
              </div>
            ) : info ? (
              <>
                {/* Assets Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">{t('deployedContracts.assets')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Native Token (ETH, POL, BNB, etc.) */}
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-green-400" />
                        <p className="text-xs text-primary-gray">{getNativeTokenName(contract.chainId, true)}</p>
                      </div>
                      <p className="text-2xl font-bold text-white">{formatBalance(info.balance)}</p>
                      <p className="text-xs text-primary-gray mt-1">{getNativeTokenName(contract.chainId)}</p>
                    </div>

                    {/* USDT */}
                    {(() => {
                      const tokenAddresses = getTokenAddresses(contract.chainId)
                      if (!tokenAddresses.usdt) return null
                      return (
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-blue-400" />
                            <p className="text-xs text-primary-gray">USDT</p>
                          </div>
                          <p className="text-2xl font-bold text-white">{formatTokenBalance(info.usdtBalance)}</p>
                          <p className="text-xs text-primary-gray mt-1">USDT</p>
                        </div>
                      )
                    })()}

                    {/* USDC.e (bridged) or USDC - 根据链显示不同标签 */}
                    {(() => {
                      const tokenAddresses = getTokenAddresses(contract.chainId)
                      if (!tokenAddresses.usdc) return null
                      
                      // 判断是 USDC.e 还是 USDC
                      const isUSDCE = contract.chainId === 137 || contract.chainId === 42161 || contract.chainId === 10
                      const label = isUSDCE ? 'USDC.e' : 'USDC'
                      
                      return (
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-purple-400" />
                            <p className="text-xs text-primary-gray">{label}</p>
                          </div>
                          <p className="text-2xl font-bold text-white">{formatTokenBalance(info.usdcBalance)}</p>
                          <p className="text-xs text-primary-gray mt-1">{label}</p>
                        </div>
                      )
                    })()}

                    {/* USDC Native - 仅当链支持时显示 */}
                    {(() => {
                      const tokenAddresses = getTokenAddresses(contract.chainId)
                      if (!tokenAddresses.usdcNative) return null
                      
                      return (
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-indigo-400" />
                            <p className="text-xs text-primary-gray">USDC (Native)</p>
                          </div>
                          <p className="text-2xl font-bold text-white">{formatTokenBalance(info.usdcNativeBalance)}</p>
                          <p className="text-xs text-primary-gray mt-1">USDC (Native)</p>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Wallet Info Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">{t('deployedContracts.walletInfo')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary-light" />
                        <p className="text-xs text-primary-gray">{t('view.owners')}</p>
                      </div>
                      <p className="text-2xl font-bold text-white">{info.owners.length}</p>
                      <p className="text-xs text-primary-gray mt-1">{t('view.owner')}</p>
                    </div>

                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-primary-gray" />
                        <p className="text-xs text-primary-gray">{t('view.requiredConfirmations')}</p>
                      </div>
                      <p className="text-2xl font-bold text-white">{info.requiredConfirmations}</p>
                      <p className="text-xs text-primary-gray mt-1">/ {info.owners.length}</p>
                    </div>

                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <p className="text-xs text-primary-gray">{t('view.transactions')}</p>
                      </div>
                      <p className="text-2xl font-bold text-white">{info.transactionCount}</p>
                      <p className="text-xs text-primary-gray mt-1">Transactions</p>
                    </div>
                  </div>
                </div>

                {/* Owner List */}
                <div className="glass-card rounded-xl p-5">
                  <h4 className="text-lg font-bold text-white mb-4">{t('view.ownersList')}</h4>
                  <div className="space-y-2">
                    {info.owners.map((owner, idx) => {
                      const ensName = info.ownerEnsNames?.[owner.toLowerCase()]
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-primary-dark/50 rounded-lg p-3 border border-primary-light/10"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary-light font-bold text-xs">#{idx + 1}</span>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              {ensName && (
                                <span className="text-white font-semibold text-sm truncate">{ensName}</span>
                              )}
                              <span className={`text-white font-mono text-sm ${ensName ? 'text-primary-gray' : ''} truncate`}>
                                {owner}
                              </span>
                            </div>
                            {owner.toLowerCase() === address?.toLowerCase() && (
                              <span className="px-2 py-1 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded text-xs font-semibold flex-shrink-0">
                                {t('view.you')}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTransfer(contract.address, contract.chainId)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-light/20 transition-all"
                  >
                    <Send className="w-5 h-5" />
                    {t('deployedContracts.initiateTransfer')}
                  </button>
                  {isManualQuery && (
                    <button
                      onClick={addManualQueryToContracts}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all border border-green-500/30 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      {t('deployedContracts.addToList')}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-primary-gray">{t('deployedContracts.loadFailed')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-light"></div>
      </div>
    )
  }

  if (!isConnected || !address) {
    return null
  }

  // 处理网络切换确认
  const handleNetworkSwitchConfirm = async () => {
    const { contractAddress, contractChainId, contractInfo } = networkSwitchDialog
    
    setNetworkSwitchDialog({ ...networkSwitchDialog, isOpen: false })
    
    if (!contractInfo) return
    
    try {
      await switchChain({ chainId: contractChainId })
      toast.success(t('deployedContracts.networkSwitchSuccess'))
      // 等待网络切换完成后再打开弹窗
      setTimeout(() => {
        setSelectedContractForTransfer({
          address: contractAddress,
          chainId: contractChainId,
          info: contractInfo,
        })
        setTransferModalOpen(true)
      }, 1000)
    } catch (error) {
      console.error('Failed to switch network:', error)
      toast.error(t('deployedContracts.networkSwitchFailed'))
    }
  }

  const handleNetworkSwitchCancel = () => {
    setNetworkSwitchDialog({ ...networkSwitchDialog, isOpen: false })
  }

  return (
    <>
      {/* Network Switch Confirm Dialog */}
      <ConfirmDialog
        isOpen={networkSwitchDialog.isOpen}
        title={t('deployedContracts.switchNetwork')}
        message={t('deployedContracts.switchNetworkForTransfer').replace('{{network}}', networkSwitchDialog.networkName)}
        onConfirm={handleNetworkSwitchConfirm}
        onCancel={handleNetworkSwitchCancel}
        confirmText={t('network.switch')}
        cancelText={t('transfer.cancel') || 'Cancel'}
      />

      {/* Transfer Modal */}
      {transferModalOpen && selectedContractForTransfer && (
        <TransferModal
          isOpen={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false)
            setSelectedContractForTransfer(null)
          }}
          contractAddress={selectedContractForTransfer.address}
          contractChainId={selectedContractForTransfer.chainId}
          contractInfo={selectedContractForTransfer.info}
        />
      )}

      <div className="space-y-6">
      {/* 第一部分：被动选择 - 自动查询的合约列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">{t('deployedContracts.title')}</h3>
            <p className="text-primary-gray mt-1">{t('deployedContracts.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-primary-gray text-sm">
              {contracts.length} {t('deployedContracts.contracts')}
            </div>
            <button
              onClick={loadContracts}
              className="px-4 py-2 bg-primary-light/20 hover:bg-primary-light/30 text-primary-light rounded-lg transition-all border border-primary-light/30 hover:border-primary-light/50 text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('deployedContracts.refresh')}
            </button>
          </div>
        </div>

        {contracts.length === 0 ? (
          <div className="bg-primary-light/5 border border-primary-light/20 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-light/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-primary-light" />
            </div>
            <p className="text-white text-xl font-semibold mb-2">{t('deployedContracts.noContracts')}</p>
            <p className="text-primary-gray">{t('deployedContracts.noContractsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const contractKey = `${contract.chainId}-${contract.address}`
              const info = contractInfos[contractKey]
              const isLoading = loadingContracts[contractKey]
              return renderContractDetails(contract, info || null, isLoading, false)
            })}
          </div>
        )}
      </div>

      {/* 第二部分：主动查询 - 手动输入合约地址查询 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{t('deployedContracts.manualQueryTitle')}</h3>
          <p className="text-primary-gray mt-1">{t('deployedContracts.manualQueryDesc')}</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={manualQueryAddress}
              onChange={(e) => setManualQueryAddress(e.target.value)}
              placeholder={t('deployedContracts.enterAddressOrTx')}
              className="flex-1 px-4 py-3 bg-primary-dark border border-primary-light/30 rounded-lg text-white placeholder-primary-gray focus:outline-none focus:border-primary-light"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !manualQueryLoading) {
                  handleManualQuery()
                }
              }}
            />
            <select
              value={manualQueryChainId}
              onChange={(e) => setManualQueryChainId(Number(e.target.value))}
              className="px-4 py-3 bg-primary-dark border border-primary-light/30 rounded-lg text-white focus:outline-none focus:border-primary-light"
            >
              {SUPPORTED_NETWORKS.map(network => (
                <option key={network.id} value={network.id}>{network.name}</option>
              ))}
            </select>
            <button
              onClick={handleManualQuery}
              disabled={manualQueryLoading || !manualQueryAddress.trim()}
              className="px-6 py-3 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {manualQueryLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  {t('deployedContracts.query')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 手动查询结果 */}
        {manualQueryResult && (
          <div className="mt-4">
            {renderContractDetails(
              { address: manualQueryResult.address, chainId: manualQueryResult.chainId },
              manualQueryResult.info,
              manualQueryResult.loading,
              true
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
