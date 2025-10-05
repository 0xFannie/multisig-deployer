# 多签钱包部署工具 (MultiSig Wallet Deployer)

企业级多签名钱包智能合约管理系统，支持完整的链上多签交易流程。

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Solidity](https://img.shields.io/badge/solidity-0.8.19-brightgreen)
![Next.js](https://img.shields.io/badge/next.js-13.5-black)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## 🎯 产品功能概述

这是一个**完整的链上多签钱包管理系统**，允许多个钱包所有者共同管理资金。任何资产转出都需要指定数量的所有者签名确认。

### ✨ 核心特性

- ✅ **安全的多签机制**: 支持 M-of-N 多签方案（如 2/3, 3/5 等）
- ✅ **完整的交易管理**: 提交、确认、撤销、执行交易的完整流程
- ✅ **实时状态追踪**: 可视化显示交易确认进度
- ✅ **现代化 UI**: 基于最新设计趋势的美观界面
- ✅ **Web3 集成**: 支持 MetaMask、WalletConnect 等主流钱包
- ✅ **多链支持**: 支持以太坊、Polygon、BSC、Arbitrum 等多个网络
- ✅ **完善的测试**: 14 个单元测试全部通过

---

## 🚀 快速开始

### 前置要求

- Node.js 16+ 和 npm
- MetaMask 或其他 Web3 钱包
- 测试网或主网的代币（用于支付 Gas 费用）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 填入必要的配置：

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

---

## 📋 完整使用流程

### 第一步：部署多签钱包合约

#### 方式 A：使用前端界面部署（推荐）

1. **连接钱包**
   - 点击右上角"连接钱包"按钮
   - 使用 MetaMask 或其他 Web3 钱包连接

2. **切换到"部署新合约"标签页**

3. **配置多签钱包**
   - **添加所有者地址**：输入所有共同管理钱包的地址
     - 可以点击"使用当前地址"快速添加自己的地址
     - 点击"添加地址"按钮添加更多所有者
   - **设置所需确认数**：例如 3 个所有者需要 2 人确认
     - 2/3 表示：任何交易需要 3 个人中至少 2 个人确认才能执行

4. **点击"部署多签钱包"按钮**
   - 确认 MetaMask 弹出的交易
   - 等待合约部署完成
   - 记录部署成功后的合约地址

#### 方式 B：使用命令行部署

编辑 `scripts/deploy.js` 文件，配置所有者和确认数：

```javascript
const owners = [
  "0x地址1",
  "0x地址2",
  "0x地址3",
];

const numConfirmationsRequired = 2; // 需要 2/3 个所有者确认
```

然后运行部署命令：

```bash
# Sepolia 测试网
npx hardhat run scripts/deploy.js --network sepolia

# Mumbai 测试网
npx hardhat run scripts/deploy.js --network mumbai

# BSC 测试网
npx hardhat run scripts/deploy.js --network bscTestnet

# 本地测试
npx hardhat run scripts/deploy.js --network localhost
```

### 第二步：向多签钱包充值

多签钱包部署后，需要向其充值才能进行转账操作。

**充值方法：**
1. 使用 MetaMask 或任何钱包
2. 向多签钱包合约地址转入 ETH 或其他代币
3. 在"查看合约"标签页可以看到钱包余额

### 第三步：提交转账交易

现在可以使用多签钱包转账了！

1. **切换到"交易管理"标签页**

2. **点击"提交新交易"按钮**

3. **填写转账信息**
   - **接收地址**：输入要转给谁的地址
   - **转账金额**：输入要转多少 ETH

4. **提交交易**
   - 这时交易还不会立即执行
   - 交易进入"待处理"状态
   - 需要其他所有者确认

### 第四步：其他所有者确认交易

1. **其他所有者登录系统**
   - 使用他们自己的钱包地址登录
   - 切换到"交易管理"标签页

2. **查看待处理交易**
   - 可以看到刚才提交的交易
   - 显示交易详情：接收地址、转账金额
   - 显示当前确认进度：例如 "1 / 2"

3. **点击"确认"按钮**
   - 每个所有者确认后，确认数会增加
   - 当确认数达到要求时，交易状态变为"可执行"

4. **（可选）撤销确认**
   - 如果改变主意，可以点击"撤销确认"

### 第五步：执行交易

当交易获得足够的确认后：

1. **任何所有者都可以执行**
   - 在交易卡片上会出现"执行交易"按钮
   - 按钮呈绿色高亮显示

2. **点击"执行交易"**
   - 确认 MetaMask 弹出的交易
   - 交易会真正执行，ETH 会转出
   - 交易移动到"已完成交易"列表

---

## 🎨 UI 功能说明

### 查看合约（View）
- 显示钱包基本信息
- 合约地址、余额、所有者列表
- 所需确认数、总交易数
- 当前用户权限状态

### 交易管理（Transactions）⭐
**核心功能页面！**
- ✅ 提交新的转账交易
- ✅ 查看待处理交易列表
- ✅ 确认其他人提交的交易
- ✅ 撤销自己的确认
- ✅ 执行已获批准的交易
- ✅ 查看已完成的交易历史

### 部署新合约（Deploy）
- 创建新的多签钱包
- 配置所有者和确认数
- 一键部署到区块链

---

## ⚡ 快速操作指南

### 示例：转账 1 ETH（以 2/3 多签为例）

1. **你（所有者 A）：**
   - 进入"交易管理"
   - 点击"提交新交易"
   - 填写朋友地址和 1 ETH
   - 提交 → 交易状态：1/2 确认

2. **所有者 B：**
   - 进入"交易管理"
   - 看到你的交易请求
   - 点击"确认"
   - 确认成功 → 交易状态：2/2 确认，可执行 ✅

3. **任何所有者：**
   - 点击"执行交易"
   - 交易执行，1 ETH 转给朋友 🎉

---

## 💡 实际使用场景

### 场景 1：公司资金管理
- **3 个合伙人，需要 2 人确认**
- 任何支出都需要至少 2 个合伙人同意
- 避免单人控制公司资金

### 场景 2：DAO 金库管理
- **5 个理事会成员，需要 3 人确认**
- 提案通过后，由理事会成员确认执行
- 确保资金使用符合社区意愿

### 场景 3：家庭资产管理
- **夫妻二人，需要 2 人确认**
- 大额支出需要双方同意
- 增加家庭财务透明度

### 场景 4：项目资金托管
- **投资人 + 创始人，需要双方确认**
- 资金使用需要双方同意
- 保护双方利益

---

## 🔐 安全特性

### 1. **多重签名保护**
- 单个钱包无法单独转移资金
- 必须获得设定数量的确认才能执行

### 2. **透明可追溯**
- 所有交易都在链上记录
- 每个确认都有对应的交易哈希
- 可以在区块浏览器查看完整历史

### 3. **灵活的确认机制**
- 可以撤销自己的确认
- 未执行的交易随时可以被撤回

---

## 🛠️ 技术架构

### 智能合约功能

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
isConfirmed(uint256 txIndex, address owner) returns (bool)
```

### 技术栈

- **智能合约**: Solidity 0.8.19
- **开发框架**: Hardhat
- **前端**: Next.js 13, React 18, TypeScript
- **Web3**: Wagmi, Viem, RainbowKit
- **样式**: Tailwind CSS (使用现代配色方案)
- **图标**: Lucide React
- **测试**: Hardhat Toolbox (Mocha, Chai, Ethers.js)

---

## 📦 部署到生产环境

### 验证合约（可选）

部署后，在区块链浏览器上验证合约：

```bash
npx hardhat verify --network sepolia <合约地址> '["0x地址1","0x地址2","0x地址3"]' 2
```

### 生产构建

```bash
npm run build
npm run start
```

---

## 🔗 支持的网络

| 网络 | Chain ID | 配置名称 | 状态 |
|------|----------|----------|------|
| Ethereum Mainnet | 1 | mainnet | ✅ 主网 |
| Ethereum Sepolia | 11155111 | sepolia | ✅ 测试网 |
| Polygon | 137 | polygon | ✅ 主网 |
| Polygon Mumbai | 80001 | mumbai | ✅ 测试网 |
| BSC | 56 | bsc | ✅ 主网 |
| BSC Testnet | 97 | bscTestnet | ✅ 测试网 |
| Arbitrum One | 42161 | arbitrum | ✅ 主网 |

---

## 📚 项目结构

```
multisig-deployer/
├── contracts/              # Solidity 智能合约
│   └── MultiSigWallet.sol
├── scripts/                # 部署脚本
│   └── deploy.js
├── test/                   # 测试文件
│   └── MultiSigWallet.test.js
├── pages/                  # Next.js 页面
│   ├── _app.tsx
│   └── index.tsx
├── components/             # React 组件
│   ├── MultiSigDeployer.tsx
│   ├── MultiSigWalletViewer.tsx
│   └── TransactionManager.tsx
├── lib/                    # 工具库
│   ├── contracts.ts
│   ├── networks.ts
│   └── web3Config.ts
├── styles/                 # 样式文件
│   └── globals.css
├── hardhat.config.js       # Hardhat 配置
├── tailwind.config.js      # Tailwind 配置
└── package.json
```

---

## 🔧 可用命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run start      # 启动生产服务器
npm run compile    # 编译智能合约
npm run test       # 运行测试
npm run deploy     # 部署合约（需指定网络）
```

### Gas 报告

```bash
REPORT_GAS=true npm run test
```

---

## 📝 常见问题

### Q: 部署需要多少 Gas？
A: 约 1.5-2.5M Gas，具体取决于所有者数量。在 Sepolia 测试网上部署通常需要 < 0.01 ETH。

### Q: 可以修改所有者或确认数吗？
A: 当前版本部署后无法修改。如需修改，需要部署新合约并转移资金。

### Q: 如何转移合约中的资金？
A: 通过"交易管理"标签页提交转账交易，获得足够确认后执行。

### Q: 支持 ERC20 代币吗？
A: 是的，智能合约支持。前端暂时只支持 ETH 转账，ERC20 需要通过合约直接调用。

### Q: 每次操作需要支付多少 Gas？
- 提交交易：~80,000 Gas
- 确认交易：~50,000 Gas
- 执行交易：~60,000 Gas + 转账成本

---

## 🛡️ 安全建议

1. ✅ **测试优先**：先在测试网充分测试
2. ✅ **密钥管理**：使用硬件钱包管理所有者私钥
3. ✅ **合理设置确认数**：避免过低（不安全）或过高（难以执行）
4. ✅ **审计合约**：重要项目建议进行专业审计
5. ✅ **备份地址**：确保所有所有者地址都有备份
6. ✅ **监控交易**：定期检查待处理交易
7. ✅ **网络确认**：确保所有所有者连接到相同的网络

---

## 🧪 开发和测试

### 本地测试

```bash
# 启动本地节点
npx hardhat node

# 在另一个终端部署
npx hardhat run scripts/deploy.js --network localhost

# 运行测试
npm run test
```

### 测试覆盖率

项目包含 14 个全面的单元测试，覆盖：
- ✅ 合约部署和初始化
- ✅ 所有者权限验证
- ✅ 交易提交、确认、撤销
- ✅ 交易执行和失败场景
- ✅ 边界条件和错误处理

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📞 支持

如有问题或建议，请：
- 提交 GitHub Issue
- 查看代码注释和文档
- 参考测试文件了解使用方法

---

## ⚠️ 免责声明

本项目仅供学习和参考使用。使用本项目产生的任何损失，开发者不承担责任。请在充分理解代码和风险的情况下使用。

**重要提示：**
- 在主网使用前务必进行充分测试
- 理解智能合约的工作原理
- 做好私钥和资产安全管理
- 考虑进行专业的安全审计

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️**

0xFannie.eth Made with ❤️ for Web3 Community

</div>
