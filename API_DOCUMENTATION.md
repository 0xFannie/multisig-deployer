# API 文档 | API Documentation

## 📖 Language | 语言

- [🇨🇳 中文](#中文文档)
- [🇬🇧 English](#english-documentation)

---

<a name="中文文档"></a>

# 🇨🇳 中文文档

## 📍 API 端点列表

所有 API 端点都位于 `/api` 路径下。

### 用户相关 API

#### 1. 钱包连接
**POST** `/api/users/connect`

连接钱包并创建/更新用户记录。

**请求体：**
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Sign in to Chain Tools"
}
```

**响应：**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "walletAddress": "0x...",
    "email": "user@example.com"
  }
}
```

#### 2. 绑定邮箱
**POST** `/api/users/bind-email`

发送邮箱验证码。

**请求体：**
```json
{
  "userId": "uuid",
  "email": "user@example.com"
}
```

**响应：**
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

#### 3. 验证邮箱
**POST** `/api/users/verify-email`

验证邮箱验证码并绑定邮箱。

**请求体：**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "code": "123456"
}
```

**响应：**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 4. 获取用户信息
**POST** `/api/users/get-info`

获取用户的详细信息（邮箱、验证状态等）。

**请求体：**
```json
{
  "userId": "uuid"
}
```

**响应：**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "wallet_address": "0x...",
    "email": "user@example.com",
    "email_verified_at": "2025-12-21T10:00:00Z"
  }
}
```

#### 5. 解绑邮箱
**POST** `/api/users/unbind-email`

解绑用户的邮箱。

**请求体：**
```json
{
  "userId": "uuid"
}
```

**响应：**
```json
{
  "success": true,
  "message": "Email unbound successfully"
}
```

#### 6. 获取邮箱地址
**POST** `/api/users/get-emails`

批量获取钱包地址对应的已验证邮箱。

**请求体：**
```json
{
  "walletAddresses": ["0x...", "0x..."]
}
```

**响应：**
```json
{
  "success": true,
  "emails": {
    "0x...": "user1@example.com",
    "0x...": "user2@example.com"
  }
}
```

### 部署相关 API

#### 7. 记录部署
**POST** `/api/deployments/record`

记录多签钱包部署信息。

**请求体：**
```json
{
  "userId": "uuid",
  "contractAddress": "0x...",
  "network": "ethereum",
  "contractType": "multisig",
  "owners": ["0x...", "0x..."],
  "threshold": 2,
  "transactionHash": "0x...",
  "gasUsed": "100000",
  "gasCost": "0.01",
  "tags": "小蜜蜂 Little Bee"
}
```

**响应：**
```json
{
  "success": true,
  "deployment": {
    "id": "uuid",
    "contract_address": "0x...",
    "network": "ethereum",
    "tags": "小蜜蜂 Little Bee",
    ...
  }
}
```

#### 8. 获取部署列表
**GET** `/api/deployments/list`

获取用户的所有部署记录。

**查询参数：**
- `userId` (string, required) - 用户 ID

**响应：**
```json
{
  "success": true,
  "deployments": [
    {
      "id": "uuid",
      "contract_address": "0x...",
      "network": "ethereum",
      "tags": "小蜜蜂 Little Bee",
      ...
    }
  ]
}
```

#### 9. 更新标签
**PUT** `/api/deployments/update-tags`

更新多签钱包的自定义标签。

**请求体：**
```json
{
  "userId": "uuid",
  "contractAddress": "0x...",
  "tags": "新标签名称"
}
```

**响应：**
```json
{
  "success": true,
  "deployment": {
    "id": "uuid",
    "tags": "新标签名称",
    ...
  }
}
```

### 交易相关 API

#### 10. 提交交易
**POST** `/api/transactions/submit`

记录用户提交的多签交易。

