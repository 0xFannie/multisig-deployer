import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { Wallet, Eye, Plus, Send, ChevronDown, Check } from 'lucide-react'
import { MultiSigDeployer } from '../components/MultiSigDeployer'
import { MultiSigWalletViewer } from '../components/MultiSigWalletViewer'
import { TransactionManager } from '../components/TransactionManager'
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

// 支持的网络配置
const SUPPORTED_NETWORKS = [
  // Layer 1 主网
  { id: mainnet.id, name: 'Ethereum', icon: '⟠', color: 'text-blue-400', type: 'mainnet' },
  { id: polygon.id, name: 'Polygon', icon: '⬣', color: 'text-purple-400', type: 'mainnet' },
  { id: bsc.id, name: 'BNB Chain', icon: '◆', color: 'text-yellow-400', type: 'mainnet' },
  { id: avalanche.id, name: 'Avalanche', icon: '▲', color: 'text-red-400', type: 'mainnet' },
  { id: fantom.id, name: 'Fantom', icon: '◈', color: 'text-blue-300', type: 'mainnet' },
  
  // Layer 2
  { id: arbitrum.id, name: 'Arbitrum One', icon: '◉', color: 'text-blue-500', type: 'layer2' },
  { id: optimism.id, name: 'Optimism', icon: '●', color: 'text-red-500', type: 'layer2' },
  { id: base.id, name: 'Base', icon: '🔵', color: 'text-blue-600', type: 'layer2' },
  
  // zkEVM
  { id: zkSync.id, name: 'zkSync Era', icon: '⚡', color: 'text-purple-500', type: 'zk' },
  { id: scroll.id, name: 'Scroll', icon: '📜', color: 'text-orange-400', type: 'zk' },
  { id: polygonZkEvm.id, name: 'Polygon zkEVM', icon: '⬢', color: 'text-purple-600', type: 'zk' },
  { id: linea.id, name: 'Linea', icon: '▰', color: 'text-cyan-400', type: 'zk' },
  
  // 测试网
  { id: sepolia.id, name: 'Sepolia', icon: '🧪', color: 'text-green-400', type: 'testnet' },
  { id: goerli.id, name: 'Goerli', icon: '🧪', color: 'text-green-500', type: 'testnet' },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'deploy' | 'transactions'>('view')
  const [showNetworkMenu, setShowNetworkMenu] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // 获取当前网络信息
  const getCurrentNetwork = () => {
    return SUPPORTED_NETWORKS.find(net => net.id === chainId) || {
      id: chainId,
      name: '未知网络',
      icon: '?',
      color: 'text-gray-400'
    }
  }

  // 切换网络
  const handleSwitchNetwork = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId })
      setShowNetworkMenu(false)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // 点击外部关闭网络菜单
  useEffect(() => {
    const handleClickOutside = () => setShowNetworkMenu(false)
    if (showNetworkMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showNetworkMenu])

  if (!mounted) {
    return (
      <>
        <Head>
          <title>MultiSig Deployer</title>
          <meta name='description' content='企业多签钱包合约部署工具' />
        </Head>
        <div className="min-h-screen bg-primary-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-light"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>MultiSig Deployer - 多签钱包管理工具</title>
        <meta name='description' content='企业多签钱包合约部署工具' />
      </Head>
      
      <div className="min-h-screen bg-primary-black relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-light/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-gray/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary-light via-white to-primary-gray bg-clip-text text-transparent">
                MultiSig Wallet
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-3">
              多签钱包管理工具
            </h1>
            <p className="text-lg text-primary-gray max-w-2xl mx-auto">
              安全、可靠的企业级多签名钱包解决方案
            </p>
          </div>

          {/* Wallet Connection Bar */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="glass-card rounded-2xl shadow-2xl p-5 transition-all hover:shadow-primary-light/10">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-light/20 to-primary-gray/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary-light" />
                  </div>
                  <div>
                    <span className="text-white font-semibold block">钱包连接</span>
                    <span className="text-primary-gray text-sm">Wallet Connection</span>
                  </div>
                </div>
                {isConnected ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    {/* Network Selector */}
                    <div className="relative z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowNetworkMenu(!showNetworkMenu)
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-gray/20 border border-primary-gray/30 hover:border-primary-light/50 transition-all group"
                      >
                        <span className={`text-xl ${getCurrentNetwork().color}`}>
                          {getCurrentNetwork().icon}
                        </span>
                        <span className="text-white font-medium text-sm">
                          {getCurrentNetwork().name}
                        </span>
                        <ChevronDown className="w-4 h-4 text-primary-gray group-hover:text-primary-light transition-colors" />
                      </button>
                      
                      {/* Network Dropdown */}
                      {showNetworkMenu && (
                        <div className="absolute top-full mt-2 right-0 w-56 glass-card rounded-xl p-2 shadow-2xl border border-primary-light/20 max-h-96 overflow-y-auto">
                          {/* Layer 1 Mainnets */}
                          <div className="px-2 py-1.5 text-xs text-primary-gray font-semibold">Layer 1 主网</div>
                          {SUPPORTED_NETWORKS.filter(n => n.type === 'mainnet').map((network) => (
                            <button
                              key={network.id}
                              onClick={() => handleSwitchNetwork(network.id)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all ${
                                chainId === network.id
                                  ? 'bg-primary-light/20 border border-primary-light/30'
                                  : 'hover:bg-primary-gray/20'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-lg ${network.color}`}>{network.icon}</span>
                                <span className="text-white text-sm font-medium">{network.name}</span>
                              </div>
                              {chainId === network.id && (
                                <Check className="w-4 h-4 text-primary-light" />
                              )}
                            </button>
                          ))}
                          
                          {/* Layer 2 */}
                          <div className="px-2 py-1.5 text-xs text-primary-gray font-semibold mt-2">Layer 2</div>
                          {SUPPORTED_NETWORKS.filter(n => n.type === 'layer2').map((network) => (
                            <button
                              key={network.id}
                              onClick={() => handleSwitchNetwork(network.id)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all ${
                                chainId === network.id
                                  ? 'bg-primary-light/20 border border-primary-light/30'
                                  : 'hover:bg-primary-gray/20'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-lg ${network.color}`}>{network.icon}</span>
                                <span className="text-white text-sm font-medium">{network.name}</span>
                              </div>
                              {chainId === network.id && (
                                <Check className="w-4 h-4 text-primary-light" />
                              )}
                            </button>
                          ))}
                          
                          {/* zkEVM */}
                          <div className="px-2 py-1.5 text-xs text-primary-gray font-semibold mt-2">zkEVM</div>
                          {SUPPORTED_NETWORKS.filter(n => n.type === 'zk').map((network) => (
                            <button
                              key={network.id}
                              onClick={() => handleSwitchNetwork(network.id)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all ${
                                chainId === network.id
                                  ? 'bg-primary-light/20 border border-primary-light/30'
                                  : 'hover:bg-primary-gray/20'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-lg ${network.color}`}>{network.icon}</span>
                                <span className="text-white text-sm font-medium">{network.name}</span>
                              </div>
                              {chainId === network.id && (
                                <Check className="w-4 h-4 text-primary-light" />
                              )}
                            </button>
                          ))}
                          
                          {/* Testnets */}
                          <div className="px-2 py-1.5 text-xs text-primary-gray font-semibold mt-2 border-t border-primary-gray/20 pt-2">测试网</div>
                          {SUPPORTED_NETWORKS.filter(n => n.type === 'testnet').map((network) => (
                            <button
                              key={network.id}
                              onClick={() => handleSwitchNetwork(network.id)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all ${
                                chainId === network.id
                                  ? 'bg-primary-light/20 border border-primary-light/30'
                                  : 'hover:bg-primary-gray/20'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-lg ${network.color}`}>{network.icon}</span>
                                <span className="text-white text-sm font-medium">{network.name}</span>
                              </div>
                              {chainId === network.id && (
                                <Check className="w-4 h-4 text-primary-light" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Wallet Address */}
                    <div className="px-4 py-2.5 rounded-lg bg-primary-light/10 border border-primary-light/30">
                      <span className="text-primary-light font-mono text-sm">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>

                    {/* Disconnect Button */}
                    <button
                      onClick={() => disconnect()}
                      className="px-5 py-2.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all font-medium border border-red-500/30 hover:border-red-500/50"
                    >
                      断开
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => connect({ connector: connectors[0] })}
                    className="px-8 py-3 bg-gradient-to-r from-primary-light to-primary-gray text-primary-black rounded-xl hover:shadow-lg hover:shadow-primary-light/20 transition-all font-semibold"
                  >
                    连接钱包
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="glass-effect rounded-2xl p-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('view')}
                  className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all ${
                    activeTab === 'view'
                      ? 'bg-gradient-to-r from-primary-light to-primary-gray text-primary-black shadow-lg'
                      : 'text-primary-gray hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Eye className="w-5 h-5" />
                  <span>查看合约</span>
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all ${
                    activeTab === 'transactions'
                      ? 'bg-gradient-to-r from-primary-light to-primary-gray text-primary-black shadow-lg'
                      : 'text-primary-gray hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Send className="w-5 h-5" />
                  <span>交易管理</span>
                </button>
                <button
                  onClick={() => setActiveTab('deploy')}
                  className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all ${
                    activeTab === 'deploy'
                      ? 'bg-gradient-to-r from-primary-light to-primary-gray text-primary-black shadow-lg'
                      : 'text-primary-gray hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>部署新合约</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto glass-card rounded-3xl shadow-2xl p-8 md:p-10">
            {activeTab === 'view' ? (
              <MultiSigWalletViewer />
            ) : activeTab === 'transactions' ? (
              <TransactionManager />
            ) : (
              <div className="space-y-6">
                <div className="border-b border-primary-light/20 pb-6 mb-8">
                  <h2 className="text-3xl font-bold text-white mb-3">部署新的多签钱包</h2>
                  <p className="text-primary-gray text-lg">配置并部署一个新的多签名钱包合约</p>
                </div>
                <MultiSigDeployer />
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
