import type { AppProps } from 'next/app'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig, initWeb3Modal } from '../lib/web3Config'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { appWithTranslation } from 'next-i18next'
import '../styles/globals.css'

function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }))

  useEffect(() => {
    initWeb3Modal()
  }, [])
  
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
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
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default appWithTranslation(App)