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
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
      }
    }
    // 添加别名来忽略这个模块
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    }
    return config
  },
};

module.exports = nextConfig;
