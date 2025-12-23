/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js i18n 路由配置（next-i18next 需要此配置）
  i18n: {
    locales: ['zh-CN', 'en'],
    defaultLocale: 'zh-CN',
    localeDetection: false, // 禁用自动检测，由 next-i18next 处理
  },
  webpack: (config, { isServer }) => {
    // 忽略 React Native 依赖（@metamask/sdk 需要但 Next.js 不需要）
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    }
    
    // 添加别名来忽略这个模块
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    }
    
    // 处理 vanilla-extract/sprinkles 的 CommonJS/ESM 兼容性问题
    if (isServer) {
      config.externals = config.externals || []
      config.resolve.alias = {
        ...config.resolve.alias,
        '@vanilla-extract/sprinkles/createUtils': require.resolve('@vanilla-extract/sprinkles/createUtils'),
      }
    }
    
    return config
  },
  // 实验性功能：允许服务器端组件使用 ESM
  experimental: {
    serverComponentsExternalPackages: ['@rainbow-me/rainbowkit'],
  },
};

module.exports = nextConfig;
