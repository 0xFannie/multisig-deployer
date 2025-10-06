import { useState, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi'
import { Send, CheckCircle2, XCircle, PlayCircle, Clock, ArrowRight, Loader, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getContractAddress } from '../lib/contracts'
import MultiSigWalletABI from '../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'
import { parseEther, formatEther } from 'viem'

interface Transaction {
  to: string
  value: bigint
  data: string
  executed: boolean
  numConfirmations: bigint
}

interface SavedContract {
  address: string
  chainId: number
  addedAt: number
}

interface TransactionManagerProps {
  initialContract?: string
}

export function TransactionManager({ initialContract }: TransactionManagerProps = {}) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  const [mounted, setMounted] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [requiredConfirmations, setRequiredConfirmations] = useState(0)
  const [contractAddress, setContractAddress] = useState<`0x${string}` | undefined>(undefined)
  const [inputAddress, setInputAddress] = useState<string>('')
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([])
  
  // 提交新交易的表单
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 加载保存的合约列表
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('multisig_contracts')
    if (saved) {
      try {
        setSavedContracts(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load saved contracts:', error)
      }
    }
  }, [])

  // 如果有 URL 传入的合约地址，自动加载
  useEffect(() => {
    if (initialContract && mounted && isConnected && publicClient) {
      setInputAddress(initialContract)
      loadWallet(initialContract)
    }
  }, [initialContract, mounted, isConnected, publicClient])

  // 尝试加载最近使用的合约
  useEffect(() => {
    if (mounted && chainId && !initialContract) {
      const recentContract = savedContracts.find(c => c.chainId === chainId)
      if (recentContract && !inputAddress) {
        setInputAddress(recentContract.address)
      }
    }
  }, [mounted, chainId, savedContracts, initialContract])

  useEffect(() => {
    if (mounted && isConnected && publicClient && contractAddress) {
      loadData()
    }
  }, [mounted, isConnected, publicClient, contractAddress])

  const loadWallet = async (targetAddress?: string) => {
    try {
      setLoading(true)
      const addressToLoad = targetAddress || inputAddress
      
      if (!addressToLoad || !publicClient) {
        setLoading(false)
        return
      }

      // 验证地址格式
      if (!/^0x[a-fA-F0-9]{40}$/.test(addressToLoad)) {
        toast.error('无效的合约地址格式')
        setLoading(false)
        return
      }

      setContractAddress(addressToLoad as `0x${string}`)
      await loadData(addressToLoad as `0x${string}`)
      toast.success('合约加载成功！')
    } catch (error) {
      console.error('Failed to load wallet:', error)
      toast.error('加载合约失败')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async (addr?: `0x${string}`) => {
    try {
      setLoading(true)
      const targetAddr = addr || contractAddress

      if (!targetAddr) {
        setLoading(false)
        return
      }

      // 检查是否为所有者
      const ownerStatus = await publicClient!.readContract({
        address: targetAddr,
        abi: MultiSigWalletABI.abi,
        functionName: 'isOwner',
        args: [address],
      })
      setIsOwner(ownerStatus as boolean)

      // 获取所需确认数
      const required = await publicClient!.readContract({
        address: targetAddr,
        abi: MultiSigWalletABI.abi,
        functionName: 'numConfirmationsRequired',
      })
      setRequiredConfirmations(Number(required))

      // 获取交易数量
      const txCount = await publicClient!.readContract({
        address: targetAddr,
        abi: MultiSigWalletABI.abi,
        functionName: 'getTransactionCount',
      })

      // 获取所有交易
      const txList: Transaction[] = []
      for (let i = 0; i < Number(txCount); i++) {
        const tx = await publicClient!.readContract({
          address: targetAddr,
          abi: MultiSigWalletABI.abi,
          functionName: 'getTransaction',
          args: [BigInt(i)],
        }) as [string, bigint, string, boolean, bigint]

        txList.push({
          to: tx[0],
          value: tx[1],
          data: tx[2],
          executed: tx[3],
          numConfirmations: tx[4],
        })
      }

      setTransactions(txList)
    } catch (error) {
      console.error('加载交易失败:', error)
      toast.error('加载交易列表失败')
    } finally {
      setLoading(false)
    }
  }

  const submitTransaction = async () => {
    if (!recipient || !amount) {
      toast.error('请填写完整的转账信息')
      return
    }

    if (!walletClient) {
      toast.error('钱包未连接')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('提交交易中...')

    try {
      const value = parseEther(amount)
      
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'submitTransaction',
        args: [recipient, value, '0x'],
        account: address as `0x${string}`,
      })

      toast.loading('等待确认...', { id: toastId })
      
      await publicClient!.waitForTransactionReceipt({ hash })

      toast.success('交易提交成功！', { id: toastId })
      setRecipient('')
      setAmount('')
      setShowSubmitForm(false)
      await loadData()
    } catch (error: any) {
      console.error('提交交易失败:', error)
      toast.error(error.message || '提交交易失败', { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmTransaction = async (txIndex: number) => {
    if (!walletClient) return

    const toastId = toast.loading('确认交易中...')
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'confirmTransaction',
        args: [BigInt(txIndex)],
        account: address as `0x${string}`,
      })

      await publicClient!.waitForTransactionReceipt({ hash })
      toast.success('交易确认成功！', { id: toastId })
      await loadData()
    } catch (error: any) {
      console.error('确认交易失败:', error)
      toast.error(error.message || '确认交易失败', { id: toastId })
    }
  }

  const revokeConfirmation = async (txIndex: number) => {
    if (!walletClient) return

    const toastId = toast.loading('撤销确认中...')
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'revokeConfirmation',
        args: [BigInt(txIndex)],
        account: address as `0x${string}`,
      })

      await publicClient!.waitForTransactionReceipt({ hash })
      toast.success('确认已撤销！', { id: toastId })
      await loadData()
    } catch (error: any) {
      console.error('撤销确认失败:', error)
      toast.error(error.message || '撤销确认失败', { id: toastId })
    }
  }

  const executeTransaction = async (txIndex: number) => {
    if (!walletClient) return

    const toastId = toast.loading('执行交易中...')
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'executeTransaction',
        args: [BigInt(txIndex)],
        account: address as `0x${string}`,
      })

      await publicClient!.waitForTransactionReceipt({ hash })
      toast.success('交易执行成功！', { id: toastId })
      await loadData()
    } catch (error: any) {
      console.error('执行交易失败:', error)
      toast.error(error.message || '执行交易失败', { id: toastId })
    }
  }

  const checkIsConfirmed = async (txIndex: number): Promise<boolean> => {
    try {
      if (!contractAddress) return false
      
      const confirmed = await publicClient!.readContract({
        address: contractAddress as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'isConfirmed',
        args: [BigInt(txIndex), address],
      })
      return confirmed as boolean
    } catch {
      return false
    }
  }

  if (!mounted) {
    return <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto text-primary-light" /></div>
  }

  if (!isConnected) {
    return (
      <div className="bg-primary-light/5 border border-primary-light/30 rounded-2xl p-12 text-center">
        <p className="text-primary-gray">请先连接钱包</p>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-2xl p-12 text-center">
        <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <p className="text-yellow-400 font-semibold text-lg">你不是该钱包的所有者</p>
        <p className="text-primary-gray mt-2">只有钱包所有者可以管理交易</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto text-primary-light" /></div>
  }

  const pendingTransactions = transactions.filter(tx => !tx.executed)
  const executedTransactions = transactions.filter(tx => tx.executed)

  return (
    <div className="space-y-8">
      {/* 提交新交易按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">交易管理</h3>
          <p className="text-primary-gray mt-1">提交、确认和执行多签交易</p>
        </div>
        <button
          onClick={() => setShowSubmitForm(!showSubmitForm)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-xl hover:shadow-lg hover:shadow-primary-light/20 transition-all font-semibold"
        >
          <Send className="w-5 h-5" />
          提交新交易
        </button>
      </div>

      {/* 提交交易表单 */}
      {showSubmitForm && (
        <div className="glass-card rounded-2xl p-6 border-primary-light/30">
          <h4 className="text-xl font-bold text-white mb-6">提交新的转账交易</h4>
          <div className="space-y-4">
            <div>
              <label className="text-white font-medium block mb-2">接收地址</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-5 py-4 bg-primary-dark/50 border border-primary-light/20 rounded-xl text-white placeholder-primary-gray focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-white font-medium block mb-2">转账金额 (ETH)</label>
              <input
                type="number"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-5 py-4 bg-primary-dark/50 border border-primary-light/20 rounded-xl text-white placeholder-primary-gray focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={submitTransaction}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? '提交中...' : '提交交易'}
              </button>
              <button
                onClick={() => setShowSubmitForm(false)}
                className="px-6 py-3 bg-primary-gray/20 text-primary-gray rounded-xl hover:bg-primary-gray/30 transition-all font-medium"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 待处理交易 */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-primary-light" />
          <h4 className="text-xl font-bold text-white">待处理交易 ({pendingTransactions.length})</h4>
        </div>
        
        {pendingTransactions.length === 0 ? (
          <div className="glass-effect rounded-2xl p-8 text-center">
            <p className="text-primary-gray">暂无待处理交易</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTransactions.map((tx, index) => (
              <TransactionCard
                key={index}
                tx={tx}
                txIndex={transactions.indexOf(tx)}
                requiredConfirmations={requiredConfirmations}
                onConfirm={confirmTransaction}
                onRevoke={revokeConfirmation}
                onExecute={executeTransaction}
                checkIsConfirmed={checkIsConfirmed}
                address={address!}
              />
            ))}
          </div>
        )}
      </div>

      {/* 已完成交易 */}
      {executedTransactions.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <h4 className="text-xl font-bold text-white">已完成交易 ({executedTransactions.length})</h4>
          </div>
          
          <div className="space-y-4">
            {executedTransactions.map((tx, index) => (
              <div key={index} className="glass-card rounded-2xl p-6 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-white font-semibold">交易 #{transactions.indexOf(tx)}</span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">已执行</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-gray text-sm font-mono">
                      <span>{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-primary-light font-semibold">{formatEther(tx.value)} ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 交易卡片组件
function TransactionCard({ 
  tx, 
  txIndex, 
  requiredConfirmations, 
  onConfirm, 
  onRevoke, 
  onExecute,
  checkIsConfirmed,
  address
}: { 
  tx: Transaction
  txIndex: number
  requiredConfirmations: number
  onConfirm: (index: number) => void
  onRevoke: (index: number) => void
  onExecute: (index: number) => void
  checkIsConfirmed: (index: number) => Promise<boolean>
  address: string
}) {
  const [isConfirmedByMe, setIsConfirmedByMe] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const confirmed = await checkIsConfirmed(txIndex)
      setIsConfirmedByMe(confirmed)
      setLoading(false)
    }
    check()
  }, [txIndex])

  const canExecute = Number(tx.numConfirmations) >= requiredConfirmations

  return (
    <div className="glass-card rounded-2xl p-6 border-primary-light/30 hover:border-primary-light/50 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-light/20 flex items-center justify-center">
              <span className="text-primary-light font-bold">#{txIndex}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-lg">转账交易</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  canExecute 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {canExecute ? '可执行' : '待确认'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-primary-gray text-sm">确认进度:</span>
                <span className="text-primary-light font-semibold">
                  {Number(tx.numConfirmations)} / {requiredConfirmations}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary-dark/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-primary-gray text-sm">接收地址:</span>
              <span className="text-white font-mono text-sm">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-gray text-sm">转账金额:</span>
              <span className="text-primary-light font-bold">{formatEther(tx.value)} ETH</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:w-48">
          {!loading && (
            <>
              {!isConfirmedByMe ? (
                <button
                  onClick={() => onConfirm(txIndex)}
                  className="flex items-center justify-center gap-2 py-3 bg-primary-light/10 text-primary-light rounded-xl hover:bg-primary-light/20 transition-all font-semibold border border-primary-light/30"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  确认
                </button>
              ) : (
                <button
                  onClick={() => onRevoke(txIndex)}
                  className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all font-semibold border border-red-500/30"
                >
                  <XCircle className="w-5 h-5" />
                  撤销确认
                </button>
              )}
              
              {canExecute && (
                <button
                  onClick={() => onExecute(txIndex)}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/20 transition-all font-bold"
                >
                  <PlayCircle className="w-5 h-5" />
                  执行交易
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

