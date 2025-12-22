// 统一的代币地址配置
// 所有代币地址配置集中管理，避免重复定义

export interface TokenAddresses {
  usdt: string | null
  usdc: string | null // USDC.e (bridged) or USDC
  usdcNative: string | null // USDC Native
}

export const TOKEN_ADDRESSES: Record<number, TokenAddresses> = {
  1: { // Ethereum
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Native USDC
    usdcNative: null, // Only one USDC on Ethereum
  },
  137: { // Polygon
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC.e (bridged)
    usdcNative: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC Native
  },
  56: { // BSC
    usdt: '0x55d398326f99059fF775485246999027B3197955',
    usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    usdcNative: null,
  },
  42161: { // Arbitrum One
    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    usdc: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC.e (bridged)
    usdcNative: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC Native
  },
  10: { // Optimism
    usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    usdc: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC.e (bridged)
    usdcNative: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC Native
  },
  8453: { // Base
    usdt: '0x7f5373AE26c3E8FfC4c77b7255DF7eC1A9aF52a6', // axlUSDT
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC Native
    usdcNative: null,
  },
  43114: { // Avalanche
    usdt: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    usdcNative: null,
  },
  59144: { // Linea
    usdt: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
    usdc: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
    usdcNative: null,
  },
  324: { // zkSync Era
    usdt: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
    usdc: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
    usdcNative: null,
  },
  534352: { // Scroll
    usdt: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df',
    usdc: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
    usdcNative: null,
  },
}

export function getTokenAddresses(chainId: number): TokenAddresses {
  return TOKEN_ADDRESSES[chainId] || { usdt: null, usdc: null, usdcNative: null }
}

export function getTokenAddress(chainId: number, token: 'usdt' | 'usdc' | 'usdcNative'): string | null {
  const addresses = getTokenAddresses(chainId)
  return addresses[token] || null
}

