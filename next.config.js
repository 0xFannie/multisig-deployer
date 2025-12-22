/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js i18n 路由配置（next-i18next 需要此配置）
  i18n: {
    locales: ['zh-CN', 'en'],
    defaultLocale: 'zh-CN',
    localeDetection: false, // 禁用自动检测，由 next-i18next 处理
  },
};

module.exports = nextConfig;
