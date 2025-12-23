import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import dynamic from 'next/dynamic'
import { Eye, Plus, Send, Shield, Users, Lock, Settings, Zap } from 'lucide-react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

// 动态导入 ConnectButton，禁用 SSR 以避免服务器端模块兼容性问题
const ConnectButton = dynamic(
  async () => {
    const { ConnectButton: Button } = await import('@rainbow-me/rainbowkit')
    return { default: Button }
  },
  { ssr: false }
)

// Add LanguageSwitcher to the header
import { MultiSigDeployer } from '../components/MultiSigDeployer'
import { TransactionManager } from '../components/TransactionManager'
import { DeployedContractsList } from '../components/DeployedContractsList'
import { UserSettings } from '../components/UserSettings'
import MultisigWorkflow from '../components/MultisigWorkflow'

export default function Home() {
  const { t, ready } = useTranslation('common')
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'deploy' | 'transactions' | 'settings'>('view')
  const [urlContract, setUrlContract] = useState<string>('')
  const [selectedContract, setSelectedContract] = useState<{ address: string; chainId: number } | null>(null)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    setMounted(true)
  }, [])


  // 从 URL 参数获取合约地址
  useEffect(() => {
    if (router.isReady && router.query.contract) {
      const contractAddr = router.query.contract as string
      setUrlContract(contractAddr)
      
      // 如果有 chain 参数，尝试切换到对应链
      if (router.query.chain) {
        const targetChainId = parseInt(router.query.chain as string)
        if (targetChainId !== chainId) {
          switchChain({ chainId: targetChainId })
        }
      }
      
      // 如果有 tab 参数，切换到对应标签页
      if (router.query.tab === 'transactions') {
        setActiveTab('transactions')
      } else if (router.query.tab === 'deploy') {
        setActiveTab('deploy')
      } else {
        setActiveTab('view')
      }
    }
  }, [router.isReady, router.query])


  if (!mounted || !ready) {
    return (
      <>
        <Head>
          <title>MultiSig Wallet Deployer</title>
          <meta name='description' content="Secure and reliable enterprise-grade multi-signature wallet solution" />
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
          <title>{ready ? `${t('title')} - ${t('index.managementTool')}` : 'MultiSig Wallet Deployer'}</title>
          <meta name='description' content={ready ? t('subtitle') : 'Secure and reliable enterprise-grade multi-signature wallet solution'} />
        </Head>
      
      <div className="min-h-screen bg-primary-black relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-light/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-gray/10 rounded-full blur-3xl"></div>
        
        {/* Top Right Buttons - Language Switcher and Connect Wallet */}
        <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
          <div className="scale-90 sm:scale-100">
            <LanguageSwitcher />
          </div>
          <div className="scale-90 sm:scale-100">
            <ConnectButton />
          </div>
        </div>
        
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-12 pt-12 sm:pt-0">
            <div className="inline-block mb-4 sm:mb-6">
              <div className="text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-light via-white to-primary-gray bg-clip-text text-transparent">
                {t('index.multiSigWallet')}
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-2 sm:mb-3">
              {t('index.managementTool')}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-primary-gray max-w-2xl mx-auto px-2">
              {t('index.enterpriseSolution')}
            </p>
          </div>

          {/* 未连接钱包时显示产品介绍和营销内容 */}
          {!isConnected ? (
            <div className="max-w-6xl mx-auto space-y-12 pb-8">
              {/* 产品优势 */}
              <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">{t('index.whyChooseTitle')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="flex flex-col items-center text-center p-6 rounded-xl bg-primary-dark/50 border border-primary-light/10 hover:border-primary-light/30 transition-all">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light/20 to-primary-gray/20 flex items-center justify-center mb-4">
                      <Shield className="w-8 h-8 text-primary-light" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t('index.whyChooseSecurityTitle')}</h3>
                    <p className="text-primary-gray text-sm">
                      {t('index.whyChooseSecurityDesc')}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-6 rounded-xl bg-primary-dark/50 border border-primary-light/10 hover:border-primary-light/30 transition-all">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light/20 to-primary-gray/20 flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-primary-light" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t('index.whyChooseManagementTitle')}</h3>
                    <p className="text-primary-gray text-sm">
                      {t('index.whyChooseManagementDesc')}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-6 rounded-xl bg-primary-dark/50 border border-primary-light/10 hover:border-primary-light/30 transition-all">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light/20 to-primary-gray/20 flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8 text-primary-light" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t('index.whyChooseTransparentTitle')}</h3>
                    <p className="text-primary-gray text-sm">
                      {t('index.whyChooseTransparentDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <MultisigWorkflow />

              {/* 使用场景 */}
              <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">{t('index.scenariosTitle')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-6 rounded-xl bg-primary-dark/50 border border-primary-light/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="w-6 h-6 text-primary-light" />
                      <h3 className="text-lg font-semibold text-white">{t('index.scenarioCompanyTitle')}</h3>
                    </div>
                    <p className="text-primary-gray text-sm">
                      {t('index.scenarioCompanyDesc')}
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-primary-dark/50 border border-primary-light/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-6 h-6 text-primary-light" />
                      <h3 className="text-lg font-semibold text-white">{t('index.scenarioDAOTitle')}</h3>
                    </div>
                    <p className="text-primary-gray text-sm">
                      {t('index.scenarioDAODesc')}
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-primary-dark/50 border border-primary-light/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-6 h-6 text-primary-light" />
                      <h3 className="text-lg font-semibold text-white">{t('index.scenarioProjectTitle')}</h3>
                    </div>
                    <p className="text-primary-gray text-sm">
                      {t('index.scenarioProjectDesc')}
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-primary-dark/50 border border-primary-light/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Lock className="w-6 h-6 text-primary-light" />
                      <h3 className="text-lg font-semibold text-white">{t('index.scenarioFamilyTitle')}</h3>
                    </div>
                    <p className="text-primary-gray text-sm">
                      {t('index.scenarioFamilyDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 text-center">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">{t('index.ctaTitle')}</h2>
                <p className="text-sm sm:text-base text-primary-gray mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
                  {t('index.ctaDesc')}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="scale-90 sm:scale-100">
                    <ConnectButton />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 已连接钱包时显示功能标签页 */}
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                {/* 左侧导航栏 - 移动端改为横向滚动 */}
                <div className="flex-shrink-0 w-full md:w-64">
                  <div className="glass-effect rounded-xl sm:rounded-2xl p-2 md:sticky md:top-24">
                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
                      <button
                        onClick={() => setActiveTab('view')}
                        className={`flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all md:w-full min-w-0 ${
                          activeTab === 'view'
                            ? 'bg-gradient-to-r from-primary-light to-primary-gray text-primary-black shadow-lg'
                            : 'text-primary-gray hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base break-words text-left">{t('tabs.view')}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('transactions')}
                        className={`flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all md:w-full min-w-0 ${
                          activeTab === 'transactions'
                            ? 'bg-gradient-to-r from-primary-light to-primary-gray text-primary-black shadow-lg'
                            : 'text-primary-gray hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base break-words text-left">{t('tabs.transactions')}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('deploy')}
                        className={`flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all md:w-full min-w-0 ${
                          activeTab === 'deploy'
                            ? 'bg-gradient-to-r from-primary-light to-primary-gray text-primary-black shadow-lg'
                            : 'text-primary-gray hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base break-words text-left">{t('tabs.deploy')}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all md:w-full min-w-0 ${
                          activeTab === 'settings'
                            ? 'bg-gradient-to-r from-primary-light to-primary-gray text-primary-black shadow-lg'
                            : 'text-primary-gray hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base break-words text-left">{t('tabs.settings')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 右侧内容区域 */}
                <div className="flex-1 min-w-0">
                  <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10">
                {activeTab === 'view' ? (
                  <DeployedContractsList 
                    onInitiateTransfer={(contractAddress, chainId) => {
                      setSelectedContract({ address: contractAddress, chainId })
                      setActiveTab('transactions')
                    }}
                  />
                ) : activeTab === 'transactions' ? (
                  <TransactionManager 
                    initialContract={selectedContract?.address || urlContract}
                    initialChainId={selectedContract?.chainId}
                  />
                ) : activeTab === 'settings' ? (
                  <UserSettings />
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="border-b border-primary-light/20 pb-4 sm:pb-6 mb-6 sm:mb-8">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">{t('deploy.title')}</h2>
                      <p className="text-sm sm:text-base md:text-lg text-primary-gray">{t('deploy.subtitle')}</p>
                    </div>
                    <MultiSigDeployer />
                  </div>
                )}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}

export async function getServerSideProps(context: any) {
  try {
    const { locale } = context
    console.log('[getServerSideProps] Starting with locale:', locale)
    
    const translations = await serverSideTranslations(locale || 'zh-CN', ['common'])
    console.log('[getServerSideProps] Translations loaded successfully')
    
    return {
      props: {
        ...translations,
      },
    }
  } catch (error: any) {
    console.error('[getServerSideProps] Error loading translations:', error)
    console.error('[getServerSideProps] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    
    // 如果翻译加载失败，尝试使用默认语言
    try {
      console.log('[getServerSideProps] Attempting fallback to zh-CN')
      const fallbackTranslations = await serverSideTranslations('zh-CN', ['common'])
      console.log('[getServerSideProps] Fallback translations loaded successfully')
      return {
        props: {
          ...fallbackTranslations,
        },
      }
    } catch (fallbackError: any) {
      console.error('[getServerSideProps] Fallback translation also failed:', fallbackError)
      console.error('[getServerSideProps] Fallback error details:', {
        message: fallbackError?.message,
        stack: fallbackError?.stack,
        name: fallbackError?.name,
      })
      
      // 如果默认语言也失败，返回空 props（页面会使用硬编码的文本）
      // 这不应该导致 500 错误
      return {
        props: {
          _error: 'Translation loading failed',
        },
      }
    }
  }
}
