# 多签钱包部署工具 (MultiSig Deployer)

企业级多签名钱包智能合约部署解决方案，结合了 Next.js 前端和 Hardhat 开发框架。

## ✨ 功能特性

- ✅ **安全的多签机制**: 支持 M-of-N 多签方案（如 2/3, 3/5 等）
- ✅ **完整的智能合约**: 使用 Solidity 0.8.19 编写，已通过完整测试
- ✅ **现代化前端界面**: 基于 Next.js + React + Tailwind CSS
- ✅ **Web3 集成**: 支持 MetaMask、WalletConnect 等钱包
- ✅ **多链支持**: 支持以太坊、Polygon、BSC、Arbitrum 等多个网络
- ✅ **完善的测试**: 14 个单元测试全部通过

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 填入必要的配置（详见 DEPLOYMENT.md）

### 3. 编译智能合约

```bash
npm run compile
```

### 4. 运行测试

```bash
npm run test
```

### 5. 启动开发服务器

```bash
npm run dev
```

在浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📦 部署智能合约

### 测试网部署

在 `scripts/deploy.js` 中配置所有者地址和确认数要求，然后运行：

```bash
# Sepolia 测试网
npx hardhat run scripts/deploy.js --network sepolia

# Mumbai 测试网
npx hardhat run scripts/deploy.js --network mumbai

# BSC 测试网
npx hardhat run scripts/deploy.js --network bscTestnet
```

### 验证合约

```bash
npx hardhat verify --network sepolia <合约地址> '["0x地址1","0x地址2"]' 2
```

## 📚 项目结构

```
multisig-deployer/
├── contracts/          # Solidity 智能合约
│   └── MultiSigWallet.sol
├── scripts/            # 部署脚本
│   └── deploy.js
├── test/              # 测试文件
│   └── MultiSigWallet.test.js
├── pages/             # Next.js 页面
│   ├── _app.tsx
│   └── index.tsx
├── components/        # React 组件
│   └── MultiSigDeployer.tsx
├── lib/               # 工具库
├── hardhat.config.js  # Hardhat 配置
└── package.json
```

## 🔧 可用命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run start      # 启动生产服务器
npm run compile    # 编译智能合约
npm run test       # 运行测试
npm run deploy     # 部署合约（需指定网络）
```

## 📖 详细文档

查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取完整的部署指南和使用说明。

## 🛡️ 安全提示

- ⚠️ 使用前请先在测试网充分测试
- ⚠️ 妥善保管私钥，不要提交到 Git
- ⚠️ 重要项目建议进行专业的安全审计
- ⚠️ 确保所有所有者地址正确且有备份

## 🔗 支持的网络

| 网络 | Chain ID | 状态 |
|------|----------|------|
| Ethereum Sepolia | 11155111 | ✅ 测试网 |
| Polygon Mumbai | 80001 | ✅ 测试网 |
| BSC Testnet | 97 | ✅ 测试网 |
| Ethereum Mainnet | 1 | ✅ 主网 |
| Polygon | 137 | ✅ 主网 |
| BSC | 56 | ✅ 主网 |
| Arbitrum One | 42161 | ✅ 主网 |

## 🛠️ 技术栈

- **智能合约**: Solidity 0.8.19
- **开发框架**: Hardhat
- **前端**: Next.js 13, React 18, TypeScript
- **Web3**: Wagmi, Viem, RainbowKit
- **样式**: Tailwind CSS
- **测试**: Hardhat Toolbox (Mocha, Chai, Ethers.js)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**免责声明**: 本项目仅供学习和参考。使用本项目产生的任何损失，开发者不承担责任。
