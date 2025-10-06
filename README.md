# 多签钱包部署工具 | MultiSig Wallet Deployer

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Solidity](https://img.shields.io/badge/solidity-0.8.19-brightgreen)
![Next.js](https://img.shields.io/badge/next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-green)

**企业级多签名钱包智能合约管理系统**

**Enterprise-Grade Multi-Signature Wallet Smart Contract Management System**

[🌐 在线演示 Live Demo](https://multisig.chain-tools.com) · [🐛 报告问题 Report Bug](https://github.com/0xFannie/multisig-deployer/issues) · [✨ 请求功能 Request Feature](https://github.com/0xFannie/multisig-deployer/issues)

</div>

---

## 📖 Language | 语言

- [🇨🇳 中文](#中文文档)
- [🇬🇧 English](#english-documentation)

---

<a name="中文文档"></a>

# 🇨🇳 中文文档

## 🎯 产品功能概述

这是一个**完整的链上多签钱包管理系统**，允许多个钱包所有者共同管理资金。任何资产转出都需要指定数量的所有者签名确认。

### ✨ 核心特性

- ✅ **安全的多签机制**: 支持 M-of-N 多签方案（如 2/3, 3/5 等）
- ✅ **完整的交易管理**: 提交、确认、撤销、执行交易的完整流程
- ✅ **合约地址管理**: 输入和保存已部署的合约地址
- ✅ **分享链接功能**: 生成可分享链接，方便多方协作
- ✅ **实时状态追踪**: 可视化显示交易确认进度
- ✅ **现代化 UI**: 基于最新设计趋势的美观界面
- ✅ **Web3 集成**: 支持 MetaMask、WalletConnect 等主流钱包
- ✅ **多链支持**: 支持 14+ 个 EVM 兼容网络
- ✅ **完善的测试**: 14 个单元测试全部通过

---

## 🌐 支持的网络

### Layer 1 主网
- Ethereum Mainnet
- Polygon PoS
- BNB Chain (BSC)
- Avalanche C-Chain
- Fantom Opera

### Layer 2
- Arbitrum One
- Optimism
- Base

### zkEVM
- zkSync Era
- Scroll
- Polygon zkEVM
- Linea

### 测试网
- Sepolia
- Goerli

---

## 🚀 快速开始

### 在线使用

访问 **https://multisig.chain-tools.com** 即可使用。

### 基本流程

#### 1. 部署多签钱包

```
1. 连接钱包（MetaMask 等）
2. 切换到"部署新合约"标签
3. 添加所有者地址（至少 2 个）
4. 设置确认比例（50%, 67%, 75%, 100%）
5. 点击"部署合约"
6. 等待交易确认
7. 复制分享链接发送给其他所有者
```

#### 2. 管理交易

```
1. 在"交易管理"标签输入合约地址
2. 提交新交易：输入接收地址和金额
3. 确认交易：其他所有者查看并确认
4. 执行交易：达到所需确认数后执行
```

---

## 💼 使用场景

### 1. 公司资金管理 🏢
- **场景**: 3 个合伙人共同管理公司资金
- **配置**: 3 个所有者，需要 2/3 确认
- **优势**: 防止单人擅自转移资金，保障各方利益

### 2. DAO 金库管理 🏛️
- **场景**: 5 个理事会成员管理社区金库
- **配置**: 5 个所有者，需要 3/5 确认
- **优势**: 民主决策，透明公开

### 3. 家庭资产管理 👨‍👩‍👧‍👦
- **场景**: 夫妻双方共同管理家庭资产
- **配置**: 2 个所有者，需要 2/2 确认
- **优势**: 重大支出双方共同决定

### 4. 项目资金托管 🤝
- **场景**: 投资人和创始人共管项目资金
- **配置**: 2-3 个所有者，需要多数确认
- **优势**: 双重保障，降低风险

---

## 🔧 本地开发

### 环境要求

```bash
Node.js 16+
npm 或 yarn
Git
MetaMask 或其他 Web3 钱包
```

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/0xFannie/multisig-deployer.git
cd multisig-deployer

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 编辑 .env.local 填入以下配置：
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
# NEXT_PUBLIC_ETHEREUM_RPC_URL=your_rpc_url
# NEXT_PUBLIC_POLYGON_RPC_URL=your_rpc_url
# 等等...

# 4. 启动开发服务器
npm run dev

# 5. 访问应用
# 打开浏览器访问 http://localhost:3000
```

### 编译智能合约

```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 查看测试覆盖率
npx hardhat coverage

# 部署到本地网络
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

---

## 📁 项目结构

```
multisig-deployer/
├── contracts/              # 智能合约
│   └── MultiSigWallet.sol # 多签钱包合约
├── components/            # React 组件
│   ├── MultiSigDeployer.tsx        # 部署界面
│   ├── MultiSigWalletViewer.tsx    # 查看界面
│   └── TransactionManager.tsx      # 交易管理
├── pages/                 # Next.js 页面
│   ├── _app.tsx          # 应用入口
│   └── index.tsx         # 主页面
├── lib/                   # 工具库
│   ├── contracts.ts      # 合约配置
│   ├── networks.ts       # 网络配置
│   └── web3Config.ts     # Web3 配置
├── test/                  # 测试文件
│   └── MultiSigWallet.test.js
├── hardhat.config.js      # Hardhat 配置
└── package.json
```

---

## 🧪 测试

项目包含 14 个全面的单元测试：

```bash
npm run test
```

**测试覆盖：**
- ✅ 合约部署
- ✅ 提交交易
- ✅ 确认交易
- ✅ 撤销确认
- ✅ 执行交易
- ✅ 权限控制
- ✅ 边界条件

---

## 🛡️ 安全性

### 智能合约安全

- ✅ 使用 OpenZeppelin 安全库
- ✅ 完整的单元测试覆盖
- ✅ 事件日志记录所有操作
- ✅ 权限控制和参数验证
- ✅ 防重入攻击保护

### 最佳实践

1. **在主网部署前务必在测试网测试**
2. **仔细验证所有所有者地址**
3. **合理设置确认比例**
4. **定期备份合约地址**
5. **保管好私钥和助记词**

---

## 📚 技术栈

### 前端
- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Wagmi v2** - Web3 React Hooks
- **Viem** - 以太坊交互库
- **React Hot Toast** - 通知组件

### 智能合约
- **Solidity 0.8.19** - 合约语言
- **Hardhat** - 开发环境
- **OpenZeppelin** - 安全库
- **Ethers.js** - 以太坊库

### 测试
- **Mocha** - 测试框架
- **Chai** - 断言库
- **Hardhat Network** - 本地测试网络

---

## 🔗 相关链接

- **在线演示**: https://multisig.chain-tools.com
- **GitHub**: https://github.com/0xFannie/multisig-deployer
- **Chain Tools 主站**: https://chain-tools.com
- **问题反馈**: https://github.com/0xFannie/multisig-deployer/issues

---

## 👤 作者

**0xfannie.eth**

- GitHub: [@0xFannie](https://github.com/0xFannie)
- Website: [xifangzhang.work](https://xifangzhang.work)
- Public Wallets:
  - **0xfannie.eth**: `0x36C1ad1E9eB589E20fF739FAD024a7ff3113Ba27`
  - **Catalizer.eth**: `0xF9147fb1c9799fA61bC9a41B28FFf2EE80654fd5`

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)（即将推出）

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## ⚠️ 免责声明

- 使用前请充分测试
- 本工具不提供任何形式的担保
- 使用者需自行承担使用风险
- 请妥善保管您的私钥和助记词
- 建议在测试网络先进行测试
- 多签合约钱包**没有助记词和私钥**，只能通过多方签名操作

---

<div align="center">

**0xfannie.eth Made with ❤️ for Web3 Community**

[⬆ 返回顶部](#多签钱包部署工具--multisig-wallet-deployer)

</div>

---
---
---

<a name="english-documentation"></a>

# 🇬🇧 English Documentation

## 🎯 Product Overview

This is a **complete on-chain multi-signature wallet management system** that allows multiple wallet owners to jointly manage funds. Any asset transfer requires signatures from a specified number of owners.

### ✨ Core Features

- ✅ **Secure Multi-Sig Mechanism**: Support M-of-N multi-sig schemes (e.g., 2/3, 3/5, etc.)
- ✅ **Complete Transaction Management**: Full workflow of submit, confirm, revoke, and execute transactions
- ✅ **Contract Address Management**: Input and save deployed contract addresses
- ✅ **Shareable Links**: Generate shareable links for easy multi-party collaboration
- ✅ **Real-time Status Tracking**: Visual display of transaction confirmation progress
- ✅ **Modern UI**: Beautiful interface based on latest design trends
- ✅ **Web3 Integration**: Support mainstream wallets like MetaMask, WalletConnect
- ✅ **Multi-Chain Support**: Support 14+ EVM-compatible networks
- ✅ **Comprehensive Testing**: All 14 unit tests passed

---

## 🌐 Supported Networks

### Layer 1 Mainnets
- Ethereum Mainnet
- Polygon PoS
- BNB Chain (BSC)
- Avalanche C-Chain
- Fantom Opera

### Layer 2
- Arbitrum One
- Optimism
- Base

### zkEVM
- zkSync Era
- Scroll
- Polygon zkEVM
- Linea

### Testnets
- Sepolia
- Goerli

---

## 🚀 Quick Start

### Online Usage

Visit **https://multisig.chain-tools.com** to use directly.

### Basic Workflow

#### 1. Deploy MultiSig Wallet

```
1. Connect wallet (MetaMask, etc.)
2. Switch to "Deploy New Contract" tab
3. Add owner addresses (minimum 2)
4. Set confirmation ratio (50%, 67%, 75%, 100%)
5. Click "Deploy Contract"
6. Wait for transaction confirmation
7. Copy shareable link and send to other owners
```

#### 2. Manage Transactions

```
1. Enter contract address in "Transaction Management" tab
2. Submit new transaction: Enter recipient address and amount
3. Confirm transaction: Other owners review and confirm
4. Execute transaction: Execute after required confirmations reached
```

---

## 💼 Use Cases

### 1. Corporate Treasury Management 🏢
- **Scenario**: 3 partners jointly manage company funds
- **Configuration**: 3 owners, requires 2/3 confirmations
- **Advantage**: Prevent unauthorized transfers, protect all parties' interests

### 2. DAO Treasury Management 🏛️
- **Scenario**: 5 council members manage community treasury
- **Configuration**: 5 owners, requires 3/5 confirmations
- **Advantage**: Democratic decision-making, transparent and open

### 3. Family Asset Management 👨‍👩‍👧‍👦
- **Scenario**: Spouses jointly manage family assets
- **Configuration**: 2 owners, requires 2/2 confirmations
- **Advantage**: Joint decision on major expenses

### 4. Project Fund Escrow 🤝
- **Scenario**: Investors and founders co-manage project funds
- **Configuration**: 2-3 owners, requires majority confirmation
- **Advantage**: Dual guarantee, reduce risk

---

## 🔧 Local Development

### Requirements

```bash
Node.js 16+
npm or yarn
Git
MetaMask or other Web3 wallet
```

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/0xFannie/multisig-deployer.git
cd multisig-deployer

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local

# Edit .env.local with following configuration:
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
# NEXT_PUBLIC_ETHEREUM_RPC_URL=your_rpc_url
# NEXT_PUBLIC_POLYGON_RPC_URL=your_rpc_url
# etc...

# 4. Start development server
npm run dev

# 5. Access application
# Open browser at http://localhost:3000
```

### Compile Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# View test coverage
npx hardhat coverage

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

---

## 📁 Project Structure

```
multisig-deployer/
├── contracts/              # Smart contracts
│   └── MultiSigWallet.sol # MultiSig wallet contract
├── components/            # React components
│   ├── MultiSigDeployer.tsx        # Deploy interface
│   ├── MultiSigWalletViewer.tsx    # View interface
│   └── TransactionManager.tsx      # Transaction management
├── pages/                 # Next.js pages
│   ├── _app.tsx          # App entry
│   └── index.tsx         # Main page
├── lib/                   # Utility libraries
│   ├── contracts.ts      # Contract configuration
│   ├── networks.ts       # Network configuration
│   └── web3Config.ts     # Web3 configuration
├── test/                  # Test files
│   └── MultiSigWallet.test.js
├── hardhat.config.js      # Hardhat configuration
└── package.json
```

---

## 🧪 Testing

Project includes 14 comprehensive unit tests:

```bash
npm run test
```

**Test Coverage:**
- ✅ Contract deployment
- ✅ Submit transaction
- ✅ Confirm transaction
- ✅ Revoke confirmation
- ✅ Execute transaction
- ✅ Permission control
- ✅ Edge cases

---

## 🛡️ Security

### Smart Contract Security

- ✅ Using OpenZeppelin security libraries
- ✅ Complete unit test coverage
- ✅ Event logging for all operations
- ✅ Permission control and parameter validation
- ✅ Reentrancy attack protection

### Best Practices

1. **Always test on testnet before mainnet deployment**
2. **Carefully verify all owner addresses**
3. **Set reasonable confirmation ratios**
4. **Regularly backup contract addresses**
5. **Keep private keys and mnemonics secure**

---

## 📚 Tech Stack

### Frontend
- **Next.js 14** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling Framework
- **Wagmi v2** - Web3 React Hooks
- **Viem** - Ethereum Interaction Library
- **React Hot Toast** - Notification Component

### Smart Contracts
- **Solidity 0.8.19** - Contract Language
- **Hardhat** - Development Environment
- **OpenZeppelin** - Security Libraries
- **Ethers.js** - Ethereum Library

### Testing
- **Mocha** - Testing Framework
- **Chai** - Assertion Library
- **Hardhat Network** - Local Test Network

---

## 🔗 Related Links

- **Live Demo**: https://multisig.chain-tools.com
- **GitHub**: https://github.com/0xFannie/multisig-deployer
- **Chain Tools Main Site**: https://chain-tools.com
- **Issue Tracker**: https://github.com/0xFannie/multisig-deployer/issues

---

## 👤 Author

**0xfannie.eth**

- GitHub: [@0xFannie](https://github.com/0xFannie)
- Website: [xifangzhang.work](https://xifangzhang.work)
- Public Wallets:
  - **0xfannie.eth**: `0x36C1ad1E9eB589E20fF739FAD024a7ff3113Ba27`
  - **Catalizer.eth**: `0xF9147fb1c9799fA61bC9a41B28FFf2EE80654fd5`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions welcome! Please check [Contributing Guidelines](CONTRIBUTING.md) (coming soon)

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## ⚠️ Disclaimer

- Test thoroughly before use
- This tool provides no warranties of any kind
- Users assume all risks of use
- Keep your private keys and mnemonics secure
- Recommend testing on testnet first
- MultiSig contract wallets **have no mnemonic or private key**, can only be operated through multi-party signatures

---

<div align="center">

**0xfannie.eth Made with ❤️ for Web3 Community**

[⬆ Back to Top](#多签钱包部署工具--multisig-wallet-deployer)

</div>