**请求体：**
```json
{
  "userId": "uuid",
  "contractAddress": "0x...",
  "network": "polygon",
  "txIndex": 0,
  "to": "0x...",
  "value": "1000000000000000000",
  "assetType": "native",
  "assetAddress": null,
  "submittedBy": "0x...",
  "transactionHash": "0x...",
  "expirationTime": 1735689600
}
```

**注意：** 
- `is_whitelisted_recipient` 字段会在后端自动计算（检查收款地址是否在发起人的白名单中），无需在请求中提供。
- `expirationTime` 字段为可选的 Unix 时间戳（秒），表示交易过期时间。如果未提供或为 `null`，表示交易永不过期。过期后的交易将无法被确认或执行。

**响应：**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "tx_index": 0,
    "to_address": "0x...",
    "value": "1000000000000000000",
    "status": "pending",
    "is_whitelisted_recipient": false,
    "expiration_time": "2025-12-29T00:00:00Z",
    ...
  }
}
```

#### 11. 批准交易
**POST** `/api/transactions/approve`

记录用户对交易的批准。

**请求体：**
```json
{
  "userId": "uuid",
  "transactionId": "uuid",
  "approvedBy": "0x...",
  "transactionHash": "0x..."
}
```

**响应：**
```json
{
  "success": true,
  "approval": {
    "id": "uuid",
    "approved_by": "0x...",
    "approved_at": "2025-12-21T10:00:00Z"
  },
  "transaction": {
    "current_confirmations": 1,
    ...
  }
}
```

#### 12. 执行交易
**POST** `/api/transactions/execute`

记录交易的最终执行。

**请求体：**
```json
{
  "userId": "uuid",
  "transactionId": "uuid",
  "executedBy": "0x...",
  "transactionHash": "0x...",
  "gasUsed": "100000",
  "gasCost": "0.01"
}
```

**响应：**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "status": "executed",
    "executed_at": "2025-12-21T10:30:00Z",
    "execution_transaction_hash": "0x...",
    ...
  }
}
```

#### 13. 发送审批通知
**POST** `/api/transactions/send-approval-notifications`

向所有需要审批的所有者发送邮件通知。

**请求体：**
```json
{
  "transactionId": "uuid",
  "contractAddress": "0x...",
  "network": "polygon"
}
```

**响应：**
```json
{
  "success": true,
  "emailsSent": 2,
  "emailsTotal": 2,
  "results": [
    {
      "email": "user1@example.com",
      "success": true
    },
    {
      "email": "user2@example.com",
      "success": true
    }
  ]
}
```

#### 14. 获取我的所有交易
**GET** `/api/transactions/my-transactions`

获取当前用户相关的所有多签交易（作为发起人或审批者）。

**查询参数：**
- `userId` (string, required) - 用户 ID
- `walletAddress` (string, required) - 钱包地址

**响应：**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "contract_address": "0x...",
      "network": "polygon",
      "tx_index": 0,
      "to_address": "0x...",
      "value": "1000000000000000000",
      "asset_type": "native",
      "submitted_by": "0x...",
      "status": "pending",
      "current_confirmations": 1,
      "required_confirmations": 2,
      "expiration_time": "2025-12-29T00:00:00Z",
      "userRole": "submitter",
      "userApprovedAt": null,
      "transaction_approvals": [
        {
          "approved_by": "0x...",
          "approved_at": "2025-12-21T10:00:00Z"
        }
      ],
      "multisig_deployments": {
        "contract_address": "0x...",
        "network": "polygon",
        "owners": ["0x...", "0x..."],
        "threshold": 2
      }
    }
  ]
}
```

#### 15. 获取待审批交易
**GET** `/api/transactions/pending-approvals`

获取等待当前用户审批的交易。

**查询参数：**
- `userId` (string, required) - 用户 ID
- `walletAddress` (string, required) - 钱包地址

**响应：**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "contract_address": "0x...",
      "network": "polygon",
      "tx_index": 0,
      "to_address": "0x...",
      "value": "1000000000000000000",
      "asset_type": "native",
      "submitted_by": "0x...",
      "status": "pending",
      "current_confirmations": 1,
      "required_confirmations": 2,
      "expiration_time": "2025-12-29T00:00:00Z",
      "transaction_approvals": [],
      "multisig_deployments": {
        "contract_address": "0x...",
        "network": "polygon",
        "owners": ["0x...", "0x..."],
        "threshold": 2
      }
    }
  ]
}
```

