import { useState, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi'
import { Plus, Trash2, AlertCircle, CheckCircle, Loader, Copy, ExternalLink, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'next-i18next'
import MultiSigWalletArtifact from '../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'
import { formatEther, parseEther } from 'viem'

export function MultiSigDeployer() {
  const { t } = useTranslation('common')
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  const [mounted, setMounted] = useState(false)
  const [owners, setOwners] = useState<string[]>([''])
  const [requiredConfirmations, setRequiredConfirmations] = useState<number>(1)
  const [confirmationPercentage, setConfirmationPercentage] = useState<number>(50) // 默认50%
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployedAddress, setDeployedAddress] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // 根据百分比计算所需确认人数
  useEffect(() => {
    const validOwnerCount = owners.filter(o => o.trim()).length
    if (validOwnerCount > 0) {
      const calculated = Math.ceil((confirmationPercentage / 100) * validOwnerCount)
      setRequiredConfirmations(Math.max(1, calculated))
    }
  }, [confirmationPercentage, owners])

  // 获取区块链浏览器 URL
  const getExplorerUrl = (address: string): string => {
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

  // 复制地址到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('deploy.addressCopied'), { icon: '📋' })
    } catch (error) {
      toast.error(t('deploy.copyFailed'))
    }
  }

  // 生成并复制分享链接
  const shareContract = async (addr: string) => {
    try {
      const shareUrl = `${window.location.origin}?contract=${addr}&chain=${chainId}&tab=transactions`
      await navigator.clipboard.writeText(shareUrl)
      toast.success(t('deploy.linkCopied'), { 
        icon: '🔗',
        duration: 5000
      })
    } catch (error) {
      toast.error(t('deploy.copyFailed'))
    }
  }

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
      toast.error(t('deploy.atLeastOneOwner'))
      return
    }

    const invalidOwners = validOwners.filter(o => !isValidAddress(o))
    if (invalidOwners.length > 0) {
      toast.error(t('deploy.invalidAddressFormat'))
      return
    }

    if (requiredConfirmations < 1 || requiredConfirmations > validOwners.length) {
      toast.error(t('deploy.confirmationsOutOfRange'))
      return
    }

    if (!isConnected || !address) {
      toast.error(t('deploy.pleaseConnectWallet'))
      return
    }

    // 等待客户端就绪
    if (!publicClient) {
      toast.error(t('deploy.networkNotReady'))
      return
    }

    if (!walletClient) {
      toast.error(t('deploy.walletInitializing'))
      return
    }

    setIsDeploying(true)
    const toastId = toast.loading(t('deploy.preparing'))

    // 在 try 块外部声明变量，以便在 catch 块中访问
    let balanceInEth = '0'
    let bytecode: `0x${string}` | undefined
    let gasEstimate: bigint | undefined

    try {
      // 获取合约的 bytecode 和 ABI
      bytecode = MultiSigWalletArtifact.bytecode as `0x${string}`
      const abi = MultiSigWalletArtifact.abi

      console.log('部署参数:', {
        owners: validOwners,
        requiredConfirmations,
        bytecodeLength: bytecode.length
      })

      toast.loading(t('deploy.waitingUser'), { id: toastId })

      // 检查账户余额
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      })
      balanceInEth = formatEther(balance)
      const nativeToken = chainId === 137 ? 'POL' : 'ETH'
      console.log('账户余额:', balance.toString(), 'wei', `(${balanceInEth} ${nativeToken})`)
      console.log('余额检查: 余额充足，可以继续部署')
      
      // 检查余额是否足够（至少需要 0.01 ETH/POL）
      const minBalance = parseEther('0.01')
      if (balance < minBalance) {
        throw new Error(`Insufficient balance. You have ${balanceInEth} ${nativeToken}, but need at least 0.01 ${nativeToken} for deployment.`)
      }

      // 验证 bytecode
      if (!bytecode || bytecode === '0x') {
        throw new Error('Invalid bytecode. Please rebuild the contract.')
      }

      // 验证参数
      if (validOwners.length === 0) {
        throw new Error('No valid owners provided')
      }
      if (requiredConfirmations < 1 || requiredConfirmations > validOwners.length) {
        throw new Error(`Invalid confirmation requirement: ${requiredConfirmations} (must be between 1 and ${validOwners.length})`)
      }

      console.log('准备部署合约，参数验证通过')

      // 尝试手动估算 gas（如果失败，让钱包自动估算）
      try {
        console.log('正在估算 Gas...')
        // 使用 encodeDeployData 准备部署数据
        const { encodeDeployData } = await import('viem')
        const deployData = encodeDeployData({
          abi,
          bytecode,
          args: [validOwners, BigInt(requiredConfirmations)],
        })
        console.log('部署数据已编码，长度:', deployData.length)
        
        // 估算 gas
        gasEstimate = await publicClient.estimateGas({
          account: address as `0x${string}`,
          data: deployData,
          to: undefined, // 部署合约时 to 为 undefined
        })
        console.log('Gas 估算成功:', gasEstimate.toString())
        // 增加 20% 的缓冲
        gasEstimate = (gasEstimate * 120n) / 100n
        console.log('Gas 估算（含缓冲）:', gasEstimate.toString())
      } catch (gasError: any) {
        console.warn('Gas 估算失败，将使用钱包自动估算:', gasError)
        console.warn('Gas 估算错误详情:', {
          message: gasError.message,
          code: gasError.code,
          name: gasError.name,
        })
        // 如果估算失败，继续使用钱包自动估算
      }

      // 部署合约
      const deployOptions: any = {
        abi,
        bytecode,
        args: [validOwners, BigInt(requiredConfirmations)],
        account: address as `0x${string}`,
      }
      
      // 如果成功估算 gas，使用估算值
      if (gasEstimate) {
        deployOptions.gas = gasEstimate
      }
      
      console.log('开始部署合约，选项:', {
        hasGas: !!deployOptions.gas,
        gas: deployOptions.gas?.toString(),
        ownersCount: validOwners.length,
        requiredConfirmations,
        bytecodeLength: bytecode.length,
        network: chainId,
        account: address,
      })

      console.log('调用 walletClient.deployContract...')
      const hash = await walletClient.deployContract(deployOptions)
      console.log('部署交易已提交，哈希:', hash)

      toast.loading(t('deploy.deployingTx'), { id: toastId })
      console.log('部署交易哈希:', hash)

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      console.log('部署收据:', receipt)

      if (receipt.contractAddress) {
        setDeployedAddress(receipt.contractAddress)
        
        // 保存到本地存储
        const saved = localStorage.getItem('multisig_contracts')
        const contracts = saved ? JSON.parse(saved) : []
        const newContract = {
          address: receipt.contractAddress,
          chainId,
          addedAt: Date.now()
        }
        contracts.unshift(newContract)
        localStorage.setItem('multisig_contracts', JSON.stringify(contracts.slice(0, 10)))
        
        // 触发自定义事件，通知其他组件更新
        window.dispatchEvent(new Event('contractsUpdated'))
        
        toast.success(
          `${t('deploy.deploymentSuccess')}\n${t('deploy.addressLabel')} ${receipt.contractAddress.slice(0, 6)}...${receipt.contractAddress.slice(-4)}`,
          { id: toastId, duration: 5000 }
        )

        console.log('✅ 合约部署成功:', {
          address: receipt.contractAddress,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        })
      } else {
        throw new Error(t('deploy.failedToGetAddress'))
      }
      
    } catch (error: any) {
      console.error('❌ 部署失败:', error)
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        name: error.name,
        shortMessage: error.shortMessage,
        cause: error.cause,
        data: error.data,
        stack: error.stack,
      })
      
      // 提取更详细的错误信息
      let errorMessage = t('deploy.deployFailed')
      let errorDetails = ''
      
      // 检查错误代码
      const errorCode = error.code || error.cause?.code
      
      if (error.message?.includes('User rejected') || errorCode === 4001) {
        errorMessage = t('deploy.userRejected')
      } else if (errorCode === -32003 || errorCode === '32003') {
        // RPC 节点拒绝交易（-32003）
        errorMessage = t('deploy.transactionCreationFailed') || 'Transaction creation failed. The RPC node rejected the transaction.'
        errorDetails = 'This usually means:\n1. Insufficient balance for gas fees\n2. Network congestion\n3. Invalid contract parameters\n\nPlease check your wallet balance and try again.'
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance') || error.message?.includes('Insufficient balance')) {
        errorMessage = t('deploy.insufficientFunds')
        if (error.message.includes('You have')) {
          errorDetails = error.message
        }
      } else if (error.shortMessage?.includes('Transaction creation failed') || error.message?.includes('Transaction creation failed')) {
        // 处理 viem 的 Transaction creation failed 错误
        const baseMessage = t('deploy.transactionCreationFailed')
        errorMessage = baseMessage || 'Transaction creation failed. Please check your wallet balance and network connection.'
        
        // 添加更多诊断信息
        if (error.cause) {
          const causeMessage = error.cause?.message || error.cause?.shortMessage || ''
          const causeCode = error.cause?.code
          if (causeCode === -32003 || causeCode === '32003') {
            errorDetails = 'RPC node rejected the transaction. This may be due to:\n- Insufficient balance\n- Network issues\n- Invalid parameters'
          } else if (causeMessage) {
            errorDetails = `Details: ${causeMessage}`
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage
      }
      
      // 显示错误消息
      if (errorDetails) {
        toast.error(`${errorMessage}\n${errorDetails}`, { id: toastId, duration: 10000 })
      } else {
        toast.error(errorMessage, { id: toastId, duration: 5000 })
      }
      
      // 在控制台输出详细的诊断信息
      const diagnosticInfo = {
        errorCode: error.code || error.cause?.code,
        errorName: error.name,
        network: chainId,
        networkName: chainId === 137 ? 'Polygon' : chainId === 1 ? 'Ethereum' : `Chain ${chainId}`,
        balance: balanceInEth,
        balanceWei: balanceInEth ? parseEther(balanceInEth).toString() : 'unknown',
        ownersCount: validOwners.length,
        requiredConfirmations,
        bytecodeLength: bytecode?.length || 0,
        hasGasEstimate: !!gasEstimate,
        gasEstimate: gasEstimate?.toString(),
        account: address,
        validOwners: validOwners,
      }
      console.error('部署失败诊断信息:', diagnosticInfo)
      console.error('完整错误对象:', error)
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
                {t('deploy.owners')}
              </label>
              <p className="text-primary-gray text-sm">
                {t('deploy.ownersCount', { count: owners.filter(o => o.trim()).length })}
              </p>
            </div>
            <button
              onClick={addOwner}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-light/10 text-primary-light rounded-xl hover:bg-primary-light/20 transition-all border border-primary-light/30 font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('deploy.addAddress')}
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
                  {t('deploy.useCurrent')}
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

        {/* Required Confirmations Slider */}
        <div>
          <label className="text-white font-semibold text-xl block mb-4">
            {t('deploy.requiredConfirmations')}
          </label>
          
          {/* Percentage Display */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary-light">{confirmationPercentage}%</span>
              <span className="text-primary-gray text-sm">{t('deploy.confirmationPercentage')}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{requiredConfirmations} / {owners.filter(o => o.trim()).length}</div>
              <div className="text-primary-gray text-xs">{t('deploy.requiredOwners')}</div>
            </div>
          </div>

          {/* Slider */}
          <div className="relative pt-6 pb-2">
            <input
              type="range"
              min="1"
              max="100"
              value={confirmationPercentage}
              onChange={(e) => setConfirmationPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-primary-gray/30 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, rgb(248, 227, 214) 0%, rgb(248, 227, 214) ${confirmationPercentage}%, rgb(120, 126, 145, 0.3) ${confirmationPercentage}%, rgb(120, 126, 145, 0.3) 100%)`
              }}
            />
            
            {/* Percentage Markers */}
            <div className="flex justify-between mt-2 px-1">
              {[25, 50, 75, 100].map((mark) => (
                <button
                  key={mark}
                  onClick={() => setConfirmationPercentage(mark)}
                  className={`text-xs font-medium transition-all ${
                    Math.abs(confirmationPercentage - mark) < 5
                      ? 'text-primary-light scale-110'
                      : 'text-primary-gray hover:text-white'
                  }`}
                >
                  {mark}%
                </button>
              ))}
            </div>
          </div>

          <p className="text-primary-gray text-sm mt-4 bg-primary-light/5 px-4 py-3 rounded-lg border border-primary-light/10">
            💡 {t('deploy.percentageTip', { percentage: confirmationPercentage, required: requiredConfirmations })}
            {confirmationPercentage === 100 && <span className="text-yellow-400">{t('deploy.percentage100')}</span>}
            {confirmationPercentage >= 67 && confirmationPercentage < 100 && <span className="text-green-400">{t('deploy.percentage67')}</span>}
            {confirmationPercentage === 50 && <span className="text-blue-400">{t('deploy.percentage50')}</span>}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-primary-light/5 border border-primary-light/30 rounded-2xl p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-light/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-primary-light" />
            </div>
            <div className="text-sm">
              <p className="font-semibold mb-3 text-white text-base">{t('deploy.deployInstructions')}</p>
              <ul className="space-y-2 text-primary-gray">
                <li className="flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  <span>{t('deploy.instruction1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  <span>{t('deploy.instruction2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  <span>{t('deploy.instruction3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  <span>{t('deploy.instruction4')}</span>
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
              {t('deploy.deploying')}
            </>
          ) : (
            <>
              <span>{t('deploy.deployWallet')}</span>
              <Plus className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Deployed Address */}
        {deployedAddress && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-green-400 font-semibold mb-3 text-lg">{t('deploy.deploySuccess')}</p>
                  <div className="bg-primary-black/50 rounded-lg p-3 border border-green-500/30">
                    <p className="text-white font-mono text-sm break-all">
                      {deployedAddress}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pl-14">
                <button
                  onClick={() => shareContract(deployedAddress)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all border border-green-500/30 hover:border-green-500/50 font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t('deploy.shareLink')}</span>
                </button>

                <button
                  onClick={() => copyToClipboard(deployedAddress)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-light/20 hover:bg-primary-light/30 text-primary-light rounded-lg transition-all border border-primary-light/30 hover:border-primary-light/50 font-medium"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t('deploy.copyAddress')}</span>
                </button>
                
                <button
                  onClick={() => window.open(getExplorerUrl(deployedAddress), '_blank', 'noopener,noreferrer')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all border border-blue-500/30 hover:border-blue-500/50 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{t('deploy.viewOnExplorer')}</span>
                </button>
              </div>
              
              {/* 使用提示 */}
              <div className="pl-14 pr-4">
                <div className="bg-primary-light/5 rounded-lg p-4 border border-primary-light/20">
                  <p className="text-sm text-primary-gray">
                    💡 <span className="text-white font-medium">{t('deploy.tip')}：</span>{t('deploy.shareTip')}
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
