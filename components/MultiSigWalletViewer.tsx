import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useChainId } from 'wagmi'
import { Wallet, Users, CheckCircle2, Clock, Send, FileText } from 'lucide-react'
import { getContractAddress } from '../lib/contracts'
import MultiSigWalletABI from '../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'

export function MultiSigWalletViewer() {
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  const [mounted, setMounted] = useState(false)
  const [walletInfo, setWalletInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [contractAddress, setContractAddress] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isConnected && chain && publicClient) {
      loadWalletInfo()
    } else if (mounted) {
      setLoading(false)
    }
  }, [mounted, isConnected, chain, publicClient])

  const loadWalletInfo = async () => {
    try {
      setLoading(true)
      
      // 根据当前网络获取合约地址
      const deployedAddr = getContractAddress(chainId)
      setContractAddress(deployedAddr || '')

      if (!deployedAddr || !publicClient) {
        setLoading(false)
        return
      }

      // 读取合约信息
      const owners = await publicClient.readContract({
        address: deployedAddr as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getOwners',
      })

      const required = await publicClient.readContract({
        address: deployedAddr as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'numConfirmationsRequired',
      })

      const txCount = await publicClient.readContract({
        address: deployedAddr as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getTransactionCount',
      })

      // 获取合约余额
      const balance = await publicClient.getBalance({
        address: deployedAddr as `0x${string}`,
      })

      setWalletInfo({
        owners: owners as string[],
        requiredConfirmations: Number(required),
        transactionCount: Number(txCount),
        balance: balance.toString(),
      })
    } catch (error) {
      console.error('加载钱包信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    const eth = Number(balance) / 1e18
    return eth.toFixed(4)
  }

  if (!mounted) {
    return (
      <div className="glass-effect rounded-2xl p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-light mx-auto mb-4"></div>
        <p className="text-primary-gray">加载中...</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="bg-primary-light/5 border border-primary-light/30 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-light/20 flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-10 h-10 text-primary-light" />
        </div>
        <p className="text-white text-xl font-semibold mb-2">未连接钱包</p>
        <p className="text-primary-gray">请先连接钱包查看多签钱包信息</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-light mx-auto mb-4"></div>
        <p className="text-primary-gray">加载钱包信息...</p>
      </div>
    )
  }

  if (!walletInfo) {
    return (
      <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-12 text-center">
        <p className="text-red-400 text-lg font-semibold">未找到已部署的多签钱包</p>
        <p className="text-primary-gray mt-2">请先部署一个多签钱包</p>
      </div>
    )
  }

  const isOwner = walletInfo.owners.some(
    (owner: string) => owner.toLowerCase() === address?.toLowerCase()
  )

  return (
    <div className="space-y-8">
      {/* 合约地址卡片 */}
      <div className="bg-gradient-to-r from-primary-light/10 to-primary-gray/10 border border-primary-light/30 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-primary-light/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary-light" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">多签钱包合约</h3>
            <p className="text-primary-gray text-sm">MultiSig Wallet Contract</p>
          </div>
        </div>
        <div className="bg-primary-black/50 rounded-xl p-4 border border-primary-light/20">
          <p className="text-sm text-primary-gray mb-2">合约地址 / Contract Address</p>
          <p className="text-white font-mono break-all text-sm">{contractAddress}</p>
        </div>
      </div>

      {/* 钱包信息网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 余额 */}
        <div className="glass-card rounded-2xl p-5 hover:border-primary-light/40 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-primary-gray font-medium">合约余额</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatBalance(walletInfo.balance)}
          </p>
          <p className="text-primary-gray text-sm mt-1">ETH</p>
        </div>

        {/* 所有者数量 */}
        <div className="glass-card rounded-2xl p-5 hover:border-primary-light/40 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-light" />
            </div>
            <p className="text-sm text-primary-gray font-medium">所有者</p>
          </div>
          <p className="text-3xl font-bold text-white">{walletInfo.owners.length}</p>
          <p className="text-primary-gray text-sm mt-1">Owners</p>
        </div>

        {/* 所需确认数 */}
        <div className="glass-card rounded-2xl p-5 hover:border-primary-light/40 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-gray/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-gray" />
            </div>
            <p className="text-sm text-primary-gray font-medium">所需确认</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {walletInfo.requiredConfirmations}
          </p>
          <p className="text-primary-gray text-sm mt-1">/ {walletInfo.owners.length} required</p>
        </div>

        {/* 交易数量 */}
        <div className="glass-card rounded-2xl p-5 hover:border-primary-light/40 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-primary-gray font-medium">总交易数</p>
          </div>
          <p className="text-3xl font-bold text-white">{walletInfo.transactionCount}</p>
          <p className="text-primary-gray text-sm mt-1">Transactions</p>
        </div>
      </div>

      {/* 所有者列表 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-light/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-light" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white">所有者列表</h4>
            <p className="text-primary-gray text-sm">Wallet Owners</p>
          </div>
        </div>
        <div className="space-y-3">
          {walletInfo.owners.map((owner: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between bg-primary-dark/50 rounded-xl p-4 hover:bg-primary-dark/70 transition-all border border-primary-light/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center">
                  <span className="text-primary-light font-bold text-sm">#{index + 1}</span>
                </div>
                <span className="text-white font-mono text-sm">{owner}</span>
              </div>
              {owner.toLowerCase() === address?.toLowerCase() && (
                <span className="px-4 py-1.5 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-lg text-sm font-semibold">
                  你
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 当前用户状态 */}
      <div
        className={`border rounded-2xl p-6 ${
          isOwner
            ? 'bg-green-500/5 border-green-500/30'
            : 'bg-yellow-500/5 border-yellow-500/30'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isOwner ? 'bg-green-500/20' : 'bg-yellow-500/20'
          }`}>
            {isOwner ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <Clock className="w-6 h-6 text-yellow-400" />
            )}
          </div>
          <div className="flex-1">
            {isOwner ? (
              <>
                <p className="text-green-400 font-bold text-lg mb-1">你是该钱包的所有者</p>
                <p className="text-green-300/80 text-sm">你可以提交、确认和执行多签交易</p>
              </>
            ) : (
              <>
                <p className="text-yellow-400 font-bold text-lg mb-1">你不是该钱包的所有者</p>
                <p className="text-yellow-300/80 text-sm">你只能查看钱包信息，无法执行操作</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 提示：使用交易管理功能 */}
      {isOwner && (
        <div className="bg-primary-light/5 border border-primary-light/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-light/20 flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-primary-light" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg mb-2">管理多签交易</p>
              <p className="text-primary-gray text-sm mb-4">
                前往"交易管理"标签页来提交新交易、确认待处理交易或执行已批准的交易
              </p>
              <div className="inline-flex items-center gap-2 text-primary-light text-sm font-medium">
                <span>切换到交易管理 →</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

