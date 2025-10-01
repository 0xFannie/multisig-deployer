# 多签钱包部署指南

## 项目概述

这是一个企业级多签名钱包解决方案，包含：
- ✅ Solidity 智能合约 (MultiSigWallet)
- ✅ Next.js 前端界面
- ✅ Hardhat 部署和测试工具
- ✅ 支持多个区块链网络

## 前置要求

- Node.js 16+ 和 npm
- MetaMask 或其他 Web3 钱包
- 测试网或主网的代币（用于支付 Gas 费用）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 并重命名为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入以下信息：

```env
# 部署者私钥（不要使用包含大量资金的账户）
PRIVATE_KEY=你的私钥

# RPC 节点地址（推荐使用 Alchemy 或 Infura）
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY

# 区块链浏览器 API Key（用于验证合约）
ETHERSCAN_API_KEY=你的_etherscan_api_key
POLYGONSCAN_API_KEY=你的_polygonscan_api_key

# WalletConnect Project ID（从 https://cloud.walletconnect.com/ 获取）
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的_project_id
```

⚠️ **安全提示**：
- 永远不要提交 `.env.local` 文件到 Git
- 使用测试网进行初步测试
- 部署用的私钥不要包含大量资金

## 部署智能合约

### 编译合约

```bash
npm run compile
```

### 运行测试

```bash
npm run test
```

### 部署到测试网

#### Sepolia (以太坊测试网)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

#### Mumbai (Polygon 测试网)

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

#### BSC 测试网

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### 自定义部署参数

编辑 `scripts/deploy.js` 文件，修改以下参数：

```javascript
const owners = [
  "0x地址1",
  "0x地址2",
  "0x地址3",
];

const numConfirmationsRequired = 2; // 需要 2/3 个所有者确认
```

### 验证合约（可选）

部署后，在区块链浏览器上验证合约：

```bash
npx hardhat verify --network sepolia <合约地址> '["0x地址1","0x地址2","0x地址3"]' 2
```

## 运行前端应用

### 开发模式

```bash
npm run dev
```

在浏览器中打开 http://localhost:3000

### 生产构建

```bash
npm run build
npm run start
```

## 功能说明

### 多签钱包特性

- ✅ **多所有者管理**：支持多个所有者共同管理钱包
- ✅ **灵活的确认机制**：可设置 M-of-N 多签方案（如 2/3, 3/5 等）
- ✅ **安全的交易流程**：
  1. 所有者提交交易
  2. 其他所有者确认交易
  3. 达到确认数后执行交易
- ✅ **撤销确认**：在交易执行前可撤销确认
- ✅ **透明可审计**：所有操作均有事件记录

### 合约主要方法

```solidity
// 提交交易
submitTransaction(address to, uint256 value, bytes data)

// 确认交易
confirmTransaction(uint256 txIndex)

// 执行交易
executeTransaction(uint256 txIndex)

// 撤销确认
revokeConfirmation(uint256 txIndex)

// 查询方法
getOwners() returns (address[])
getTransactionCount() returns (uint256)
getTransaction(uint256 txIndex) returns (...)
```

## 使用场景

### 1. 企业资金管理

```javascript
// 3 个高管，需要至少 2 人确认
const owners = [ceo, cfo, cto];
const required = 2;
```

### 2. DAO 金库

```javascript
// 5 个理事会成员，需要至少 3 人确认
const owners = [member1, member2, member3, member4, member5];
const required = 3;
```

### 3. 家庭资产管理

```javascript
// 2 个配偶，需要双方确认
const owners = [spouse1, spouse2];
const required = 2;
```

## 支持的网络

| 网络 | Chain ID | 配置名称 |
|------|----------|----------|
| Ethereum Mainnet | 1 | mainnet |
| Ethereum Sepolia | 11155111 | sepolia |
| Polygon | 137 | polygon |
| Polygon Mumbai | 80001 | mumbai |
| BSC | 56 | bsc |
| BSC Testnet | 97 | bscTestnet |
| Arbitrum One | 42161 | arbitrum |

## 常见问题

### Q: 部署需要多少 Gas？
A: 约 1.5-2.5M Gas，具体取决于所有者数量。在 Sepolia 测试网上部署通常需要 < 0.01 ETH。

### Q: 可以修改所有者或确认数吗？
A: 当前版本部署后无法修改。如需修改，需要部署新合约并转移资金。

### Q: 如何转移合约中的资金？
A: 通过 submitTransaction 提交转账交易，获得足够确认后执行。

### Q: 支持 ERC20 代币吗？
A: 是的，使用 submitTransaction 方法调用 ERC20 的 transfer 方法即可。

### Q: 前端部署功能为什么不可用？
A: 前端需要集成合约 artifacts（ABI 和 bytecode）。推荐使用 Hardhat 命令行部署。

## 安全建议

1. ✅ **测试优先**：先在测试网充分测试
2. ✅ **密钥管理**：使用硬件钱包管理所有者私钥
3. ✅ **合理设置确认数**：避免过低（不安全）或过高（难以执行）
4. ✅ **审计合约**：重要项目建议进行专业审计
5. ✅ **备份地址**：确保所有所有者地址都有备份
6. ✅ **监控交易**：定期检查待处理交易

## 开发和测试

### 本地测试

```bash
# 启动本地节点
npx hardhat node

# 在另一个终端部署
npx hardhat run scripts/deploy.js --network localhost

# 运行测试
npm run test
```

### Gas 报告

```bash
REPORT_GAS=true npm run test
```

## 技术栈

- **智能合约**: Solidity 0.8.19
- **开发框架**: Hardhat
- **前端**: Next.js 13, React 18, TypeScript
- **Web3**: Wagmi, Viem, RainbowKit
- **样式**: Tailwind CSS
- **图标**: Lucide React

## 项目结构

```
multisig-deployer/
├── contracts/          # Solidity 合约
├── scripts/            # 部署脚本
├── test/               # 测试文件
├── pages/              # Next.js 页面
├── components/         # React 组件
├── lib/                # 工具函数
├── styles/             # 样式文件
└── hardhat.config.js   # Hardhat 配置
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 支持

如有问题或建议，请提交 GitHub Issue。

---

**免责声明**：本项目仅供学习和参考使用。使用本项目产生的任何损失，开发者不承担责任。请在充分理解代码和风险的情况下使用。