### 白名单相关 API

#### 16. 获取白名单列表
**GET** `/api/whitelist/list`

获取当前用户的白名单收款地址列表。

**查询参数：**
- `userId` (string, required) - 用户 ID

**响应：**
```json
{
  "success": true,
  "whitelist": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "recipient_address": "0x...",
      "label": "合作伙伴钱包",
      "created_at": "2025-12-21T10:00:00Z"
    }
  ]
}
```

#### 17. 添加/更新白名单
**POST** `/api/whitelist/add`

添加新的白名单收款地址或更新现有地址的标签。

**请求体：**
```json
{
  "userId": "uuid",
  "recipientAddress": "0x...",
  "label": "合作伙伴钱包"
}
```

**响应：**
```json
{
  "success": true,
  "whitelist": {
    "id": "uuid",
    "user_id": "uuid",
    "recipient_address": "0x...",
    "label": "合作伙伴钱包",
    "created_at": "2025-12-21T10:00:00Z"
  },
  "message": "Whitelist added"
}
```

#### 18. 删除白名单
**DELETE** `/api/whitelist/delete`

删除白名单中的收款地址。

**查询参数：**
- `userId` (string, required) - 用户 ID
- `whitelistId` (string, required) - 白名单记录 ID

**响应：**
```json
{
  "success": true,
  "message": "Whitelist deleted"
}
```

#### 19. 管理员查看所有白名单
**GET** `/api/whitelist/admin-list`

管理员查看所有用户的白名单（需要管理员权限）。

**响应：**
```json
{
  "success": true,
  "whitelist": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "recipient_address": "0x...",
      "label": "合作伙伴钱包",
      "created_at": "2025-12-21T10:00:00Z",
      "users": {
        "wallet_address": "0x...",
        "email": "user@example.com"
      }
    }
  ]
}
```

### 统计相关 API

#### 20. 获取统计数据
**GET** `/api/analytics/stats`

获取平台统计数据。

**响应：**
```json
{
  "success": true,
  "stats": {
    "totalDeployments": 100,
    "totalUsers": 50,
    "deploymentsByNetwork": {
      "ethereum": 60,
      "polygon": 40
    },
    "dailyDeployments": {
      "2025-12-20": 5,
      "2025-12-21": 3
    }
  }
}
```

## 🔧 前端调用示例

### 使用 fetch

```typescript
// 连接钱包
const connectWallet = async (walletAddress: string, signature: string, message: string) => {
  const response = await fetch('/api/users/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      signature,
      message
    })
  })
  
  const data = await response.json()
  return data
}

// 记录部署
const recordDeployment = async (deploymentData: any) => {
  const response = await fetch('/api/deployments/record', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deploymentData)
  })
  
  const data = await response.json()
  return data
}
```

### 使用 axios

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// 连接钱包
const connectWallet = async (walletAddress: string, signature: string, message: string) => {
  const { data } = await api.post('/users/connect', {
    walletAddress,
    signature,
    message
  })
  return data
}
```

## 🗄️ 数据库表结构

### users
- `id` (uuid, primary key)
- `wallet_address` (text, unique)
- `email` (text, nullable)
- `email_verified_at` (timestamp, nullable)
- `last_login_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### email_verifications
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `email` (text)
- `verification_code` (text)
- `expires_at` (timestamp)
- `verified` (boolean, default false)
- `created_at` (timestamp)

