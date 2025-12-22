# Vercel 部署指南 | Vercel Deployment Guide

## 🇨🇳 中文指南

### 前置准备

1. **GitHub 仓库已准备好**
   - 确保代码已推送到 https://github.com/0xFannie/multisig-deployer
   - 确保 `.env.local` 文件已添加到 `.gitignore`（不会提交到仓库）

2. **准备环境变量值**
   - Supabase 项目 URL 和密钥
   - Resend API Key
   - WalletConnect Project ID
   - RPC URLs（可选）

### 部署步骤

#### 1. 登录 Vercel

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 授权 Vercel 访问你的 GitHub 仓库

#### 2. 导入项目

1. 点击 **"Add New Project"** 或 **"Import Project"**
2. 选择 **"Import Git Repository"**
3. 搜索并选择 `0xFannie/multisig-deployer`
4. 点击 **"Import"**

#### 3. 配置项目设置

**Framework Preset**: Next.js（会自动检测）

**Root Directory**: `./`（默认）

**Build Command**: `npm run build`（默认）

**Output Directory**: `.next`（默认）

**Install Command**: `npm install`（默认）

#### 4. 配置环境变量

点击 **"Environment Variables"** 标签，添加以下环境变量：

##### 🔐 必需的环境变量（Required）

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

##### 🌐 可选的环境变量（Optional - 使用默认值也可以）

```bash
# RPC URLs（如果不设置，会使用代码中的默认公共 RPC）
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed.binance.org
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://mainnet.optimism.io
NEXT_PUBLIC_AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
NEXT_PUBLIC_FANTOM_RPC_URL=https://rpc.ftm.tools
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_LINEA_RPC_URL=https://rpc.linea.build
NEXT_PUBLIC_ZKSYNC_RPC_URL=https://mainnet.era.zksync.io
NEXT_PUBLIC_SCROLL_RPC_URL=https://rpc.scroll.io
NEXT_PUBLIC_POLYGON_ZKEVM_RPC_URL=https://zkevm-rpc.com
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_GOERLI_RPC_URL=https://rpc.ankr.com/eth_goerli

# Infura API Key（用于测试网，可选）
NEXT_PUBLIC_INFURA_KEY=your_infura_api_key

# Etherscan API Keys（用于合约验证，可选）
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

##### 📝 环境变量配置说明

1. **为每个环境分别配置**：
   - **Production**（生产环境）
   - **Preview**（预览环境）
   - **Development**（开发环境）

2. **添加方式**：
   - 点击 **"Add"** 按钮
   - 输入 Key 和 Value
   - 选择适用的环境（Production/Preview/Development）
   - 点击 **"Save"**

3. **安全提示**：
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` 和 `RESEND_API_KEY` 只在服务端使用，不会暴露到客户端
   - ✅ 所有 `NEXT_PUBLIC_*` 开头的变量会暴露到客户端，确保这些是安全的公开配置
   - ✅ 不要在环境变量中存储私钥或敏感信息

#### 5. 部署

1. 确认所有环境变量已添加
2. 点击 **"Deploy"** 按钮
3. 等待构建完成（通常需要 2-5 分钟）

#### 6. 验证部署

1. 部署完成后，Vercel 会提供一个 URL（例如：`https://multisig-deployer.vercel.app`）
2. 访问该 URL 测试应用功能
3. 检查浏览器控制台是否有错误
4. 测试钱包连接功能
5. 测试部署合约功能

### 自定义域名（可选）

1. 在 Vercel 项目设置中，点击 **"Domains"**
2. 输入你的域名（例如：`multisig.chain-tools.com`）
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常需要几分钟到几小时）

### 持续部署

- ✅ Vercel 会自动监听 GitHub 仓库的推送
- ✅ 每次推送到 `main` 分支会自动触发生产环境部署
- ✅ 每次创建 Pull Request 会自动创建预览环境

### 常见问题排查

#### 1. 构建失败

**问题**: Build failed

**解决方案**:
- 检查环境变量是否全部配置
- 查看构建日志中的错误信息
- 确保 `package.json` 中的依赖版本正确

#### 2. 运行时错误

**问题**: Application error

**解决方案**:
- 检查环境变量是否正确配置
- 检查 Supabase 连接是否正常
- 查看 Vercel 函数日志（Function Logs）

#### 3. 数据库连接失败

**问题**: Supabase connection failed

**解决方案**:
- 确认 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 正确
- 确认 `SUPABASE_SERVICE_ROLE_KEY` 正确
- 检查 Supabase 项目的网络访问设置

#### 4. 邮件发送失败

**问题**: Email sending failed

**解决方案**:
- 确认 `RESEND_API_KEY` 正确
- 检查 Resend 账户状态和额度
- 确认发件人域名已验证（如果需要）

### 监控和日志

1. **函数日志**：
   - 在 Vercel Dashboard 中，点击 **"Functions"** 标签
   - 查看 API 路由的执行日志

2. **实时日志**：
   - 在项目设置中启用 **"Real-time Logs"**
   - 实时查看应用运行情况

3. **性能监控**：
   - Vercel Analytics（需要升级到 Pro 计划）
   - 自定义监控工具

---

## 🇬🇧 English Guide

### Prerequisites

