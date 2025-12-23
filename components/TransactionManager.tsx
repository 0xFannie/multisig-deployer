import { useState, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi'
import { Send, CheckCircle2, XCircle, Clock, Loader, FileText, User, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'next-i18next'
import MultiSigWalletABI from '../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'
import { formatEther, formatUnits, createPublicClient, http } from 'viem'
import { TransferModal } from './TransferModal'
import { ApproveConfirmDialog } from './ApproveConfirmDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { SUPPORTED_NETWORKS } from './DeployedContractsList'

export interface TransactionManagerProps {
  initialContract?: string
  initialChainId?: number
}

interface DatabaseTransaction {
  id: string
  contract_address: string
  network: string
  tx_index: number
  to_address: string
  value: string
  asset_type: string
  asset_address?: string
  submitted_by: string
  transaction_hash?: string
  status: 'pending' | 'executed' | 'cancelled'
  current_confirmations: number
  required_confirmations: number
  notification_sent_at?: string
  executed_by?: string
  executed_at?: string
  execution_transaction_hash?: string
  execution_gas_used?: string
  execution_gas_cost?: string
  is_whitelisted_recipient?: boolean
  expiration_time?: string | null // ISO 8601 格式的过期时间，null 表示永不过期
  created_at: string
  updated_at: string
  multisig_deployments?: {
    contract_address: string
    network: string
    owners: string[]
    threshold: number
  }
  transaction_approvals?: Array<{
    approved_by: string
    approved_at: string
    transaction_hash?: string
  }>
  userRole?: 'submitter' | 'approver' | 'both'
  userApprovedAt?: string
}

export function TransactionManager({ initialContract, initialChainId }: TransactionManagerProps) {
  const { t } = useTranslation('common')
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  
  // 交易数据
  const [myTransactions, setMyTransactions] = useState<DatabaseTransaction[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<DatabaseTransaction[]>([])
  
  // 弹窗状态
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<DatabaseTransaction | null>(null)
  const [transactionToRevoke, setTransactionToRevoke] = useState<DatabaseTransaction | null>(null)

  // 合约 owner 验证
  const [currentContractAddress, setCurrentContractAddress] = useState<string | null>(initialContract || null)
  const [currentContractOwners, setCurrentContractOwners] = useState<string[]>([])
  const [isCurrentWalletOwner, setIsCurrentWalletOwner] = useState<boolean | null>(null) // null 表示未检查
  const [checkingOwner, setCheckingOwner] = useState(false)

  // 初始化
  useEffect(() => {
    setMounted(true)
    const savedUserId = localStorage.getItem('multisig_user_id')
    if (savedUserId) {
      setUserId(savedUserId)
    }
  }, [])

  // 获取用户ID（从 localStorage 或 state）
  const getOrCreateUserId = async (): Promise<string | null> => {
    if (userId) return userId
    if (!address) return null

    // 从 localStorage 读取 userId
    const savedUserId = localStorage.getItem('multisig_user_id')
    if (savedUserId) {
      // 验证 userId 是否有效（通过检查钱包地址是否匹配）
      try {
        const response = await fetch('/api/users/get-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: savedUserId })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user?.wallet_address?.toLowerCase() === address.toLowerCase()) {
            setUserId(savedUserId)
            return savedUserId
          } else {
            // 钱包地址不匹配，清除无效的 userId
            localStorage.removeItem('multisig_user_id')
          }
        }
      } catch (error) {
        console.error('Error validating user ID:', error)
      }
    }

    // 如果没有有效的 userId，返回 null（用户需要先完成签名授权）
    console.warn('User ID not available. Please complete wallet authorization first.')
    return null
  }

  // 从链上读取交易的实际确认数、用户确认状态和过期时间
  const getChainConfirmations = async (
    contractAddress: string, 
    txIndex: number, 
    network: string,
    userAddress?: string
  ): Promise<{ confirmations: number; userConfirmed: boolean; expirationTime: number } | null> => {
    try {
      const networkConfig = SUPPORTED_NETWORKS.find(n => n.name.toLowerCase() === network.toLowerCase())
      if (!networkConfig || !networkConfig.chain) return null

      // 创建对应网络的 publicClient
      const chainPublicClient = createPublicClient({
        chain: networkConfig.chain,
        transport: http(),
      })

      // 读取交易确认数和过期时间
      const result = await chainPublicClient.readContract({
        address: contractAddress.toLowerCase() as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getTransaction',
        args: [BigInt(txIndex)],
      }) as [string, bigint, string, boolean, bigint, bigint]

      // result[4] 是 numConfirmations, result[5] 是 expirationTime
      const confirmations = Number(result[4])
      const expirationTime = Number(result[5])
      
      // 如果提供了用户地址，检查用户是否已确认
      let userConfirmed = false
      if (userAddress) {
        try {
          userConfirmed = await chainPublicClient.readContract({
            address: contractAddress.toLowerCase() as `0x${string}`,
            abi: MultiSigWalletABI.abi,
            functionName: 'isConfirmed',
            args: [BigInt(txIndex), userAddress.toLowerCase() as `0x${string}`],
          }) as boolean
        } catch (error) {
          console.warn('Failed to check user confirmation status:', error)
        }
      }

      return { confirmations, userConfirmed, expirationTime }
    } catch (error) {
      console.error('Failed to read confirmations from chain:', error)
      return null
    }
  }

  // 加载我的所有交易
  const loadMyTransactions = async () => {
    if (!address) return

    try {
      setLoading(true)
      const currentUserId = await getOrCreateUserId()
      if (!currentUserId) {
        console.warn('User ID not available')
        return
      }

      const response = await fetch(`/api/transactions/my-transactions?userId=${currentUserId}&walletAddress=${address}`)
      const data = await response.json()

      if (data.success && data.transactions) {
        // 从链上同步确认数和用户确认状态
        const transactionsWithChainData = await Promise.all(
          data.transactions.map(async (tx: DatabaseTransaction) => {
            const chainData = await getChainConfirmations(
              tx.contract_address,
              tx.tx_index,
              tx.network,
              address
            )
            if (chainData !== null) {
              // 更新确认数
              const updatedTx = {
                ...tx,
                current_confirmations: chainData.confirmations,
              }
              
              // 如果用户已确认但数据库中没有记录，添加到 transaction_approvals
              if (chainData.userConfirmed && address) {
                const hasApprovalInDb = tx.transaction_approvals?.some(
                  approval => approval.approved_by.toLowerCase() === address.toLowerCase()
                )
                if (!hasApprovalInDb) {
                  updatedTx.transaction_approvals = [
                    ...(tx.transaction_approvals || []),
                    {
                      approved_by: address.toLowerCase(),
                      approved_at: new Date().toISOString(),
                    }
                  ]
                }
              }
              
              return updatedTx
            }
            return tx
          })
        )
        setMyTransactions(transactionsWithChainData)
      }
    } catch (error) {
      console.error('Failed to load my transactions:', error)
      toast.error(t('transactions.loadFailed') || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  // 加载等待审批的交易
  const loadPendingApprovals = async () => {
    if (!address) return

    try {
      setLoading(true)
      const currentUserId = await getOrCreateUserId()
      if (!currentUserId) {
        console.warn('User ID not available')
        return
      }

      const response = await fetch(`/api/transactions/pending-approvals?userId=${currentUserId}&walletAddress=${address}`)
      const data = await response.json()

      if (data.success && data.transactions) {
        // 从链上同步确认数和用户确认状态
        const transactionsWithChainData = await Promise.all(
          data.transactions.map(async (tx: DatabaseTransaction) => {
            const chainData = await getChainConfirmations(
              tx.contract_address,
              tx.tx_index,
              tx.network,
              address
            )
            if (chainData !== null) {
              // 更新确认数
              const updatedTx = {
                ...tx,
                current_confirmations: chainData.confirmations,
              }
              
              // 如果用户已确认但数据库中没有记录，添加到 transaction_approvals
              if (chainData.userConfirmed && address) {
                const hasApprovalInDb = tx.transaction_approvals?.some(
                  approval => approval.approved_by.toLowerCase() === address.toLowerCase()
                )
                if (!hasApprovalInDb) {
                  updatedTx.transaction_approvals = [
                    ...(tx.transaction_approvals || []),
                    {
                      approved_by: address.toLowerCase(),
                      approved_at: new Date().toISOString(),
                    }
                  ]
                }
              }
              
              return updatedTx
            }
            return tx
          })
        )
        setPendingApprovals(transactionsWithChainData)
      }
    } catch (error) {
      console.error('Failed to load pending approvals:', error)
      toast.error(t('transactions.loadFailed') || 'Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  // 加载所有数据
  const loadAllData = async () => {
    await Promise.all([loadMyTransactions(), loadPendingApprovals()])
  }

  // 检查当前钱包是否是合约的 owner
  const checkWalletIsOwner = async (contractAddress: string, contractChainId: number) => {
    if (!address || !publicClient) {
      setIsCurrentWalletOwner(null)
      return
    }

    setCheckingOwner(true)
    try {
      // 检查网络是否匹配
      if (chainId !== contractChainId) {
        setIsCurrentWalletOwner(false)
        setCheckingOwner(false)
        return
      }

      // 获取合约的 owners
      const owners = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getOwners',
      }) as string[]

      setCurrentContractOwners(owners)
      
      // 检查当前钱包是否是 owner
      const isOwner = owners.some(
        owner => owner.toLowerCase() === address.toLowerCase()
      )
      
      setIsCurrentWalletOwner(isOwner)
      console.log('Owner check result:', {
        contractAddress,
        currentWallet: address,
        owners,
        isOwner
      })
    } catch (error) {
      console.error('Failed to check wallet owner status:', error)
      setIsCurrentWalletOwner(false)
    } finally {
      setCheckingOwner(false)
    }
  }

  // 当 initialContract 变化时，检查 owner 状态
  useEffect(() => {
    if (initialContract && initialChainId && publicClient && address) {
      setCurrentContractAddress(initialContract)
      checkWalletIsOwner(initialContract, initialChainId)
    } else {
      setCurrentContractAddress(null)
      setIsCurrentWalletOwner(null)
      setCurrentContractOwners([])
    }
  }, [initialContract, initialChainId, address, publicClient])

  // 当用户连接或地址变化时加载数据
  useEffect(() => {
    if (mounted && isConnected && address) {
      loadAllData()
      // 如果当前有合约地址，重新检查 owner 状态
      if (currentContractAddress && initialChainId) {
        checkWalletIsOwner(currentContractAddress, initialChainId)
      }
    }
  }, [mounted, isConnected, address])

  // 监听交易提交事件，自动刷新数据
  useEffect(() => {
    const handleTransactionSubmitted = () => {
      console.log('Transaction submitted event received, refreshing data...')
      loadAllData()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('transactionSubmitted', handleTransactionSubmitted)
      return () => {
        window.removeEventListener('transactionSubmitted', handleTransactionSubmitted)
      }
    }
  }, [])

  // 处理发起交易 - 直接打开TransferModal，让它自己处理合约选择
  const handleInitiateTransaction = () => {
    setShowTransferModal(true)
  }

  // 处理审批确认
  const handleApproveConfirm = async () => {
    if (!selectedTransaction || !walletClient || !address) return

    const toastId = toast.loading(t('transactions.confirmingTransaction') || 'Confirming transaction...')

    try {
      // 检查网络
      const network = SUPPORTED_NETWORKS.find(n => n.name.toLowerCase() === selectedTransaction.network.toLowerCase())
      if (network && chainId !== network.id) {
        toast.error(t('deployedContracts.switchNetworkForTransfer')?.replace('{{network}}', network.name) || `Please switch to ${network.name}`)
        return
      }

      // 链上确认交易
      const hash = await walletClient.writeContract({
        address: selectedTransaction.contract_address as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'confirmTransaction',
        args: [BigInt(selectedTransaction.tx_index)],
        account: address as `0x${string}`,
      })

      await publicClient!.waitForTransactionReceipt({ hash })

      // 记录审批
      const currentUserId = await getOrCreateUserId()
      if (currentUserId) {
        await fetch('/api/transactions/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            transactionId: selectedTransaction.id,
            approvedBy: address,
            transactionHash: hash
          })
        })
      }

      toast.success(t('transactions.confirmSuccess') || 'Transaction approved successfully', { id: toastId })
      setShowApproveDialog(false)
      setSelectedTransaction(null)
      await loadAllData()
    } catch (error: any) {
      console.error('Approve transaction failed:', error)
      toast.error(error.message || t('transactions.confirmFailed') || 'Failed to approve transaction', { id: toastId })
    }
  }

  // 处理取消审批（撤销确认）
  const handleCancelApproval = async (tx: DatabaseTransaction) => {
    if (!walletClient || !address) return

    const toastId = toast.loading(t('transactions.revokingConfirmation') || 'Revoking confirmation...')

    try {
      const network = SUPPORTED_NETWORKS.find(n => n.name.toLowerCase() === tx.network.toLowerCase())
      if (network && chainId !== network.id) {
        toast.error(t('deployedContracts.switchNetworkForTransfer')?.replace('{{network}}', network.name) || `Please switch to ${network.name}`)
        return
      }

      const hash = await walletClient.writeContract({
        address: tx.contract_address as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'revokeConfirmation',
        args: [BigInt(tx.tx_index)],
        account: address as `0x${string}`,
      })

      await publicClient!.waitForTransactionReceipt({ hash })
      toast.success(t('transactions.revokeSuccess') || 'Confirmation revoked successfully', { id: toastId })
      await loadAllData()
    } catch (error: any) {
      console.error('Revoke confirmation failed:', error)
      toast.error(error.message || t('transactions.revokeFailed') || 'Failed to revoke confirmation', { id: toastId })
    }
  }

  // 处理撤销交易（撤销确认，如果用户已经审批过）
  const handleRevokeTransaction = (tx: DatabaseTransaction) => {
    if (!walletClient || !address) return

    // 检查用户是否已经审批过
    const hasApproved = tx.transaction_approvals?.some(
      approval => approval.approved_by.toLowerCase() === address.toLowerCase()
    )

    if (!hasApproved) {
      toast.error(t('transactions.revokeTransactionFailed') || 'You have not approved this transaction')
      return
    }

    // 显示确认对话框
    setTransactionToRevoke(tx)
    setShowRevokeDialog(true)
  }

  // 确认撤销交易
  const handleRevokeConfirm = async () => {
    if (!walletClient || !address || !transactionToRevoke) return

    const tx = transactionToRevoke
    setShowRevokeDialog(false)
    const toastId = toast.loading(t('transactions.revokingTransaction') || 'Revoking transaction...')

    try {
      const network = SUPPORTED_NETWORKS.find(n => n.name.toLowerCase() === tx.network.toLowerCase())
      if (network && chainId !== network.id) {
        toast.error(t('deployedContracts.switchNetworkForTransfer')?.replace('{{network}}', network.name) || `Please switch to ${network.name}`)
        setTransactionToRevoke(null)
        return
      }

      const hash = await walletClient.writeContract({
        address: tx.contract_address as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'revokeConfirmation',
        args: [BigInt(tx.tx_index)],
        account: address as `0x${string}`,
      })

      await publicClient!.waitForTransactionReceipt({ hash })
      toast.success(t('transactions.revokeTransactionSuccess') || 'Transaction revoked successfully', { id: toastId })
      setTransactionToRevoke(null)
      await loadAllData()
    } catch (error: any) {
      console.error('Revoke transaction failed:', error)
      toast.error(error.message || t('transactions.revokeTransactionFailed') || 'Failed to revoke transaction', { id: toastId })
      setTransactionToRevoke(null)
    }
  }

  // 格式化金额
  const formatAmount = (value: string, assetType: string, network?: string) => {
    try {
      // 标准化 assetType，移除所有空格和下划线，转为小写
      // 这样可以处理 "USDCNATIVE", "usdcNative", "usdc_native" 等各种格式
      const normalizedType = assetType.replace(/[\s_]/g, '').toLowerCase()
      
      // 将 value 转换为 BigInt 可以处理的格式
      // 如果 value 是小数（如 "0.1"），需要先转换为整数
      let bigIntValue: bigint
      if (value.includes('.')) {
        // 如果是小数，需要根据小数位数转换
        const decimals = normalizedType === 'native' ? 18 : 6
        const parts = value.split('.')
        const integerPart = parts[0] || '0'
        const decimalPart = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals)
        bigIntValue = BigInt(integerPart + decimalPart)
      } else {
        // 如果是整数，直接转换
        bigIntValue = BigInt(value)
      }
      
      if (normalizedType === 'native') {
        const nativeToken = network ? getNativeTokenName(network) : 'ETH'
        return `${formatEther(bigIntValue)} ${nativeToken}`
      } else if (normalizedType === 'usdcnative') {
        const decimals = 6
        const formatted = formatUnits(bigIntValue, decimals)
        return `${formatted} USDC (Native)`
      } else if (normalizedType === 'usdc') {
        const decimals = 6
        return `${formatUnits(bigIntValue, decimals)} USDC.e`
      } else if (normalizedType === 'usdt') {
        const decimals = 6
        return `${formatUnits(bigIntValue, decimals)} USDT`
      } else {
        // 对于未知类型，尝试使用 18 位小数，如果失败则使用 6 位
        try {
          return `${formatUnits(bigIntValue, 18)} ${assetType}`
        } catch {
          try {
            return `${formatUnits(bigIntValue, 6)} ${assetType}`
          } catch {
            return `${value} ${assetType}`
          }
        }
      }
    } catch (error) {
      console.error('formatAmount error:', { value, assetType, network, error })
      // 如果解析失败，直接显示原始值
      return `${value} ${assetType}`
    }
  }

  // 获取原生代币名称
  const getNativeTokenName = (network: string) => {
    const networkMap: Record<string, string> = {
      'Ethereum': 'ETH',
      'Polygon': 'POL',
      'BNB Chain': 'BNB',
      'Arbitrum One': 'ETH',
      'Optimism': 'ETH',
      'Base': 'ETH',
      'Avalanche': 'AVAX',
      'Linea': 'ETH',
      'zkSync Era': 'ETH',
      'Scroll': 'ETH',
      'Polygon zkEVM': 'ETH',
      'Sepolia': 'ETH',
      'Goerli': 'ETH',
    }
    return networkMap[network] || 'ETH'
  }

  // 获取浏览器链接
  const getExplorerUrl = (network: string, hash: string) => {
    const explorers: Record<string, string> = {
      ethereum: 'https://etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      bsc: 'https://bscscan.com/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      optimism: 'https://optimistic.etherscan.io/tx/',
      base: 'https://basescan.org/tx/',
      avalanche: 'https://snowtrace.io/tx/',
      linea: 'https://lineascan.build/tx/',
      zksync: 'https://explorer.zksync.io/tx/',
      scroll: 'https://scrollscan.com/tx/',
    }
    return explorers[network.toLowerCase()] ? `${explorers[network.toLowerCase()]}${hash}` : null
  }

  // 获取未签名的所有者（排除发起人，因为发起人不需要审批自己发起的交易）
  const getUnsignedOwners = (tx: DatabaseTransaction) => {
    if (!tx.multisig_deployments?.owners) return []
    const approvals = tx.transaction_approvals || []
    const approvedAddresses = approvals.map(a => a.approved_by.toLowerCase())
    const submitterAddress = tx.submitted_by.toLowerCase()
    
    // 排除已审批的所有者和发起人（发起人不需要审批自己发起的交易）
    return tx.multisig_deployments.owners.filter(
      owner => {
        const ownerLower = owner.toLowerCase()
        return !approvedAddresses.includes(ownerLower) && ownerLower !== submitterAddress
      }
    )
  }

  if (!mounted) {
    return <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto text-primary-light" /></div>
  }

  if (!isConnected) {
    return (
      <div className="bg-primary-light/5 border border-primary-light/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-center">
        <p className="text-primary-gray">{t('transactions.pleaseConnectWalletFirst') || 'Please connect your wallet first'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题和发起交易按钮 */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('transactions.title') || 'Transaction Management'}</h2>
          <p className="text-primary-gray mt-1">{t('transactions.subtitle') || 'Manage all your multi-signature transactions'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {currentContractAddress && isCurrentWalletOwner === false && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{t('transactions.notOwnerWarning') || 'Current wallet is not an owner of this contract. Cannot initiate transfers.'}</span>
            </div>
          )}
          <button
            onClick={() => setShowTransferModal(true)}
            disabled={!!(currentContractAddress && isCurrentWalletOwner === false)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl hover:shadow-lg transition-all font-semibold text-sm sm:text-base min-h-[44px] ${
              currentContractAddress && isCurrentWalletOwner === false
                ? 'bg-primary-gray/30 text-primary-gray cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-primary-light to-primary-gray text-primary-black hover:shadow-primary-light/20'
            }`}
          >
            <Send className="w-5 h-5" />
            {t('transfer.title') || 'Initiate Transfer'}
          </button>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border-primary-light/30">
        <div className="flex items-center justify-between mb-6 border-b border-primary-light/20">
          <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all relative ${
              activeTab === 'pending'
                ? 'text-primary-light'
                : 'text-primary-gray hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>{t('transactions.pendingApprovals') || 'Pending Approvals'}</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'pending'
                ? 'bg-primary-light/20 text-primary-light'
                : 'bg-primary-gray/20 text-primary-gray'
            }`}>
              {pendingApprovals.length}
            </span>
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-light"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all relative ${
              activeTab === 'all'
                ? 'text-primary-light'
                : 'text-primary-gray hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>{t('transactions.myAllTransactions') || 'My All Transactions'}</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'all'
                ? 'bg-primary-light/20 text-primary-light'
                : 'bg-primary-gray/20 text-primary-gray'
            }`}>
              {myTransactions.length}
            </span>
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-light"></div>
            )}
          </button>
          </div>
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-dark border border-primary-light/30 rounded-lg text-primary-light hover:bg-primary-light/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">{t('transactions.refresh')}</span>
          </button>
        </div>

        {/* Tab内容 */}
        {activeTab === 'pending' ? (
          <>
            {loading ? (
              <div className="text-center py-8">
                <Loader className="w-8 h-8 animate-spin mx-auto text-primary-light" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-primary-gray">
                {t('transactions.noPendingApprovals') || 'No pending approvals'}
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    tx={tx}
                    address={address!}
                    onApprove={() => {
                      setSelectedTransaction(tx)
                      setShowApproveDialog(true)
                    }}
                    onCancel={() => handleCancelApproval(tx)}
                    showActions={true}
                    formatAmount={formatAmount}
                    getExplorerUrl={getExplorerUrl}
                    getUnsignedOwners={getUnsignedOwners}
                    onRevoke={handleRevokeTransaction}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <div className="text-center py-8">
                <Loader className="w-8 h-8 animate-spin mx-auto text-primary-light" />
              </div>
            ) : myTransactions.length === 0 ? (
              <div className="text-center py-8 text-primary-gray">
                {t('transactions.noTransactions') || 'No transactions found'}
              </div>
            ) : (
              <div className="space-y-4">
                {myTransactions.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    tx={tx}
                    address={address!}
                    formatAmount={formatAmount}
                    getExplorerUrl={getExplorerUrl}
                    getUnsignedOwners={getUnsignedOwners}
                    onRevoke={handleRevokeTransaction}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 弹窗组件 */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false)
          loadAllData()
        }}
      />

      {selectedTransaction && (
        <ApproveConfirmDialog
          isOpen={showApproveDialog}
          onConfirm={handleApproveConfirm}
          onCancel={() => {
            setShowApproveDialog(false)
            setSelectedTransaction(null)
          }}
          transaction={{
            contractAddress: selectedTransaction.contract_address,
            network: selectedTransaction.network,
            toAddress: selectedTransaction.to_address,
            value: formatAmount(selectedTransaction.value, selectedTransaction.asset_type, selectedTransaction.network),
            assetType: selectedTransaction.asset_type,
            submittedBy: selectedTransaction.submitted_by,
            currentConfirmations: selectedTransaction.current_confirmations,
            requiredConfirmations: selectedTransaction.required_confirmations,
          }}
        />
      )}

      <ConfirmDialog
        isOpen={showRevokeDialog}
        title={t('transactions.revokeTransaction') || '撤销交易'}
        message={t('transactions.revokeTransactionConfirm') || '确定要撤销这笔交易吗？'}
        onConfirm={handleRevokeConfirm}
        onCancel={() => {
          setShowRevokeDialog(false)
          setTransactionToRevoke(null)
        }}
        confirmText={t('transactions.revokeTransaction') || '撤销交易'}
        cancelText={t('common.cancel') || '取消'}
        confirmButtonClass="bg-orange-500 hover:bg-orange-600"
      />
    </div>
  )
}

// 交易卡片组件
function TransactionCard({
  tx,
  address,
  onApprove,
  onCancel,
  showActions = false,
  formatAmount,
  getExplorerUrl,
  getUnsignedOwners,
  onRevoke,
}: {
  tx: DatabaseTransaction
  address: string
  onApprove?: () => void
  onCancel?: () => void
  showActions?: boolean
  formatAmount: (value: string, assetType: string, network?: string) => string
  getExplorerUrl: (network: string, hash: string) => string | null
  getUnsignedOwners: (tx: DatabaseTransaction) => string[]
  onRevoke?: (tx: DatabaseTransaction) => void
}) {
  const { t, ready } = useTranslation('common')

  const isExecuted = tx.status === 'executed'
  const isExpired = tx.expiration_time 
    ? new Date(tx.expiration_time) < new Date() 
    : false
  const canExecute = tx.current_confirmations >= tx.required_confirmations && !isExecuted && !isExpired
  const unsignedOwners = getUnsignedOwners(tx)
  const missingConfirmations = tx.required_confirmations - tx.current_confirmations
  
  // 检查当前用户是否已经审批过（从数据库记录或链上状态）
  const hasApproved = tx.transaction_approvals?.some(
    approval => approval.approved_by.toLowerCase() === address.toLowerCase()
  )
  
  // 检查当前用户是否是所有者（可以撤销）
  const isOwner = tx.multisig_deployments?.owners?.some(
    owner => owner.toLowerCase() === address.toLowerCase()
  )
  
  // 调试信息
  console.log('TransactionCard Debug:', {
    txIndex: tx.tx_index,
    currentConfirmations: tx.current_confirmations,
    requiredConfirmations: tx.required_confirmations,
    hasApproved,
    isOwner,
    address,
    approvalsCount: tx.transaction_approvals?.length || 0,
  })

  return (
    <div className={`glass-card rounded-lg sm:rounded-xl p-4 sm:p-5 border transition-all ${
      isExecuted ? 'opacity-75 border-green-500/30' : 'border-primary-light/30 hover:border-primary-light/50'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 space-y-3">
          {/* 交易状态和基本信息 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1 rounded-lg bg-primary-light/20" title={ready ? t('transactions.transactionIndex') || 'Transaction Index' : '交易索引'}>
              <span className="text-primary-light font-mono text-sm">
                #{tx.tx_index}
              </span>
            </div>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isExecuted
                ? 'bg-green-500/20 text-green-400'
                : isExpired
                ? 'bg-red-500/20 text-red-400'
                : canExecute
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {isExecuted
                ? t('transactions.executed') || 'Executed'
                : isExpired
                ? t('transactions.expired') || 'Expired'
                : canExecute
                ? t('transactions.waitingExecution') || 'Waiting Execution'
                : t('transactions.waitingConfirmations') || 'Waiting Confirmations'}
            </span>
            {tx.userRole && (
              <span className="px-3 py-1 rounded-lg text-sm bg-purple-500/20 text-purple-400">
                {tx.userRole === 'submitter' 
                  ? t('transactions.submitter') || 'Submitter'
                  : tx.userRole === 'approver'
                  ? t('transactions.approver') || 'Approver'
                  : t('transactions.both') || 'Both'}
              </span>
            )}
          </div>

          {/* 交易详情 */}
          <div className="bg-primary-dark/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-primary-gray text-sm">{t('transactions.recipient') || 'Recipient'}:</span>
              <span className="text-white font-mono text-sm">{tx.to_address.slice(0, 6)}...{tx.to_address.slice(-4)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-gray text-sm">{ready ? t('transactions.amount') : '转账金额'}:</span>
              <span className="text-primary-light font-semibold">{formatAmount(tx.value, tx.asset_type, tx.network)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-gray text-sm">{ready ? t('transactions.submittedBy') : '发起人'}:</span>
              <span className="text-white font-mono text-sm">{tx.submitted_by.slice(0, 6)}...{tx.submitted_by.slice(-4)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-gray text-sm">{ready ? t('transactions.submittedAt') : '提交时间'}:</span>
              <span className="text-white text-sm">
                {new Date(tx.created_at).toLocaleString()} UTC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-gray text-sm">{ready ? t('transactions.network') : '网络'}:</span>
              <span className="text-white text-sm capitalize">{tx.network}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-gray text-sm">{t('transactions.confirmations') || 'Confirmations'}:</span>
              <span className="text-white text-sm">
                {tx.current_confirmations} / {tx.required_confirmations}
              </span>
            </div>
            {tx.expiration_time && (
              <div className="flex items-center justify-between">
                <span className="text-primary-gray text-sm">{ready ? t('transactions.expirationTime') || 'Expiration Time' : '过期时间'}:</span>
                <span className={`text-sm ${isExpired ? 'text-red-400' : 'text-white'}`}>
                  {new Date(tx.expiration_time).toLocaleString()} UTC
                  {isExpired && (
                    <span className="ml-2 text-xs text-red-400">({ready ? t('transactions.expired') || 'Expired' : '已过期'})</span>
                  )}
                </span>
              </div>
            )}
             
            {/* 审批者信息 */}
            {tx.transaction_approvals && tx.transaction_approvals.length > 0 && (
              <div className="mt-2 pt-2 border-t border-primary-gray/30">
                <div className="text-primary-gray text-sm mb-1">{t('transactions.approvers') || 'Approvers'}:</div>
                <div className="flex flex-wrap gap-2">
                  {tx.transaction_approvals.map((approval, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded text-xs">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 font-mono">{approval.approved_by.slice(0, 6)}...{approval.approved_by.slice(-4)}</span>
                      <span className="text-primary-gray text-xs ml-1">
                        {new Date(approval.approved_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 未签名的所有者 */}
            {!isExecuted && unsignedOwners.length > 0 && (
              <div className="mt-2 pt-2 border-t border-primary-gray/30">
                <div className="text-primary-gray text-sm mb-1">
                  {t('transactions.missingConfirmations') || 'Missing Confirmations'}: {unsignedOwners.length}
                </div>
                <div className="flex flex-wrap gap-2">
                  {unsignedOwners.map((owner, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded text-xs">
                      <AlertCircle className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 font-mono">{owner.slice(0, 6)}...{owner.slice(-4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 执行信息 */}
            {isExecuted && tx.executed_at && (
              <div className="mt-2 pt-2 border-t border-primary-gray/30">
                <div className="flex items-center justify-between">
                  <span className="text-primary-gray text-sm">{t('transactions.executedBy') || 'Executed By'}:</span>
                  <span className="text-white font-mono text-sm">{tx.executed_by?.slice(0, 6)}...{tx.executed_by?.slice(-4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-gray text-sm">{t('transactions.executedAt') || 'Executed At'}:</span>
                  <span className="text-white text-sm">{new Date(tx.executed_at).toLocaleString()} UTC</span>
                </div>
                {tx.execution_transaction_hash && (
                  <div className="flex items-center justify-between">
                    <span className="text-primary-gray text-sm">{t('transactions.executionHash') || 'Execution Hash'}:</span>
                    <a
                      href={getExplorerUrl(tx.network, tx.execution_transaction_hash) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-light hover:text-white font-mono text-sm flex items-center gap-1"
                    >
                      {tx.execution_transaction_hash.slice(0, 6)}...{tx.execution_transaction_hash.slice(-4)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* 提交交易哈希 */}
            {tx.transaction_hash && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-primary-gray text-sm">{t('transactions.submissionHash') || 'Submission Hash'}:</span>
                  <a
                    href={getExplorerUrl(tx.network, tx.transaction_hash) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-light hover:text-white font-mono text-sm flex items-center gap-1"
                  >
                    {tx.transaction_hash.slice(0, 6)}...{tx.transaction_hash.slice(-4)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                {/* 撤销交易按钮 - 在 submission Hash 下面 */}
                {/* 所有审批人都可以看到撤销按钮，但只有已审批的人才能点击 */}
                {!isExecuted && !showActions && isOwner && onRevoke && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (!hasApproved) {
                          toast.error(ready ? t('transactions.revokeTransactionFailed') || 'You have not approved this transaction' : '您尚未审批此交易')
                          return
                        }
                        onRevoke(tx)
                      }}
                      disabled={!hasApproved}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold border text-sm ${
                        hasApproved
                          ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/30 cursor-pointer'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/30 cursor-not-allowed opacity-50'
                      }`}
                      title={hasApproved ? (ready ? t('transactions.revokeTransaction') : '撤销交易') : (ready ? 'You have not approved this transaction' : '您尚未审批此交易')}
                    >
                      <XCircle className="w-4 h-4" />
                      {ready ? t('transactions.revokeTransaction') : '撤销交易'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        {showActions && !isExecuted && (
          <div className="flex flex-col gap-2 lg:w-48">
            <button
              onClick={onApprove}
              className="flex items-center justify-center gap-2 py-2.5 bg-primary-light/10 text-primary-light rounded-lg hover:bg-primary-light/20 transition-all font-semibold border border-primary-light/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              {ready ? t('transactions.approve') : '审批'}
            </button>
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-semibold border border-red-500/30"
            >
              <XCircle className="w-4 h-4" />
              {ready ? t('transactions.cancel') : '取消'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
