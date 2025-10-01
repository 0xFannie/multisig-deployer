import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, Eye, Plus } from 'lucide-react'
import { MultiSigDeployer } from '../components/MultiSigDeployer'
import { MultiSigWalletViewer } from '../components/MultiSigWalletViewer'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'deploy'>('view')
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>MultiSig Deployer</title>
        <meta name='description' content='企业多签钱包合约部署工具' />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">
              多签钱包管理工具
            </h1>
            <p className="text-xl text-blue-200">
              安全、可靠的企业级多签名钱包解决方案
            </p>
          </div>

          {/* Wallet Connection Bar */}
          <div className="max-w-6xl mx-auto mb-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-4 border border-white/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-blue-400" />
                <span className="text-white font-medium">钱包状态</span>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-4">
                  <span className="text-green-400 font-mono text-sm">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                  >
                    断开连接
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  连接钱包
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-6xl mx-auto mb-6">
            <div className="flex gap-2 bg-white/5 backdrop-blur-lg rounded-xl p-2 border border-white/20">
              <button
                onClick={() => setActiveTab('view')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition ${
                  activeTab === 'view'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Eye className="w-5 h-5" />
                查看已部署合约
              </button>
              <button
                onClick={() => setActiveTab('deploy')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition ${
                  activeTab === 'deploy'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Plus className="w-5 h-5" />
                部署新合约
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            {activeTab === 'view' ? (
              <MultiSigWalletViewer />
            ) : (
              <div className="space-y-6">
                <div className="border-b border-white/20 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">部署新的多签钱包</h2>
                  <p className="text-gray-400">配置并部署一个新的多签名钱包合约</p>
                </div>
                <MultiSigDeployer />
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="text-center mt-8 text-blue-200">
            <p className="text-sm">
              ⚠️ 注意：当前连接到本地测试网络 (Hardhat Local)
            </p>
            <p className="text-xs mt-2">
              合约地址: <code className="bg-white/10 px-2 py-1 rounded">0x5FbDB2315678afecb367f032d93F642f64180aa3</code>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