1. **GitHub Repository Ready**
   - Ensure code is pushed to https://github.com/0xFannie/multisig-deployer
   - Ensure `.env.local` is in `.gitignore` (won't be committed)

2. **Prepare Environment Variable Values**
   - Supabase project URL and keys
   - Resend API Key
   - WalletConnect Project ID
   - RPC URLs (optional)

### Deployment Steps

#### 1. Login to Vercel

1. Visit [https://vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Authorize Vercel to access your GitHub repositories

#### 2. Import Project

1. Click **"Add New Project"** or **"Import Project"**
2. Select **"Import Git Repository"**
3. Search and select `0xFannie/multisig-deployer`
4. Click **"Import"**

#### 3. Configure Project Settings

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `./` (default)

**Build Command**: `npm run build` (default)

**Output Directory**: `.next` (default)

**Install Command**: `npm install` (default)

#### 4. Configure Environment Variables

Click the **"Environment Variables"** tab and add the following:

##### 🔐 Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

##### 🌐 Optional Environment Variables (Defaults will be used if not set)

```bash
# RPC URLs (If not set, default public RPCs will be used)
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed.binance.org
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://mainnet.optimism.io
NEXT_PUBLIC_AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
NEXT_PUBLIC_FANTOM_RPC_URL=https://rpc.ftm.tools
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_LINEA_RPC_URL=https://rpc.linea.build
NEXT_PUBLIC_ZKSYNC_RPC_URL=https://mainnet.era.zksync.io
NEXT_PUBLIC_SCROLL_RPC_URL=https://rpc.scroll.io
NEXT_PUBLIC_POLYGON_ZKEVM_RPC_URL=https://zkevm-rpc.com
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_GOERLI_RPC_URL=https://rpc.ankr.com/eth_goerli

# Infura API Key (for testnets, optional)
NEXT_PUBLIC_INFURA_KEY=your_infura_api_key

# Etherscan API Keys (for contract verification, optional)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

##### 📝 Environment Variable Configuration Notes

1. **Configure for each environment separately**:
   - **Production**
   - **Preview**
   - **Development**

2. **How to add**:
   - Click **"Add"** button
   - Enter Key and Value
   - Select applicable environments (Production/Preview/Development)
   - Click **"Save"**

3. **Security Notes**:
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are only used server-side, never exposed to client
   - ✅ All `NEXT_PUBLIC_*` variables are exposed to client, ensure these are safe public configurations
   - ✅ Never store private keys or sensitive information in environment variables

#### 5. Deploy

1. Confirm all environment variables are added
2. Click **"Deploy"** button
3. Wait for build to complete (usually 2-5 minutes)

#### 6. Verify Deployment

1. After deployment, Vercel will provide a URL (e.g., `https://multisig-deployer.vercel.app`)
2. Visit the URL to test application functionality
3. Check browser console for errors
4. Test wallet connection functionality
5. Test contract deployment functionality

### Custom Domain (Optional)

1. In Vercel project settings, click **"Domains"**
2. Enter your domain (e.g., `multisig.chain-tools.com`)
3. Follow instructions to configure DNS records
4. Wait for DNS to propagate (usually minutes to hours)

### Continuous Deployment

- ✅ Vercel automatically monitors GitHub repository pushes
- ✅ Each push to `main` branch automatically triggers production deployment
- ✅ Each Pull Request automatically creates a preview environment

### Troubleshooting

#### 1. Build Failed

**Issue**: Build failed

**Solution**:
- Check if all environment variables are configured
- Review error messages in build logs
- Ensure dependency versions in `package.json` are correct

#### 2. Runtime Error

**Issue**: Application error

**Solution**:
- Check if environment variables are correctly configured
- Check if Supabase connection is working
- Review Vercel function logs (Function Logs)

#### 3. Database Connection Failed

**Issue**: Supabase connection failed

**Solution**:
- Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase project network access settings

#### 4. Email Sending Failed

**Issue**: Email sending failed

**Solution**:
- Confirm `RESEND_API_KEY` is correct
- Check Resend account status and quota
- Confirm sender domain is verified (if required)

### Monitoring and Logs

1. **Function Logs**:
   - In Vercel Dashboard, click **"Functions"** tab
   - View execution logs for API routes

2. **Real-time Logs**:
   - Enable **"Real-time Logs"** in project settings
   - View real-time application activity

3. **Performance Monitoring**:
   - Vercel Analytics (requires Pro plan upgrade)
   - Custom monitoring tools

---

## 📋 环境变量检查清单 | Environment Variables Checklist

在部署前，请确认以下环境变量已配置：

### ✅ 必需变量（Required）

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### ✅ 推荐配置（Recommended）

- [ ] `NEXT_PUBLIC_ETHEREUM_RPC_URL`
- [ ] `NEXT_PUBLIC_POLYGON_RPC_URL`
- [ ] `NEXT_PUBLIC_BSC_RPC_URL`
- [ ] `NEXT_PUBLIC_ARBITRUM_RPC_URL`

### ✅ 可选配置（Optional）

- [ ] 其他 RPC URLs
- [ ] `NEXT_PUBLIC_INFURA_KEY`
- [ ] `ETHERSCAN_API_KEY`
- [ ] `POLYGONSCAN_API_KEY`

---

## 🔗 相关链接 | Related Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Dashboard**: https://app.supabase.com
- **Resend Dashboard**: https://resend.com/dashboard
- **WalletConnect Cloud**: https://cloud.walletconnect.com

---

**Made with ❤️ by 0xfannie.eth**

