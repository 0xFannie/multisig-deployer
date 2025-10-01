import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { Wallet, Users, CheckCircle2, Clock, Send, FileText } from 'lucide-react'
import { DEPLOYED_CONTRACTS } from '../lib/contracts'
import MultiSigWalletABI from '../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'

export function MultiSigWalletViewer() {
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()

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
      
      // 获取已部署的合约地址
      const deployedAddr = DEPLOYED_CONTRACTS.localhost.MultiSigWallet
      setContractAddress(deployedAddr)

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
      <div className="bg-white/5 border border-white/20 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">加载中...</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
        <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <p className="text-yellow-200 text-lg">请先连接钱包查看多签钱包信息</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/20 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">加载中...</p>
      </div>
    )
  }

  if (!walletInfo) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-200">未找到已部署的多签钱包</p>
      </div>
    )
  }

  const isOwner = walletInfo.owners.some(
    (owner: string) => owner.toLowerCase() === address?.toLowerCase()
  )

  return (
    <div className="space-y-6">
      {/* 合约地址卡片 */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">多签钱包合约</h3>
        </div>
        <div className="bg-black/30 rounded-lg p-4">
          <p className="text-sm text-blue-300 mb-1">合约地址</p>
          <p className="text-white font-mono break-all">{contractAddress}</p>
        </div>
      </div>

      {/* 钱包信息网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 余额 */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-green-400" />
            <p className="text-sm text-gray-400">合约余额</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatBalance(walletInfo.balance)} ETH
          </p>
        </div>

        {/* 所有者数量 */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-gray-400">所有者</p>
          </div>
          <p className="text-2xl font-bold text-white">{walletInfo.owners.length}</p>
        </div>

        {/* 所需确认数 */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-gray-400">所需确认</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {walletInfo.requiredConfirmations} / {walletInfo.owners.length}
          </p>
        </div>

        {/* 交易数量 */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <p className="text-sm text-gray-400">总交易数</p>
          </div>
          <p className="text-2xl font-bold text-white">{walletInfo.transactionCount}</p>
        </div>
      </div>

      {/* 所有者列表 */}
      <div className="bg-white/5 border border-white/20 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          所有者列表
        </h4>
        <div className="space-y-2">
          {walletInfo.owners.map((owner: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between bg-black/30 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono">#{index + 1}</span>
                <span className="text-white font-mono">{owner}</span>
              </div>
              {owner.toLowerCase() === address?.toLowerCase() && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  你
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 当前用户状态 */}
      <div
        className={`border rounded-lg p-4 ${
          isOwner
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {isOwner ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">你是该钱包的所有者</p>
                <p className="text-green-300 text-sm">你可以提交、确认和执行交易</p>
              </div>
            </>
          ) : (
            <>
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-semibold">你不是该钱包的所有者</p>
                <p className="text-yellow-300 text-sm">你只能查看钱包信息，无法执行操作</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 操作按钮（如果是所有者） */}
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            <Send className="w-5 h-5" />
            提交交易
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
            <CheckCircle2 className="w-5 h-5" />
            确认交易
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg hover:green-blue-600 transition">
            <FileText className="w-5 h-5" />
            查看交易
          </button>
        </div>
      )}
    </div>
  )
}