### multisig_deployments
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `contract_address` (text)
- `network` (text)
- `contract_type` (text)
- `owners` (jsonb)
- `threshold` (integer)
- `transaction_hash` (text, nullable)
- `deployment_gas_used` (text, nullable)
- `deployment_gas_cost` (text, nullable)
- `status` (text, default 'success')
- `tags` (varchar(255), nullable) - 用户自定义标签
- `created_at` (timestamp)

### multisig_transactions
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `deployment_id` (uuid, foreign key -> multisig_deployments.id)
- `contract_address` (text)
- `network` (text)
- `tx_index` (integer) - 合约中的交易索引
- `to_address` (text) - 接收地址
- `value` (text) - 转账金额
- `asset_type` (text) - 'native', 'usdt', 'usdc', 'usdcNative', etc.
- `asset_address` (text, nullable) - 代币合约地址
- `submitted_by` (text) - 提交者地址
- `transaction_hash` (text, nullable) - 提交交易哈希
- `status` (text) - 'pending', 'executed', 'cancelled'
- `current_confirmations` (integer)
- `required_confirmations` (integer)
- `is_whitelisted_recipient` (boolean, nullable) - 收款人是否在发起人的白名单中
- `expiration_time` (timestamp with time zone, nullable) - 交易过期时间，过期后无法确认或执行
- `notification_sent_at` (timestamp, nullable) - 邮件通知发送时间
- `executed_by` (text, nullable) - 执行者地址
- `executed_at` (timestamp, nullable) - 执行时间
- `execution_transaction_hash` (text, nullable) - 执行交易哈希
- `execution_gas_used` (text, nullable)
- `execution_gas_cost` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### transaction_approvals
- `id` (uuid, primary key)
- `transaction_id` (uuid, foreign key -> multisig_transactions.id)
- `approved_by` (text) - 批准者地址
- `transaction_hash` (text, nullable) - 批准交易哈希
- `approved_at` (timestamp) - 批准时间
- `created_at` (timestamp)

### recipient_whitelist
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `recipient_address` (text) - 收款地址
- `label` (varchar(255), nullable) - 自定义标签
- `created_at` (timestamp)
- `updated_at` (timestamp)

### activity_logs
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `action` (text)
- `metadata` (jsonb)
- `created_at` (timestamp)

## ⚠️ 错误处理

所有 API 在出错时都会返回以下格式：

```json
{
  "error": "Error message"
}
```

常见错误码：
- `400` - 请求参数错误
- `401` - 未授权（签名验证失败）
- `405` - 方法不允许
- `500` - 服务器内部错误

---

<a name="english-documentation"></a>

# 🇬🇧 English Documentation

## 📍 API Endpoints

All API endpoints are located under the `/api` path.

### User Related APIs

#### 1. Connect Wallet
**POST** `/api/users/connect`

Connect wallet and create/update user record.

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Sign in to Chain Tools"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "walletAddress": "0x...",
    "email": "user@example.com"
  }
}
```

#### 2. Bind Email
**POST** `/api/users/bind-email`

Send email verification code.

**Request Body:**
```json
{
  "userId": "uuid",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

#### 3. Verify Email
**POST** `/api/users/verify-email`

Verify email verification code and bind email.

**Request Body:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 4. Get User Info
**POST** `/api/users/get-info`

Get user's detailed information (email, verification status, etc.).

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "wallet_address": "0x...",
    "email": "user@example.com",
    "email_verified_at": "2025-12-21T10:00:00Z"
  }
}
```

#### 5. Unbind Email
**POST** `/api/users/unbind-email`

Unbind user's email.

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email unbound successfully"
}
```

#### 6. Get Email Addresses
**POST** `/api/users/get-emails`

Batch get verified emails for wallet addresses.

**Request Body:**
```json
{
  "walletAddresses": ["0x...", "0x..."]
}
```

**Response:**
```json
{
  "success": true,
  "emails": {
    "0x...": "user1@example.com",
    "0x...": "user2@example.com"
  }
}
```

### Deployment Related APIs

#### 7. Record Deployment
**POST** `/api/deployments/record`

