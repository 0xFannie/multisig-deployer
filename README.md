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
- ✅ **交易过期机制**: 类似 Gnosis Safe，支持设置交易过期时间（7/14/21/28天或永不过期），过期后自动失效
- ✅ **合约地址管理**: 输入和保存已部署的合约地址，支持自定义标签
- ✅ **实时状态追踪**: 可视化显示交易确认进度和状态
- ✅ **现代化 UI**: 基于最新设计趋势的美观界面，支持中英文切换
- ✅ **Web3 集成**: 支持 MetaMask、WalletConnect 等主流钱包
- ✅ **多链支持**: 支持 14+ 个 EVM 兼容网络
- ✅ **邮件通知系统**: 自动发送交易审批通知邮件
- ✅ **白名单管理**: 支持收款地址白名单，提高安全性
- ✅ **用户设置**: 邮箱绑定、白名单管理等个人设置功能
- ✅ **交易记录**: 完整的链上和数据库交易记录追踪

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
1. 在"交易管理"页面查看所有交易
2. 点击"发起交易"按钮
3. 选择或输入多签钱包地址
4. 填写收款地址、资产类型和金额
5. 选择过期时间（可选：7/14/21/28天或永不过期）
6. 选择需要确认的所有者
7. 提交交易后，系统自动发送邮件通知审批者
8. 审批者收到邮件后，在"等待我审批的交易"中确认
9. 达到所需确认数后，可执行交易
10. 如果交易在过期时间内未获得足够确认，将自动失效
```

#### 3. 个人设置

```
1. 点击左侧导航栏的"设置"按钮
2. 绑定邮箱：输入邮箱地址，接收验证码并验证
3. 管理白名单：添加、删除、编辑收款地址白名单
4. 白名单地址可在发起交易时快速选择
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
# 创建 .env.local 文件，添加以下配置：
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# RESEND_API_KEY=your_resend_api_key
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
│   ├── DeployedContractsList.tsx   # 合约列表
│   ├── TransactionManager.tsx      # 交易管理
│   ├── TransferModal.tsx           # 转账弹窗
│   ├── UserSettings.tsx            # 用户设置
│   └── MultisigWorkflow.tsx        # 工作流程展示
├── pages/                 # Next.js 页面
│   ├── _app.tsx          # 应用入口
│   ├── index.tsx         # 主页面
│   └── api/              # API 路由
│       ├── users/        # 用户相关 API
│       ├── deployments/  # 部署相关 API
│       ├── transactions/ # 交易相关 API
│       ├── whitelist/    # 白名单相关 API
│       └── analytics/    # 统计相关 API
├── lib/                   # 工具库
│   ├── supabase.ts       # Supabase 客户端
│   └── email.ts          # 邮件发送工具
├── public/                # 静态资源
│   └── locales/          # 国际化文件
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

### 应用安全

- ✅ 环境变量安全存储（`.env.local` 已加入 `.gitignore`）
- ✅ API 密钥仅在服务端使用
- ✅ 邮箱验证码防暴力破解保护
- ✅ 交易审批二次确认机制
- ✅ 白名单地址管理

### 最佳实践

1. **在主网部署前务必在测试网测试**
2. **仔细验证所有所有者地址**
3. **合理设置确认比例**
4. **定期备份合约地址**
5. **保管好私钥和助记词**
6. **使用白名单功能提高安全性**

---

## 📚 技术栈

### 前端
- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Wagmi v2** - Web3 React Hooks
- **Viem** - 以太坊交互库
- **React Hot Toast** - 通知组件
- **next-i18next** - 国际化支持

### 后端
- **Next.js API Routes** - 服务端 API
- **Supabase** - 数据库和用户管理
- **Resend** - 邮件发送服务

### 智能合约
- **Solidity 0.8.19** - 合约语言
- **Hardhat** - 开发环境
- **OpenZeppelin** - 安全库

### 测试
- **Mocha** - 测试框架
- **Chai** - 断言库
- **Hardhat Network** - 本地测试网络

---

## 📖 API 文档

