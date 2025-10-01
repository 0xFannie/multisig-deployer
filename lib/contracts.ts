// 部署的合约地址配置
export const DEPLOYED_CONTRACTS = {
  localhost: {
    MultiSigWallet: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    chainId: 31337,
  },
  // 其他网络的部署地址可以在这里添加
  sepolia: {
    MultiSigWallet: '', // 部署后填写
    chainId: 11155111,
  },
  mumbai: {
    MultiSigWallet: '', // 部署后填写
    chainId: 80001,
  },
}

// 获取当前网络的合约地址
export function getContractAddress(chainId: number): string | null {
  const network = Object.entries(DEPLOYED_CONTRACTS).find(
    ([_, config]) => config.chainId === chainId
  )
  return network ? network[1].MultiSigWallet : null
}