Record multi-signature wallet deployment information.

**Request Body:**
```json
{
  "userId": "uuid",
  "contractAddress": "0x...",
  "network": "ethereum",
  "contractType": "multisig",
  "owners": ["0x...", "0x..."],
  "threshold": 2,
  "transactionHash": "0x...",
  "gasUsed": "100000",
  "gasCost": "0.01",
  "tags": "Little Bee"
}
```

**Response:**
```json
{
  "success": true,
  "deployment": {
    "id": "uuid",
    "contract_address": "0x...",
    "network": "ethereum",
    "tags": "Little Bee",
    ...
  }
}
```

#### 8. Get Deployment List
**GET** `/api/deployments/list`

Get all deployment records for a user.

**Query Parameters:**
- `userId` (string, required) - User ID

**Response:**
```json
{
  "success": true,
  "deployments": [
    {
      "id": "uuid",
      "contract_address": "0x...",
      "network": "ethereum",
      "tags": "Little Bee",
      ...
    }
  ]
}
```

#### 9. Update Tags
**PUT** `/api/deployments/update-tags`

Update custom tags for multi-signature wallet.

**Request Body:**
```json
{
  "userId": "uuid",
  "contractAddress": "0x...",
  "tags": "New Tag Name"
}
```

**Response:**
```json
{
  "success": true,
  "deployment": {
    "id": "uuid",
    "tags": "New Tag Name",
    ...
  }
}
```

### Transaction Related APIs

#### 10. Submit Transaction
**POST** `/api/transactions/submit`

Record user-submitted multi-signature transaction.

**Request Body:**
```json
{
  "userId": "uuid",
  "contractAddress": "0x...",
  "network": "polygon",
  "txIndex": 0,
  "to": "0x...",
  "value": "1000000000000000000",
  "assetType": "native",
  "assetAddress": null,
  "submittedBy": "0x...",
  "transactionHash": "0x...",
  "expirationTime": 1735689600
}
```

**Note:** 
- The `is_whitelisted_recipient` field is automatically calculated on the backend (checking if the recipient address is in the submitter's whitelist), no need to provide it in the request.
- The `expirationTime` field is an optional Unix timestamp (in seconds) representing the transaction expiration time. If not provided or `null`, the transaction never expires. Expired transactions cannot be confirmed or executed.

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "tx_index": 0,
    "to_address": "0x...",
    "value": "1000000000000000000",
    "status": "pending",
    "is_whitelisted_recipient": false,
    "expiration_time": "2025-12-29T00:00:00Z",
    ...
  }
}
```

#### 11. Approve Transaction
**POST** `/api/transactions/approve`

Record user's approval of a transaction.

**Request Body:**
```json
{
  "userId": "uuid",
  "transactionId": "uuid",
  "approvedBy": "0x...",
  "transactionHash": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "approval": {
    "id": "uuid",
    "approved_by": "0x...",
    "approved_at": "2025-12-21T10:00:00Z"
  },
  "transaction": {
    "current_confirmations": 1,
    ...
  }
}
```

#### 12. Execute Transaction
**POST** `/api/transactions/execute`

Record the final execution of a transaction.

**Request Body:**
```json
{
  "userId": "uuid",
  "transactionId": "uuid",
  "executedBy": "0x...",
  "transactionHash": "0x...",
  "gasUsed": "100000",
  "gasCost": "0.01"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "status": "executed",
    "executed_at": "2025-12-21T10:30:00Z",
    "execution_transaction_hash": "0x...",
    ...
  }
}
```

#### 13. Send Approval Notifications
**POST** `/api/transactions/send-approval-notifications`

Send email notifications to all owners who need to approve.

**Request Body:**
```json
{
  "transactionId": "uuid",
  "contractAddress": "0x...",
  "network": "polygon"
}
```

**Response:**
```json
{
  "success": true,
  "emailsSent": 2,
  "emailsTotal": 2,
  "results": [
    {
      "email": "user1@example.com",
      "success": true
    },
    {
      "email": "user2@example.com",
      "success": true
    }
  ]
}
```

#### 14. Get My Transactions
**GET** `/api/transactions/my-transactions`

Get all multi-signature transactions related to the current user (as submitter or approver).

**Query Parameters:**
- `userId` (string, required) - User ID
- `walletAddress` (string, required) - Wallet address

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "contract_address": "0x...",
      "network": "polygon",
      "tx_index": 0,
      "to_address": "0x...",
      "value": "1000000000000000000",
      "asset_type": "native",
      "submitted_by": "0x...",
      "status": "pending",
      "current_confirmations": 1,
      "required_confirmations": 2,
      "expiration_time": "2025-12-29T00:00:00Z",
      "userRole": "submitter",
      "userApprovedAt": null,
      "transaction_approvals": [
        {
          "approved_by": "0x...",
          "approved_at": "2025-12-21T10:00:00Z"
        }
      ],
      "multisig_deployments": {
        "contract_address": "0x...",
        "network": "polygon",
        "owners": ["0x...", "0x..."],
        "threshold": 2
      }
    }
  ]
}
```