详细的 API 文档请参考 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

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
  - **fannie.sol**: `4SUKuF4jt2ya6No5okHGvk5tsezAZaf3bVHvCf1pNqrC`

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
- ✅ **Transaction Expiration**: Similar to Gnosis Safe, support setting transaction expiration time (7/14/21/28 days or never), transactions automatically expire if not confirmed in time
- ✅ **Contract Address Management**: Input and save deployed contract addresses with custom labels
- ✅ **Real-time Status Tracking**: Visual display of transaction confirmation progress and status
- ✅ **Modern UI**: Beautiful interface based on latest design trends with English/Chinese support
- ✅ **Web3 Integration**: Support mainstream wallets like MetaMask, WalletConnect
- ✅ **Multi-Chain Support**: Support 14+ EVM-compatible networks
- ✅ **Email Notification System**: Automatically send transaction approval notification emails
- ✅ **Whitelist Management**: Support recipient address whitelist for enhanced security
- ✅ **User Settings**: Email binding, whitelist management and other personal settings
- ✅ **Transaction Records**: Complete on-chain and database transaction tracking

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
1. View all transactions in "Transaction Management" page
2. Click "Initiate Transaction" button
3. Select or input MultiSig wallet address
4. Fill in recipient address, asset type and amount
5. Select expiration time (optional: 7/14/21/28 days or never)
6. Select owners for approval
7. After submission, system automatically sends email notifications to approvers
8. Approvers receive emails and confirm in "Pending Approvals" section
9. Execute transaction after required confirmations reached
10. If transaction doesn't receive enough confirmations before expiration, it will automatically expire
```

#### 3. Personal Settings

```
1. Click "Settings" button in left sidebar
2. Bind Email: Enter email address, receive and verify code
3. Manage Whitelist: Add, delete, edit recipient address whitelist
4. Whitelist addresses can be quickly selected when initiating transactions
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
# Create .env.local file with following configuration:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# RESEND_API_KEY=your_resend_api_key
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
│   ├── DeployedContractsList.tsx   # Contract list
│   ├── TransactionManager.tsx      # Transaction management
│   ├── TransferModal.tsx           # Transfer modal
│   ├── UserSettings.tsx            # User settings
│   └── MultisigWorkflow.tsx        # Workflow display
├── pages/                 # Next.js pages
│   ├── _app.tsx          # App entry
│   ├── index.tsx         # Main page
│   └── api/              # API routes
│       ├── users/        # User related APIs
│       ├── deployments/  # Deployment related APIs
│       ├── transactions/ # Transaction related APIs
│       ├── whitelist/    # Whitelist related APIs
│       └── analytics/    # Analytics related APIs
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client
│   └── email.ts          # Email sending utility
├── public/                # Static assets
│   └── locales/          # i18n files
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

### Application Security

- ✅ Secure environment variable storage (`.env.local` added to `.gitignore`)
- ✅ API keys only used on server-side, never exposed to client
- ✅ Service Role Key only used on server-side, never exposed to frontend
- ✅ Email verification code brute-force protection
- ✅ Transaction approval double confirmation
- ✅ Whitelist address management
- ✅ Transaction expiration mechanism prevents long-pending transactions

### Best Practices

1. **Always test on testnet before mainnet deployment**
2. **Carefully verify all owner addresses**
3. **Set reasonable confirmation ratios**
4. **Regularly backup contract addresses**
5. **Keep private keys and mnemonics secure**
6. **Use whitelist feature for enhanced security**

---

## 📚 Tech Stack

### Frontend
- **Next.js 14** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling Framework
- **Wagmi v2** - Web3 React Hooks
- **Viem** - Ethereum Interaction Library
- **React Hot Toast** - Notification Component
- **next-i18next** - Internationalization Support

### Backend
- **Next.js API Routes** - Server-side APIs
- **Supabase** - Database and User Management
- **Resend** - Email Sending Service

### Smart Contracts
- **Solidity 0.8.19** - Contract Language
- **Hardhat** - Development Environment
- **OpenZeppelin** - Security Libraries

### Testing
- **Mocha** - Testing Framework
- **Chai** - Assertion Library
- **Hardhat Network** - Local Test Network

---

## 📖 API Documentation

Detailed API documentation can be found in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

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
  - **fannie.sol**: `4SUKuF4jt2ya6No5okHGvk5tsezAZaf3bVHvCf1pNqrC`

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
