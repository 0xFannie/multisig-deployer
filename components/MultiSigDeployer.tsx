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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-light"></div>
      </div>
    )
  }

  return (
    <>
      {/* Owners Section */}
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <label className="text-white font-semibold text-xl block mb-1">
                所有者地址
              </label>
              <p className="text-primary-gray text-sm">
                已添加 <span className="text-primary-light font-semibold">{owners.filter(o => o.trim()).length}</span> 个所有者
              </p>
            </div>
            <button
              onClick={addOwner}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-light/10 text-primary-light rounded-xl hover:bg-primary-light/20 transition-all border border-primary-light/30 font-medium"
            >
              <Plus className="w-5 h-5" />
              添加地址
            </button>
          </div>

          <div className="space-y-3">
            {owners.map((owner, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => updateOwner(index, e.target.value)}
                    placeholder="0x..."
                    className="w-full px-5 py-4 bg-primary-dark/50 border border-primary-light/20 rounded-xl text-white placeholder-primary-gray focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 font-mono text-sm transition-all"
                  />
                </div>
                <button
                  onClick={() => useCurrentAddress(index)}
                  disabled={!isConnected}
                  className="px-5 py-4 bg-primary-gray/20 text-primary-gray rounded-xl hover:bg-primary-gray/30 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap font-medium border border-primary-gray/30"
                >
                  使用当前
                </button>
                {owners.length > 1 && (
                  <button
                    onClick={() => removeOwner(index)}
                    className="px-4 py-4 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/30"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Required Confirmations */}
        <div>
          <label className="text-white font-semibold text-xl block mb-4">
            所需确认数
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={owners.filter(o => o.trim()).length || 1}
              value={requiredConfirmations}
              onChange={(e) => setRequiredConfirmations(parseInt(e.target.value) || 1)}
              className="w-full px-5 py-4 bg-primary-dark/50 border border-primary-light/20 rounded-xl text-white focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 text-lg font-semibold"
            />
          </div>
          <p className="text-primary-gray text-sm mt-3 bg-primary-light/5 px-4 py-2 rounded-lg inline-block">
            执行交易需要 <span className="text-primary-light font-semibold">{requiredConfirmations}</span> / <span className="text-white font-semibold">{owners.filter(o => o.trim()).length}</span> 个所有者确认
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-primary-light/5 border border-primary-light/30 rounded-2xl p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-light/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-primary-light" />
            </div>
            <div className="text-sm">
              <p className="font-semibold mb-3 text-white text-base">部署说明</p>
              <ul className="space-y-2 text-primary-gray">
                <li className="flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  <span>确保所有所有者地址正确无误</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  <span>部署后无法修改所有者和确认数要求</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  <span>部署需要消耗 Gas 费用</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  <span>建议先在测试网测试</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deploy Button */}
        <button
          onClick={deployContract}
          disabled={isDeploying || !isConnected}
          className="w-full py-5 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-primary-light/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          {isDeploying ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              部署中...
            </>
          ) : (
            <>
              <span>部署多签钱包</span>
              <Plus className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Deployed Address */}
        {deployedAddress && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-green-400 font-semibold mb-3 text-lg">部署成功！</p>
                <div className="bg-primary-black/50 rounded-lg p-3 border border-green-500/30">
                  <p className="text-white font-mono text-sm break-all">
                    {deployedAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