#### 15. Get Pending Approvals
**GET** `/api/transactions/pending-approvals`

Get transactions waiting for the current user's approval.

**Query Parameters:**
- `userId` (string, required) - User ID
- `walletAddress` (string, required) - Wallet address

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "contract_address": "0x...",
      "network": "polygon",
      "tx_index": 0,
      "to_address": "0x...",
      "value": "1000000000000000000",
      "asset_type": "native",
      "submitted_by": "0x...",
      "status": "pending",
      "current_confirmations": 1,
      "required_confirmations": 2,
      "expiration_time": "2025-12-29T00:00:00Z",
      "transaction_approvals": [],
      "multisig_deployments": {
        "contract_address": "0x...",
        "network": "polygon",
        "owners": ["0x...", "0x..."],
        "threshold": 2
      }
    }
  ]
}
```

### Whitelist Related APIs

#### 16. Get Whitelist
**GET** `/api/whitelist/list`

Get the current user's whitelist of recipient addresses.

**Query Parameters:**
- `userId` (string, required) - User ID

**Response:**
```json
{
  "success": true,
  "whitelist": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "recipient_address": "0x...",
      "label": "Partner Wallet",
      "created_at": "2025-12-21T10:00:00Z"
    }
  ]
}
```

#### 17. Add/Update Whitelist
**POST** `/api/whitelist/add`

Add a new whitelist recipient address or update the label of an existing address.

**Request Body:**
```json
{
  "userId": "uuid",
  "recipientAddress": "0x...",
  "label": "Partner Wallet"
}
```

**Response:**
```json
{
  "success": true,
  "whitelist": {
    "id": "uuid",
    "user_id": "uuid",
    "recipient_address": "0x...",
    "label": "Partner Wallet",
    "created_at": "2025-12-21T10:00:00Z"
  },
  "message": "Whitelist added"
}
```

#### 18. Delete Whitelist
**DELETE** `/api/whitelist/delete`

Delete a recipient address from the whitelist.

**Query Parameters:**
- `userId` (string, required) - User ID
- `whitelistId` (string, required) - Whitelist record ID

**Response:**
```json
{
  "success": true,
  "message": "Whitelist deleted"
}
```

#### 19. Admin List Whitelist
**GET** `/api/whitelist/admin-list`

Admin view of all users' whitelists (requires admin permissions).

**Response:**
```json
{
  "success": true,
  "whitelist": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "recipient_address": "0x...",
      "label": "Partner Wallet",
      "created_at": "2025-12-21T10:00:00Z",
      "users": {
        "wallet_address": "0x...",
        "email": "user@example.com"
      }
    }
  ]
}
```

### Analytics Related APIs

#### 20. Get Statistics
**GET** `/api/analytics/stats`

Get platform statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalDeployments": 100,
    "totalUsers": 50,
    "deploymentsByNetwork": {
      "ethereum": 60,
      "polygon": 40
    },
    "dailyDeployments": {
      "2025-12-20": 5,
      "2025-12-21": 3
    }
  }
}
```

