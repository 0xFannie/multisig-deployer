import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, Eye, Plus, Send } from 'lucide-react'
import { MultiSigDeployer } from '../components/MultiSigDeployer'
import { MultiSigWalletViewer } from '../components/MultiSigWalletViewer'
import { TransactionManager } from '../components/TransactionManager'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'deploy' | 'transactions'>('view')
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    setMounted(true)
  }, [])

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
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
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
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-lg bg-primary-light/10 border border-primary-light/30">
                      <span className="text-primary-light font-mono text-sm">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>
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

          {/* Footer Info */}
          <div className="text-center mt-12">
            <div className="inline-block glass-effect rounded-xl px-6 py-3">
              <p className="text-sm text-primary-gray">
                ⚠️ 当前连接: <span className="text-primary-light font-semibold">本地测试网络</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
