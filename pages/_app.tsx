import type { AppProps } from 'next/app'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, Locale } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/router'
import { wagmiConfig, initWeb3Modal } from '../lib/web3Config'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { appWithTranslation } from 'next-i18next'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Footer } from '../components/Footer'
import '@rainbow-me/rainbowkit/styles.css'
import '../styles/globals.css'

function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }))

  // 获取当前 locale，映射到 RainbowKit 支持的格式
  const getRainbowKitLocale = (): Locale => {
    const locale = router.locale || router.defaultLocale || 'zh-CN'
    // 映射到 RainbowKit 支持的 locale
    if (locale === 'zh-CN' || locale === 'zh') {
      return 'zh-CN'
    }
    if (locale === 'en' || locale === 'en-US') {
      return 'en-US'
    }
    // 默认返回 en-US
    return 'en-US'
  }

  const rainbowKitLocale = getRainbowKitLocale()

  useEffect(() => {
    // 检查 MetaMask 扩展是否可用
    if (typeof window !== 'undefined') {
      const checkMetaMask = () => {
        const ethereum = (window as any).ethereum
        if (ethereum?.isMetaMask) {
          console.log('✅ MetaMask 扩展已检测到', {
            isMetaMask: ethereum.isMetaMask,
            providers: ethereum.providers,
            request: typeof ethereum.request,
            _metamask: ethereum._metamask,
          })
          // 确保 MetaMask 可以被调用
          if (typeof ethereum.request === 'function') {
            console.log('✅ MetaMask request 方法可用')
          }
        } else if (ethereum) {
          console.log('⚠️ 检测到钱包扩展，但不是 MetaMask', {
            isMetaMask: ethereum.isMetaMask,
            providers: ethereum.providers,
            ethereum: ethereum,
          })
          // 检查是否有多个提供者（包括 MetaMask）
          if (ethereum.providers && Array.isArray(ethereum.providers)) {
            const metamaskProvider = ethereum.providers.find((p: any) => p.isMetaMask)
            if (metamaskProvider) {
              console.log('✅ 在 providers 数组中找到了 MetaMask', metamaskProvider)
            }
          }
        } else {
          console.log('❌ 未检测到钱包扩展')
        }
      }
      
      // 延迟检查，确保扩展已加载
      setTimeout(checkMetaMask, 1000)
      
      // 监听 MetaMask 扩展的注入
      if ((window as any).ethereum) {
        checkMetaMask()
      } else {
        // 等待 MetaMask 注入
        let checkCount = 0
        const checkInterval = setInterval(() => {
          checkCount++
          if ((window as any).ethereum) {
            checkMetaMask()
            clearInterval(checkInterval)
          } else if (checkCount > 10) {
            clearInterval(checkInterval)
          }
        }, 500)
      }
    }

    // 捕获并阻止 MetaMask 连接错误显示
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const errorMessage = String(error?.message || error?.toString() || error || '')
      const errorStr = String(error || '')
      
      // 阻止所有 MetaMask 连接错误显示
      if (
        errorMessage.includes('Failed to connect to MetaMask') ||
        errorMessage.includes('MetaMask extension not found') ||
        errorMessage.includes('i: Failed to connect') ||
        errorStr.includes('Failed to connect to MetaMask') ||
        errorStr.includes('MetaMask extension not found') ||
        errorStr.includes('i: Failed to connect')
      ) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false
      }
    }

    const handleError = (event: ErrorEvent) => {
      const errorMessage = String(event.message || event.error?.message || '')
      const errorStr = String(event.error || '')
      const sourceStr = String(event.filename || '')
      
      // 阻止所有 MetaMask 连接错误显示
      if (
        errorMessage.includes('Failed to connect to MetaMask') ||
        errorMessage.includes('MetaMask extension not found') ||
        errorMessage.includes('i: Failed to connect') ||
        sourceStr.includes('inpage.js') ||
        errorStr.includes('Failed to connect to MetaMask') ||
        errorStr.includes('MetaMask extension not found') ||
        errorStr.includes('i: Failed to connect')
      ) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false
      }
    }

    // 只过滤 SDK 模块解析错误和 WalletConnect 403 错误
    const originalError = console.error
    const originalWarn = console.warn
    
    console.error = (...args: any[]) => {
      const errorMessage = args.join(' ')
      if (
        errorMessage.includes('@react-native-async-storage/async-storage') ||
        errorMessage.includes('Module not found') ||
        errorMessage.includes('Failed to connect to MetaMask') ||
        errorMessage.includes('MetaMask extension not found') ||
        errorMessage.includes('inpage.js') ||
        errorMessage.includes('i: Failed to connect') ||
        errorMessage.includes('api.web3modal.org') ||
        errorMessage.includes('403') ||
        errorMessage.includes('Forbidden')
      ) {
        return
      }
      originalError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      const warnMessage = args.join(' ')
      if (
        warnMessage.includes('@react-native-async-storage/async-storage') ||
        warnMessage.includes('Module not found') ||
        warnMessage.includes('[Reown Config] Failed to fetch remote project configuration') ||
        warnMessage.includes('403') ||
        warnMessage.includes('Forbidden') ||
        warnMessage.includes('api.web3modal.org') ||
        warnMessage.includes('errorCorrection') ||
        warnMessage.includes('React does not recognize')
      ) {
        return
      }
      originalWarn.apply(console, args)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    initWeb3Modal()

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])
  
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#6366f1', // primary-light color
              accentColorForeground: 'white',
              borderRadius: 'large',
              fontStack: 'system',
            })}
            locale={rainbowKitLocale}
            coolMode
            showRecentTransactions={true}
            initialChain={undefined}
            appInfo={{
              appName: 'MultiSig Wallet Deployer',
            }}
          >
          <ErrorBoundary>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <Component {...pageProps} />
              </div>
              <Footer />
            </div>
          </ErrorBoundary>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: { duration: 3000 },
              error: { duration: 5000 },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default appWithTranslation(App)