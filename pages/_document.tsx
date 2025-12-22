import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* 在页面加载前设置全局错误处理，阻止 MetaMask 错误显示 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 拦截 fetch 请求，阻止 WalletConnect API 403 错误显示
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  const url = args[0];
                  if (typeof url === 'string' && url.includes('api.web3modal.org')) {
                    // 静默处理 WalletConnect API 请求，不显示错误
                    return originalFetch.apply(this, args).catch(() => {
                      // 静默失败，不抛出错误
                      return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    });
                  }
                  return originalFetch.apply(this, args);
                };

                // 在页面加载前捕获所有错误，包括 Next.js 错误覆盖层
                const originalError = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  const errorMessage = String(message || '');
                  const sourceStr = String(source || '');
                  // 阻止特定的连接失败错误和 WalletConnect API 错误
                  if (
                    (errorMessage.includes('Failed to connect to MetaMask') ||
                     errorMessage.includes('MetaMask extension not found') ||
                     errorMessage.includes('api.web3modal.org') ||
                     errorMessage.includes('403') ||
                     errorMessage.includes('Forbidden')) &&
                    (errorMessage.includes('inpage.js') || 
                     errorMessage.includes('i: Failed to connect') ||
                     sourceStr.includes('inpage.js') ||
                     sourceStr.includes('web3Config'))
                  ) {
                    return true; // 阻止默认错误处理
                  }
                  if (originalError) {
                    return originalError.call(this, message, source, lineno, colno, error);
                  }
                  return false;
                };

                // 捕获未处理的 Promise 拒绝 - 阻止 WalletConnect 和 MetaMask 错误显示
                window.addEventListener('unhandledrejection', function(event) {
                  const error = event.reason;
                  const errorMessage = String(error?.message || error?.toString() || error || '');
                  const errorStr = String(error || '');
                  
                  // 阻止 WalletConnect API 错误和 MetaMask 连接错误
                  if (
                    errorMessage.includes('api.web3modal.org') ||
                    errorMessage.includes('403') ||
                    errorMessage.includes('Forbidden') ||
                    errorMessage.includes('Failed to connect to MetaMask') ||
                    errorMessage.includes('MetaMask extension not found') ||
                    errorMessage.includes('i: Failed to connect') ||
                    errorStr.includes('Failed to connect to MetaMask') ||
                    errorStr.includes('MetaMask extension not found') ||
                    errorStr.includes('i: Failed to connect')
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    return false;
                  }
                }, true); // 使用捕获阶段，尽早阻止

                // 捕获错误事件 - 阻止 WalletConnect 和 MetaMask 错误显示
                window.addEventListener('error', function(event) {
                  const errorMessage = String(event.message || event.error?.message || '');
                  const sourceStr = String(event.filename || event.source || '');
                  const errorStr = String(event.error || '');
                  
                  // 阻止 WalletConnect API 错误和 MetaMask 连接错误
                  if (
                    errorMessage.includes('api.web3modal.org') ||
                    errorMessage.includes('403') ||
                    errorMessage.includes('Forbidden') ||
                    sourceStr.includes('web3Config') ||
                    errorMessage.includes('Failed to connect to MetaMask') ||
                    errorMessage.includes('MetaMask extension not found') ||
                    errorMessage.includes('i: Failed to connect') ||
                    sourceStr.includes('inpage.js') ||
                    errorStr.includes('Failed to connect to MetaMask') ||
                    errorStr.includes('MetaMask extension not found') ||
                    errorStr.includes('i: Failed to connect')
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    return false;
                  }
                }, true); // 使用捕获阶段，尽早阻止

                // 拦截 console.error 和 console.warn，过滤 WalletConnect 403 错误和 MetaMask 错误
                const originalConsoleError = console.error;
                const originalConsoleWarn = console.warn;
                
                console.error = function(...args) {
                  const errorMessage = args.join(' ');
                  const errorStr = String(args[0] || '');
                  // 检查是否是需要过滤的错误
                  if (
                    errorMessage.includes('api.web3modal.org') ||
                    errorMessage.includes('403') ||
                    errorMessage.includes('Forbidden') ||
                    errorMessage.includes('Failed to connect to MetaMask') ||
                    errorMessage.includes('MetaMask extension not found') ||
                    errorMessage.includes('inpage.js') ||
                    errorMessage.includes('i: Failed to connect') ||
                    errorStr.includes('api.web3modal.org') ||
                    errorStr.includes('403') ||
                    errorStr.includes('Forbidden')
                  ) {
                    return; // 静默处理
                  }
                  originalConsoleError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const warnMessage = args.join(' ');
                  const warnStr = String(args[0] || '');
                  if (
                    warnMessage.includes('api.web3modal.org') ||
                    warnMessage.includes('403') ||
                    warnMessage.includes('Forbidden') ||
                    warnMessage.includes('[Reown Config]') ||
                    warnStr.includes('api.web3modal.org') ||
                    warnStr.includes('403')
                  ) {
                    return; // 静默处理
                  }
                  originalConsoleWarn.apply(console, args);
                };
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

