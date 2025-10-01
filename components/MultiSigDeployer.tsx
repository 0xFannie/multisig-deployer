import { useState, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { Plus, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import MultiSigWalletArtifact from '../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'

export function MultiSigDeployer() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [mounted, setMounted] = useState(false)
  const [owners, setOwners] = useState<string[]>([''])
  const [requiredConfirmations, setRequiredConfirmations] = useState<number>(1)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployedAddress, setDeployedAddress] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // 添加所有者地址输入框
  const addOwner = () => {
    setOwners([...owners, ''])
  }

  // 删除所有者地址
  const removeOwner = (index: number) => {
    const newOwners = owners.filter((_, i) => i !== index)
    setOwners(newOwners.length > 0 ? newOwners : [''])
  }

  // 更新所有者地址
  const updateOwner = (index: number, value: string) => {
    const newOwners = [...owners]
    newOwners[index] = value
    setOwners(newOwners)
  }

  // 使用当前钱包地址
  const useCurrentAddress = (index: number) => {
    if (address) {
      updateOwner(index, address)
    }
  }

  // 验证地址格式
  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  }

  // 部署合约
  const deployContract = async () => {
    // 验证
    const validOwners = owners.filter(o => o.trim() !== '')
    
    if (validOwners.length === 0) {
      toast.error('请至少添加一个所有者地址')
      return
    }

    const invalidOwners = validOwners.filter(o => !isValidAddress(o))
    if (invalidOwners.length > 0) {
      toast.error('存在无效的地址格式')
      return
    }

    if (requiredConfirmations < 1 || requiredConfirmations > validOwners.length) {
      toast.error('所需确认数必须在 1 和所有者数量之间')
      return
    }

    if (!isConnected || !address) {
      toast.error('请先连接钱包')
      return
    }

    // 等待客户端就绪
    if (!publicClient) {
      toast.error('网络连接未就绪，请稍后重试')
      return
    }

    if (!walletClient) {
      toast.error('正在初始化钱包连接，请稍等片刻后重试')
      return
    }

    setIsDeploying(true)
    const toastId = toast.loading('正在准备部署合约...')

    try {
      // 获取合约的 bytecode 和 ABI
      const bytecode = MultiSigWalletArtifact.bytecode as `0x${string}`
      const abi = MultiSigWalletArtifact.abi

      console.log('部署参数:', {
        owners: validOwners,
        requiredConfirmations,
        bytecodeLength: bytecode.length
      })

      toast.loading('等待用户确认交易...', { id: toastId })

      // 部署合约
      const hash = await walletClient.deployContract({
        abi,
        bytecode,
        args: [validOwners, BigInt(requiredConfirmations)],
        account: address as `0x${string}`,
      })

      toast.loading('合约部署中，等待确认...', { id: toastId })
      console.log('部署交易哈希:', hash)

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      console.log('部署收据:', receipt)

      if (receipt.contractAddress) {
        setDeployedAddress(receipt.contractAddress)
        toast.success(
          `合约部署成功！\n地址: ${receipt.contractAddress.slice(0, 6)}...${receipt.contractAddress.slice(-4)}`,
          { id: toastId, duration: 5000 }
        )

        console.log('✅ 合约部署成功:', {
          address: receipt.contractAddress,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        })
      } else {
        throw new Error('未能获取合约地址')
      }
      
    } catch (error: any) {
      console.error('❌ 部署失败:', error)
      
      let errorMessage = '部署失败'
      
      if (error.message?.includes('User rejected')) {
        errorMessage = '用户取消了交易'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = '账户余额不足'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsDeploying(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <>
      {/* Owners Section */}
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-white font-medium text-lg">
              所有者地址 ({owners.filter(o => o.trim()).length})
            </label>
            <button
              onClick={addOwner}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition"
            >
              <Plus className="w-4 h-4" />
              添加地址
            </button>
          </div>

          <div className="space-y-3">
            {owners.map((owner, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => updateOwner(index, e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <button
                  onClick={() => useCurrentAddress(index)}
                  disabled={!isConnected}
                  className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  使用当前地址
                </button>
                {owners.length > 1 && (
                  <button
                    onClick={() => removeOwner(index)}
                    className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Required Confirmations */}
        <div>
          <label className="text-white font-medium text-lg block mb-3">
            所需确认数
          </label>
          <input
            type="number"
            min="1"
            max={owners.filter(o => o.trim()).length || 1}
            value={requiredConfirmations}
            onChange={(e) => setRequiredConfirmations(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-blue-300 text-sm mt-2">
            执行交易需要 {requiredConfirmations} / {owners.filter(o => o.trim()).length} 个所有者确认
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">部署说明：</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300">
                <li>确保所有所有者地址正确无误</li>
                <li>部署后无法修改所有者和确认数要求</li>
                <li>部署需要消耗 Gas 费用</li>
                <li>建议先在测试网测试</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deploy Button */}
        <button
          onClick={deployContract}
          disabled={isDeploying || !isConnected}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isDeploying ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              部署中...
            </>
          ) : (
            '部署多签钱包'
          )}
        </button>

        {/* Deployed Address */}
        {deployedAddress && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-400 font-medium mb-2">部署成功！</p>
                <p className="text-white font-mono text-sm break-all">
                  {deployedAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <p className="text-sm text-green-200">
          ✅ <strong>部署功能已启用</strong>：你现在可以直接在前端部署多签钱包合约。
        </p>
        <p className="text-xs text-green-300 mt-2">
          或者使用命令行: <code className="bg-black/30 px-2 py-1 rounded">npx hardhat run scripts/deploy.js --network localhost</code>
        </p>
      </div>
    </>
  )
}
