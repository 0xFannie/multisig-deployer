import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useChainId, useWalletClient } from 'wagmi'
import { useTranslation } from 'next-i18next'
import { X, Send, Wallet, AlertCircle, Mail, CheckCircle2, ChevronDown, User, Loader, Search, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import MultiSigWalletABI from '../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'
import { parseEther, formatEther, formatUnits, parseUnits, erc20Abi, encodeFunctionData } from 'viem'
import { SUPPORTED_NETWORKS } from './DeployedContractsList'
import { getTokenAddress } from '../lib/tokenAddresses'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  contractAddress?: string  // 可选，如果为空则显示合约选择界面
  contractChainId?: number  // 可选
  contractInfo?: {  // 可选，如果为空则需要先选择合约
    balance: string
    usdtBalance: string
    usdcBalance: string
    usdcNativeBalance?: string
    owners: string[]
    requiredConfirmations: number
  }
}

interface AssetOption {
  type: 'native' | 'usdt' | 'usdc' | 'usdcNative'
  name: string
  balance: string
  decimals: number
  address?: string
}

interface OwnerApproval {
  address: string
  email?: string
  selected: boolean
}

export function TransferModal({
  isOpen,
  onClose,
  contractAddress: initialContractAddress,
  contractChainId: initialContractChainId,
  contractInfo: initialContractInfo,
}: TransferModalProps) {
  const { t } = useTranslation('common')
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  // 合约选择相关状态（当没有预填充合约时使用）
  const [selectedContract, setSelectedContract] = useState<{ address: string; chainId: number } | null>(
    initialContractAddress && initialContractChainId 
      ? { address: initialContractAddress, chainId: initialContractChainId }
      : null
  )
  const [inputAddress, setInputAddress] = useState('')
  const [selectedChainId, setSelectedChainId] = useState(initialContractChainId || chainId)
  const [savedContracts, setSavedContracts] = useState<Array<{ address: string; chainId: number; name?: string }>>([])
  const [loadingContractInfo, setLoadingContractInfo] = useState(false)

  // 当前使用的合约地址和信息
  const [contractAddress, setContractAddress] = useState<string | undefined>(initialContractAddress)
  const [contractChainId, setContractChainId] = useState<number | undefined>(initialContractChainId)
  const [contractInfo, setContractInfo] = useState(initialContractInfo)

  const [recipient, setRecipient] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<'native' | 'usdt' | 'usdc' | 'usdcNative'>('native')
  const [amount, setAmount] = useState('')
  const [expirationDays, setExpirationDays] = useState<number | null>(null) // null 表示不设置过期时间
  const [ownerApprovals, setOwnerApprovals] = useState<OwnerApproval[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [balanceCheck, setBalanceCheck] = useState<{ sufficient: boolean; message: string } | null>(null)
  const [whitelist, setWhitelist] = useState<Array<{ recipient_address: string; label: string | null }>>([])
  const [showWhitelistDropdown, setShowWhitelistDropdown] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showContractSelector, setShowContractSelector] = useState(false)
  const [deployedContracts, setDeployedContracts] = useState<Array<{ contract_address: string; network: string; tags: string | null }>>([])
  const [loadingDeployedContracts, setLoadingDeployedContracts] = useState(false)

  // 加载用户ID和白名单
  useEffect(() => {
    if (isOpen && address) {
      const savedUserId = localStorage.getItem('multisig_user_id')
      if (savedUserId) {
        setUserId(savedUserId)
        loadWhitelist(savedUserId)
      }
    }
  }, [isOpen, address])

  // 初始化 owner approvals 并加载邮箱
  useEffect(() => {
    if (contractInfo?.owners && isOpen) {
      setOwnerApprovals(
        contractInfo.owners.map(owner => ({
          address: owner,
          email: '',
          selected: false,
        }))
      )
      loadOwnerEmails(contractInfo.owners)
    }
  }, [contractInfo?.owners, isOpen])

  // 加载owner邮箱
  const loadOwnerEmails = async (owners: string[]) => {
    try {
      const response = await fetch('/api/users/get-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddresses: owners }),
      })
      const data = await response.json()
      if (data.success && data.emails) {
        setOwnerApprovals(prev => {
          const updated = prev.map(owner => ({
            ...owner, // 保留 selected 状态
            email: data.emails[owner.address.toLowerCase()] || owner.email || '',
          }))
          console.log('Owner emails loaded, updated approvals:', updated)
          return updated
        })
      }
    } catch (error) {
      console.error('Failed to load owner emails:', error)
    }
  }

  // 加载白名单
  const loadWhitelist = async (uid: string) => {
    try {
      const response = await fetch(`/api/whitelist/list?userId=${uid}`)
      const data = await response.json()
      if (data.success) {
        setWhitelist(data.whitelist || [])
      }
    } catch (error) {
      console.error('Failed to load whitelist:', error)
    }
  }

  // 加载保存的合约列表（当没有预填充合约时）
  useEffect(() => {
    if (isOpen && !initialContractAddress) {
      const saved = localStorage.getItem('multisig_contracts')
      if (saved) {
        try {
          setSavedContracts(JSON.parse(saved))
        } catch (error) {
          console.error('Failed to load saved contracts:', error)
        }
      }
      setSelectedChainId(chainId)
    }
  }, [isOpen, chainId, initialContractAddress])

  // 从数据库加载用户部署的合约列表
  const loadDeployedContracts = async () => {
    if (!userId) return
    
    setLoadingDeployedContracts(true)
    try {
      const response = await fetch(`/api/deployments/list?userId=${userId}`)
      const data = await response.json()
      if (data.success && data.deployments) {
        setDeployedContracts(data.deployments)
      }
    } catch (error) {
      console.error('Failed to load deployed contracts:', error)
    } finally {
      setLoadingDeployedContracts(false)
    }
  }

  // 当打开合约选择弹窗时，加载数据库中的合约列表
  useEffect(() => {
    if (showContractSelector && userId) {
      loadDeployedContracts()
    }
  }, [showContractSelector, userId])

  // 将网络名称映射到 chainId
  const getChainIdFromNetwork = (network: string): number | null => {
    // 尝试直接匹配网络名称
    const networkMap: Record<string, number> = {
      'Ethereum': 1,
      'Polygon': 137,
      'BNB Chain': 56,
      'BSC': 56,
      'Arbitrum One': 42161,
      'Optimism': 10,
      'Base': 8453,
      'Avalanche': 43114,
      'Linea': 59144,
      'zkSync Era': 324,
      'Scroll': 534352,
      'Sepolia': 11155111,
      'Goerli': 5,
    }
    
    // 先尝试直接匹配
    if (networkMap[network]) {
      return networkMap[network]
    }
    
    // 尝试从 SUPPORTED_NETWORKS 中查找
    const found = SUPPORTED_NETWORKS.find(n => n.name === network)
    if (found) {
      return found.id
    }
    
    return null
  }

  // 加载合约信息（当选择了合约但还没有contractInfo时）
  const loadContractInfo = async (addr: string, cid: number) => {
    if (!publicClient) return

    setLoadingContractInfo(true)
    try {
      // 检查网络是否匹配
      if (chainId !== cid) {
        const network = SUPPORTED_NETWORKS.find(n => n.id === cid)
        const networkName = network?.name || `Chain ${cid}`
        toast.error(t('deployedContracts.switchNetworkForTransfer')?.replace('{{network}}', networkName) || `Please switch to ${networkName}`)
        setLoadingContractInfo(false)
        return
      }

      const owners = await publicClient.readContract({
        address: addr as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getOwners',
      }) as string[]

      const requiredConfirmations = await publicClient.readContract({
        address: addr as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'numConfirmationsRequired',
      }) as bigint

      const balance = await publicClient.getBalance({
        address: addr as `0x${string}`,
      })

      setContractInfo({
        balance: balance.toString(),
        usdtBalance: '0',
        usdcBalance: '0',
        owners: owners,
        requiredConfirmations: Number(requiredConfirmations),
      })
      setContractAddress(addr)
      setContractChainId(cid)
    } catch (error) {
      console.error('Failed to load contract info:', error)
      toast.error(t('transactions.loadFailed') || 'Failed to load contract information')
    } finally {
      setLoadingContractInfo(false)
    }
  }

  // 处理合约选择确认
  const handleContractSelect = () => {
    if (selectedContract) {
      loadContractInfo(selectedContract.address, selectedContract.chainId)
    } else if (inputAddress && /^0x[a-fA-F0-9]{40}$/.test(inputAddress)) {
      loadContractInfo(inputAddress, selectedChainId)
    } else {
      toast.error(t('transactions.invalidAddress') || 'Invalid contract address')
    }
  }

  // 获取资产选项（根据网络显示所有支持的资产）
  const getAssetOptions = (): AssetOption[] => {
    if (!contractInfo || !contractChainId) return []
    
    const network = SUPPORTED_NETWORKS.find(n => n.id === contractChainId)
    const nativeTokenName = contractChainId === 137 ? 'POL (previously MATIC)' : 
                           contractChainId === 1 ? 'ETH' :
                           contractChainId === 56 ? 'BNB' :
                           contractChainId === 43114 ? 'AVAX' :
                           contractChainId === 250 ? 'FTM' : 'ETH'

    const options: AssetOption[] = [
      {
        type: 'native',
        name: nativeTokenName,
        balance: contractInfo.balance,
        decimals: 18,
      },
    ]

    // 添加 USDT（如果该网络支持 USDT，不依赖余额）
    const usdtAddress = getTokenAddressLocal(contractChainId, 'usdt')
    if (usdtAddress) {
      options.push({
        type: 'usdt',
        name: 'USDT',
        balance: contractInfo.usdtBalance || '0',
        decimals: 6,
        address: usdtAddress,
      })
    }

    // 添加 USDC.e (bridged) 或 USDC（如果该网络支持，不依赖余额）
    const usdcAddress = getTokenAddressLocal(contractChainId, 'usdc')
    if (usdcAddress) {
      // 判断是 USDC.e 还是 USDC
      const isUSDCE = contractChainId === 137 || contractChainId === 42161 || contractChainId === 10
      const label = isUSDCE ? 'USDC.e' : 'USDC'
      
      options.push({
        type: 'usdc',
        name: label,
        balance: contractInfo.usdcBalance || '0',
        decimals: 6,
        address: usdcAddress,
      })
    }

    // 添加 USDC Native（如果该网络支持，不依赖余额）
    const usdcNativeAddress = getTokenAddressLocal(contractChainId, 'usdcNative')
    if (usdcNativeAddress) {
      options.push({
        type: 'usdcNative',
        name: 'USDC (Native)',
        balance: contractInfo.usdcNativeBalance || '0',
        decimals: 6,
        address: usdcNativeAddress,
      })
    }

    return options
  }

  // 使用统一的代币地址配置
  const getTokenAddressLocal = (chainId: number, token: 'usdt' | 'usdc' | 'usdcNative'): string | undefined => {
    const address = getTokenAddress(chainId, token)
    return address || undefined
  }

  // 实时校验余额
  useEffect(() => {
    if (!amount || !selectedAsset || !publicClient || chainId !== contractChainId) {
      setBalanceCheck(null)
      return
    }

    const checkBalance = async () => {
      try {
        const assetOptions = getAssetOptions()
        const selectedAssetOption = assetOptions.find(a => a.type === selectedAsset)
        if (!selectedAssetOption) return

        const amountWei = parseFloat(amount)
        if (isNaN(amountWei) || amountWei <= 0) {
          setBalanceCheck(null)
          return
        }

        const amountInWei = BigInt(Math.floor(amountWei * 10 ** selectedAssetOption.decimals))
        const balance = BigInt(selectedAssetOption.balance)

        if (amountInWei > balance) {
          setBalanceCheck({
            sufficient: false,
            message: t('transfer.insufficientBalance'),
          })
        } else {
          setBalanceCheck({
            sufficient: true,
            message: '',
          })
        }
      } catch (error) {
        console.error('Balance check error:', error)
        setBalanceCheck(null)
      }
    }

    checkBalance()
  }, [amount, selectedAsset, contractInfo, contractChainId, chainId, publicClient])

  // 切换 owner 选择
  const toggleOwnerSelection = (index: number) => {
    setOwnerApprovals(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        selected: !updated[index].selected
      }
      return updated
    })
  }

  // 更新 owner email
  const updateOwnerEmail = (index: number, email: string) => {
    setOwnerApprovals(prev => {
      const updated = [...prev]
      updated[index].email = email
      return updated
    })
  }

  // 发送邮件提醒
  const sendEmailReminder = async (owner: OwnerApproval, transactionDetails: {
    recipient: string
    asset: string
    amount: string
    expiryDate: string
  }) => {
    if (!owner.email || !owner.email.includes('@')) {
      toast.error(t('transfer.invalidEmail'))
      return false
    }

    try {
      // 使用 mailto 链接发送邮件（客户端方式）
      const subject = encodeURIComponent(t('transfer.emailSubject'))
      const body = encodeURIComponent(
        t('transfer.emailBody', {
          initiator: address?.slice(0, 6) + '...' + address?.slice(-4),
          recipient: transactionDetails.recipient.slice(0, 6) + '...' + transactionDetails.recipient.slice(-4),
          asset: transactionDetails.asset,
          amount: transactionDetails.amount,
          expiryDate: transactionDetails.expiryDate,
          contractAddress: contractAddress ? contractAddress.slice(0, 6) + '...' + contractAddress.slice(-4) : '',
        })
      )
      window.location.href = `mailto:${owner.email}?subject=${subject}&body=${body}`
      
      toast.success(t('transfer.emailSent', { email: owner.email }))
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      toast.error(t('transfer.emailFailed'))
      return false
    }
  }

  // 提交交易
  const handleSubmit = async () => {
    // 验证输入
    if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      toast.error(t('view.invalidAddress'))
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t('transfer.invalidAmount'))
      return
    }

    if (!balanceCheck?.sufficient) {
      toast.error(t('transfer.insufficientBalance'))
      return
    }

    // 验证是否选择了足够的审核者
    const selectedOwnersCount = ownerApprovals.filter(o => o.selected).length
    if (!contractInfo) {
      toast.error(t('transactions.selectContractFirst') || 'Please select a contract wallet first')
      return
    }
    
    if (selectedOwnersCount < contractInfo.requiredConfirmations) {
      toast.error(
        t('transfer.insufficientOwners')?.replace('{{selected}}', selectedOwnersCount.toString())
          .replace('{{required}}', contractInfo.requiredConfirmations.toString()) ||
        `Please select at least ${contractInfo.requiredConfirmations} owners for confirmation (currently ${selectedOwnersCount} selected)`
      )
      return
    }

    if (!walletClient || !address) {
      toast.error(t('transfer.walletNotConnected'))
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(t('transfer.submitting') || 'Submitting transaction...')

    try {
      const assetOptions = getAssetOptions()
      const selectedAssetOption = assetOptions.find(a => a.type === selectedAsset)
      if (!selectedAssetOption) {
        throw new Error('Invalid asset selected')
      }

      // 准备交易数据
      const value = selectedAsset === 'native'
        ? parseEther(amount)
        : BigInt(0)
      
      const data = selectedAsset === 'native'
        ? '0x'
        : encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [recipient as `0x${string}`, parseUnits(amount, selectedAssetOption.decimals)],
          })

      // 计算过期时间（如果设置了）
      let expirationTime = 0n // 0 表示永不过期
      if (expirationDays !== null && expirationDays > 0) {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + expirationDays)
        expirationTime = BigInt(Math.floor(expirationDate.getTime() / 1000)) // 转换为 Unix 时间戳（秒）
      }

      // 调用合约的 submitTransaction
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'submitTransaction',
        args: [
          selectedAsset === 'native' ? '0x0000000000000000000000000000000000000000' : (selectedAssetOption.address as `0x${string}`),
          value,
          data as `0x${string}`,
          expirationTime,
        ],
        account: address as `0x${string}`,
      })

      // 注意：网络名称需要与部署时保存的格式一致（首字母大写，如 "Polygon"）
      const networkName = SUPPORTED_NETWORKS.find(n => n.id === contractChainId)?.name || 'Ethereum'
      
      // 在提交交易前获取当前交易数量，提交后交易索引就是这个数量
      let txIndex = 0
      if (userId) {
        try {
          const txCountBefore = await publicClient!.readContract({
            address: contractAddress as `0x${string}`,
            abi: MultiSigWalletABI.abi,
            functionName: 'getTransactionCount',
          })
          txIndex = Number(txCountBefore) // 提交后的索引就是当前数量
          console.log('Transaction count before submit:', txCountBefore, 'txIndex will be:', txIndex)
        } catch (error) {
          console.error('Failed to get transaction count before submit:', error)
        }
      }

      // 等待交易确认
      await publicClient!.waitForTransactionReceipt({ hash })

      // 验证交易索引（提交后再次查询确认）
      if (userId) {
        try {
          const txCountAfter = await publicClient!.readContract({
            address: contractAddress as `0x${string}`,
            abi: MultiSigWalletABI.abi,
            functionName: 'getTransactionCount',
          })
          const expectedIndex = Number(txCountAfter) - 1
          if (txIndex !== expectedIndex) {
            console.warn(`Transaction index mismatch: expected ${expectedIndex}, got ${txIndex}. Using ${expectedIndex}`)
            txIndex = expectedIndex
          }
          console.log('Transaction count after submit:', txCountAfter, 'confirmed txIndex:', txIndex)
        } catch (error) {
          console.error('Failed to verify transaction count after submit:', error)
        }
      }
      
      // 记录交易到数据库
      if (userId) {
        try {
          // 提交交易记录
          const submitResponse = await fetch('/api/transactions/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              contractAddress,
              network: networkName,
              txIndex,
              to: recipient,
              value: amount,
              assetType: selectedAsset,
              assetAddress: selectedAsset === 'native' ? null : selectedAssetOption.address,
              submittedBy: address,
              transactionHash: hash,
              expirationTime: expirationDays !== null && expirationDays > 0 
                ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
                : null,
            }),
          })

          const submitData = await submitResponse.json()
          
          if (!submitResponse.ok || !submitData.success) {
            console.error('Failed to record transaction:', submitData)
            toast.error(t('transfer.recordFailed') || 'Transaction submitted but failed to record in database', { id: toastId })
            // 不阻止成功消息，因为链上交易已经成功
          } else {
            console.log('Transaction recorded successfully:', submitData.transaction)
            
            // 发送审批通知邮件（只发送给被勾选的审批者）
            if (submitData.transaction?.id) {
              try {
                // 获取被勾选的审批者地址列表
                const selectedApprovers = ownerApprovals
                  .filter(owner => owner.selected)
                  .map(owner => owner.address)
                
                console.log('Sending approval notifications to selected approvers:', selectedApprovers)
                
                const notificationResponse = await fetch('/api/transactions/send-approval-notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    transactionId: submitData.transaction.id,
                    contractAddress,
                    network: networkName,
                    approverAddresses: selectedApprovers, // 只发送给被勾选的审批者
                  }),
                })
                
                const notificationData = await notificationResponse.json()
                if (!notificationResponse.ok || !notificationData.success) {
                  console.error('Failed to send approval notifications:', notificationData)
                  // 不阻止成功消息
                } else {
                  console.log('Approval notifications sent successfully')
                }
              } catch (notificationError) {
                console.error('Error sending approval notifications:', notificationError)
                // 不阻止成功消息
              }
            }
            
            // 触发自定义事件，通知其他组件刷新数据（仅在成功记录到数据库后）
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('transactionSubmitted'))
            }
          }
        } catch (apiError: any) {
          console.error('Failed to record transaction:', apiError)
          console.error('Error details:', {
            message: apiError?.message,
            stack: apiError?.stack
          })
          toast.error(t('transfer.recordFailed') || 'Transaction submitted but failed to record in database', { id: toastId })
          // 不阻止成功消息，因为链上交易已经成功
        }
      } else {
        console.warn('User ID not available, skipping database record')
      }

      toast.success(t('transfer.submitted') || 'Transaction submitted successfully', { id: toastId })
      
      // 关闭弹窗并重置表单
      handleClose()
    } catch (error: any) {
      console.error('Failed to submit transaction:', error)
      toast.error(error.message || t('transfer.submitFailed') || 'Failed to submit transaction', { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 关闭弹窗
  const handleClose = () => {
    setRecipient('')
    setAmount('')
    setSelectedAsset('native')
    setExpirationDays(null)
    if (contractInfo?.owners) {
      setOwnerApprovals(
        contractInfo.owners.map(owner => ({
          address: owner,
          email: '',
          selected: false,
        }))
      )
    }
    setBalanceCheck(null)
    // 重置合约选择状态（如果不是预填充的）
    if (!initialContractAddress) {
      setSelectedContract(null)
      setInputAddress('')
      setContractAddress(undefined)
      setContractChainId(undefined)
      setContractInfo(undefined)
    }
    onClose()
  }


  if (!isOpen) return null

  // 有合约信息，显示转账表单
  const assetOptions = getAssetOptions()
  const selectedAssetOption = assetOptions.find(a => a.type === selectedAsset)
  const formatBalance = (balance: string, decimals: number) => {
    const amount = Number(balance) / 10 ** decimals
    if (amount === 0) return '0.0000'
    if (amount < 0.0001) return '<0.0001'
    return decimals === 18 ? amount.toFixed(4) : amount.toFixed(2)
  }

  const network = contractChainId ? SUPPORTED_NETWORKS.find(n => n.id === contractChainId) : null
  const networkName = network?.name || (contractChainId ? `Chain ${contractChainId}` : '')

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 ${showContractSelector ? 'backdrop-blur-md' : ''}`}>
      <div className={`glass-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 transition-all duration-300 ${showContractSelector ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100 blur-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-light/20">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('transfer.title')}</h2>
            <p className="text-primary-gray text-sm mt-1">{t('transfer.subtitle')}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-primary-light/20 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-primary-gray hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 合约钱包信息 - 可点击选择 */}
          <div 
            onClick={() => !contractAddress && setShowContractSelector(true)}
            className={`glass-card rounded-xl p-4 ${!contractAddress ? 'cursor-pointer hover:bg-primary-light/10 transition-all border-2 border-dashed border-primary-light/30' : ''}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-primary-light" />
              <p className="text-xs text-primary-gray">{t('transfer.fromContract')}</p>
            </div>
            {contractAddress ? (
              <div className="space-y-1">
                <p className="text-white font-semibold">{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</p>
                <p className="text-primary-gray text-sm">{networkName}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowContractSelector(true)
                  }}
                  className="w-full px-4 py-3 bg-primary-dark/50 border border-primary-light/30 rounded-lg text-primary-light hover:border-primary-light/50 hover:text-white transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('transactions.selectOrInputContract') || 'Select or Input MultiSig Wallet Address'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 收款人地址 */}
          <div>
            <label className="block text-white font-semibold mb-2">
              {t('transfer.recipientAddress')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-primary-dark border border-primary-light/30 rounded-lg text-white placeholder-primary-gray focus:outline-none focus:border-primary-light font-mono text-sm pr-10"
              />
              {whitelist.length > 0 && (
                <button
                  onClick={() => setShowWhitelistDropdown(!showWhitelistDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-primary-light/20 rounded"
                >
                  <ChevronDown className={`w-4 h-4 text-primary-gray transition-transform ${showWhitelistDropdown ? 'rotate-180' : ''}`} />
                </button>
              )}
              {showWhitelistDropdown && whitelist.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-primary-dark border border-primary-light/30 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {whitelist.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setRecipient(item.recipient_address)
                        setShowWhitelistDropdown(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-primary-light/10 transition-all border-b border-primary-gray/10 last:border-b-0"
                    >
                      <p className="text-white font-mono text-sm">{item.recipient_address}</p>
                      {item.label && (
                        <p className="text-primary-gray text-xs mt-1">{item.label}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 资产选择 */}
          {contractInfo ? (
            <div>
              <label className="block text-white font-semibold mb-2">
                {t('transfer.assetAndAmount')}
              </label>
              <div className="space-y-3">
              {/* 资产类型下拉选择 */}
              <div className="relative">
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value as 'native' | 'usdt' | 'usdc' | 'usdcNative')}
                  className="w-full px-4 py-3 bg-primary-dark border border-primary-light/30 rounded-lg text-white focus:outline-none focus:border-primary-light appearance-none cursor-pointer pr-10"
                >
                  {assetOptions.map((asset) => (
                    <option key={asset.type} value={asset.type} className="bg-primary-dark">
                      {asset.name} ({formatBalance(asset.balance, asset.decimals)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-gray pointer-events-none" />
              </div>

              {/* 金额输入 */}
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.0001"
                min="0"
                className="w-full px-4 py-3 bg-primary-dark border border-primary-light/30 rounded-lg text-white placeholder-primary-gray focus:outline-none focus:border-primary-light"
              />

              {/* 余额校验提示 */}
              {balanceCheck && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    balanceCheck.sufficient
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  {balanceCheck.sufficient ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={`text-sm ${
                      balanceCheck.sufficient ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {balanceCheck.sufficient
                      ? t('transfer.balanceSufficient')
                      : balanceCheck.message}
                  </span>
                </div>
              )}

              {/* 过期时间设置 */}
              <div className="space-y-2">
                <label className="block text-white font-medium mb-2">
                  {t('transfer.expirationTime') || 'Expiration Time'} <span className="text-primary-gray text-sm font-normal">({t('transfer.optional') || 'Optional'})</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setExpirationDays(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      expirationDays === null
                        ? 'bg-primary-light text-black border-2 border-primary-light'
                        : 'bg-primary-dark text-primary-gray border border-primary-light/30 hover:border-primary-light/50'
                    }`}
                  >
                    {t('transfer.noExpiration') || 'No Expiration'}
                  </button>
                  {[7, 14, 21, 28].map((days) => {
                    const expirationDate = new Date()
                    expirationDate.setDate(expirationDate.getDate() + days)
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setExpirationDays(days)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          expirationDays === days
                            ? 'bg-primary-light text-black border-2 border-primary-light'
                            : 'bg-primary-dark text-white border border-primary-light/30 hover:border-primary-light/50'
                        }`}
                        title={t('transfer.expiresOnDate') ? t('transfer.expiresOnDate', { date: expirationDate.toLocaleDateString() }) : `Expires on ${expirationDate.toLocaleDateString()}`}
                      >
                        {days} {t('transfer.days') || 'Days'}
                      </button>
                    )
                  })}
                </div>
                {expirationDays !== null && expirationDays > 0 && (
                  <p className="text-primary-gray text-xs mt-1">
                    {t('transfer.expiresOnDate') ? t('transfer.expiresOnDate', { date: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString() }) : `Expires on ${new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-primary-gray">{t('transactions.selectContractFirst') || 'Please select a contract wallet first'}</p>
            </div>
          )}

          {/* Owner 选择 */}
          {contractInfo ? (
            <div>
              <label className="block text-white font-semibold mb-2">
                {t('transfer.selectOwnersForApproval')}
              </label>
              <p className="text-primary-gray text-sm mb-3">
                {t('transfer.requiredConfirmations', { required: contractInfo.requiredConfirmations })}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {ownerApprovals.map((owner, idx) => (
                <div
                  key={`owner-card-${owner.address}-${idx}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleOwnerSelection(idx)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                  }}
                  className={`
                    glass-card rounded-lg p-4 transition-all relative cursor-pointer select-none
                    ${owner.selected 
                      ? 'border-2 border-primary-light bg-primary-light/10 shadow-lg shadow-primary-light/20' 
                      : 'border border-primary-light/20 hover:border-primary-light/40 hover:bg-primary-light/5'
                    }
                  `}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  {/* 选中状态的右上角 √ */}
                  {owner.selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary-light rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-primary-black font-bold" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-mono text-sm break-all">{owner.address}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {owner.address.toLowerCase() === address?.toLowerCase() && (
                            <span className="text-xs text-primary-gray bg-primary-light/20 px-2 py-0.5 rounded">
                              ({t('view.you')})
                            </span>
                          )}
                          {owner.email && (
                            <div className="flex items-center gap-1 text-primary-gray">
                              <Mail className="w-3 h-3" />
                              <span className="text-xs">{owner.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 选中时显示邮箱信息 */}
                    {owner.selected && owner.email && (
                      <div className="mt-2 pt-2 border-t border-primary-light/20">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary-gray flex-shrink-0" />
                          <span className="text-xs text-primary-gray truncate">{owner.email}</span>
                        </div>
                        <p className="text-xs text-primary-gray mt-1">
                          {t('transfer.emailForReminder')} ({t('transfer.optional')})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
              <p className="text-primary-gray text-xs mt-3 text-center">
                {t('transfer.selectedOwners', {
                  count: ownerApprovals.filter(o => o.selected).length,
                  required: contractInfo.requiredConfirmations,
                })}
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-primary-gray">{t('transactions.selectContractFirst') || 'Please select a contract wallet first'}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-light/20">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-primary-dark border border-primary-light/30 text-white rounded-lg hover:bg-primary-light/10 transition-all font-medium"
          >
            {t('transfer.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !balanceCheck?.sufficient}
            className="px-6 py-3 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? t('transfer.submitting') : t('transfer.submitTransferRequest') || 'Submit Transfer Request'}
          </button>
        </div>
      </div>

      {/* 合约选择弹窗 */}
      {showContractSelector && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowContractSelector(false)
            }
          }}
        >
          <div 
            className="glass-card rounded-2xl shadow-2xl w-full max-w-lg m-4 border border-primary-light/20 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-primary-light/20">
              <h3 className="text-xl font-bold text-white">{t('transactions.selectOrInputContract') || 'Select or Input MultiSig Wallet Address'}</h3>
              <button
                onClick={() => setShowContractSelector(false)}
                className="p-2 hover:bg-primary-light/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-primary-gray hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* 从数据库加载的合约列表 */}
              {deployedContracts.length > 0 && (
                <div>
                  <label className="block text-white font-semibold mb-3">
                    {t('transactions.savedContracts') || 'Saved Contracts'}
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {loadingDeployedContracts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 text-primary-light animate-spin" />
                      </div>
                    ) : (
                      deployedContracts.map((contract, idx) => {
                        const contractChainId = getChainIdFromNetwork(contract.network)
                        const network = contractChainId ? SUPPORTED_NETWORKS.find(n => n.id === contractChainId) : null
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (contractChainId) {
                                setSelectedContract({ address: contract.contract_address, chainId: contractChainId })
                                setInputAddress('')
                              }
                            }}
                            className={`w-full px-4 py-3 text-left rounded-lg border transition-all ${
                              selectedContract?.address === contract.contract_address
                                ? 'bg-primary-light border-primary-light text-black'
                                : 'bg-primary-dark/50 border-primary-light/30 text-primary-gray hover:border-primary-light/50 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-mono text-sm truncate">{contract.contract_address}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {network && (
                                    <span className="text-xs text-primary-gray">{network.name}</span>
                                  )}
                                  {contract.tags && (
                                    <span className="text-xs text-primary-light">{contract.tags}</span>
                                  )}
                                </div>
                              </div>
                              {selectedContract?.address === contract.contract_address && (
                                <CheckCircle2 className="w-5 h-5 text-primary-light flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* 手动输入地址 */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  {t('transactions.orInputAddress') || 'Or Input Contract Address'}
                </label>
                <div className="space-y-3">
                  <select
                    value={selectedChainId}
                    onChange={(e) => setSelectedChainId(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-primary-dark border border-primary-light/30 rounded-lg text-white focus:outline-none focus:border-primary-light appearance-none cursor-pointer"
                  >
                    {SUPPORTED_NETWORKS.map((network) => (
                      <option key={network.id} value={network.id} className="bg-primary-dark">
                        {network.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={inputAddress}
                    onChange={(e) => {
                      setInputAddress(e.target.value)
                      setSelectedContract(null)
                    }}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-primary-dark border border-primary-light/30 rounded-lg text-white placeholder-primary-gray focus:outline-none focus:border-primary-light font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-light/20">
              <button
                onClick={() => {
                  setShowContractSelector(false)
                  setSelectedContract(null)
                  setInputAddress('')
                }}
                className="px-6 py-3 bg-primary-dark border border-primary-light/30 text-white rounded-lg hover:bg-primary-light/10 transition-all font-medium"
              >
                {t('transfer.cancel')}
              </button>
              <button
                onClick={() => {
                  handleContractSelect()
                  setShowContractSelector(false)
                }}
                disabled={!selectedContract && !inputAddress}
                className="px-6 py-3 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {t('transactions.continue') || 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