## 🔧 Frontend Usage Examples

### Using fetch

```typescript
// Connect wallet
const connectWallet = async (walletAddress: string, signature: string, message: string) => {
  const response = await fetch('/api/users/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      signature,
      message
    })
  })
  
  const data = await response.json()
  return data
}

// Record deployment
const recordDeployment = async (deploymentData: any) => {
  const response = await fetch('/api/deployments/record', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deploymentData)
  })
  
  const data = await response.json()
  return data
}
```

### Using axios

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// Connect wallet
const connectWallet = async (walletAddress: string, signature: string, message: string) => {
  const { data } = await api.post('/users/connect', {
    walletAddress,
    signature,
    message
  })
  return data
}
```

## 🗄️ Database Schema

### users
- `id` (uuid, primary key)
- `wallet_address` (text, unique)
- `email` (text, nullable)
- `email_verified_at` (timestamp, nullable)
- `last_login_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### email_verifications
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `email` (text)
- `verification_code` (text)
- `expires_at` (timestamp)
- `verified` (boolean, default false)
- `created_at` (timestamp)

### multisig_deployments
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `contract_address` (text)
- `network` (text)
- `contract_type` (text)
- `owners` (jsonb)
- `threshold` (integer)
- `transaction_hash` (text, nullable)
- `deployment_gas_used` (text, nullable)
- `deployment_gas_cost` (text, nullable)
- `status` (text, default 'success')
- `tags` (varchar(255), nullable) - User custom tags
- `created_at` (timestamp)

### multisig_transactions
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `deployment_id` (uuid, foreign key -> multisig_deployments.id)
- `contract_address` (text)
- `network` (text)
- `tx_index` (integer) - Transaction index in contract
- `to_address` (text) - Recipient address
- `value` (text) - Transfer amount
- `asset_type` (text) - 'native', 'usdt', 'usdc', 'usdcNative', etc.
- `asset_address` (text, nullable) - Token contract address
- `submitted_by` (text) - Submitter address
- `transaction_hash` (text, nullable) - Submit transaction hash
- `status` (text) - 'pending', 'executed', 'cancelled'
- `current_confirmations` (integer)
- `required_confirmations` (integer)
- `is_whitelisted_recipient` (boolean, nullable) - Whether recipient is in submitter's whitelist
- `expiration_time` (timestamp with time zone, nullable) - Transaction expiration time, expired transactions cannot be confirmed or executed
- `notification_sent_at` (timestamp, nullable) - Email notification sent time
- `executed_by` (text, nullable) - Executor address
- `executed_at` (timestamp, nullable) - Execution time
- `execution_transaction_hash` (text, nullable) - Execution transaction hash
- `execution_gas_used` (text, nullable)
- `execution_gas_cost` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### transaction_approvals
- `id` (uuid, primary key)
- `transaction_id` (uuid, foreign key -> multisig_transactions.id)
- `approved_by` (text) - Approver address
- `transaction_hash` (text, nullable) - Approval transaction hash
- `approved_at` (timestamp) - Approval time
- `created_at` (timestamp)

### recipient_whitelist
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `recipient_address` (text) - Recipient address
- `label` (varchar(255), nullable) - Custom label
- `created_at` (timestamp)
- `updated_at` (timestamp)

### activity_logs
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> users.id)
- `action` (text)
- `metadata` (jsonb)
- `created_at` (timestamp)

## ⚠️ Error Handling

All APIs return the following format when an error occurs:

```json
{
  "error": "Error message"
}
```

Common error codes:
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (signature verification failed)
- `405` - Method not allowed
- `500` - Internal server error

---

**Made with ❤️ by 0xfannie.eth**
