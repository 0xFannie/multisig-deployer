-- MultiSig Deployer 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- ============================================
-- 1. users 表（已存在，如需更新）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- ============================================
-- 2. email_verifications 表（已存在）
-- ============================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(verification_code);

-- ============================================
-- 3. multisig_deployments 表（更新：添加 tags 字段）
-- ============================================
CREATE TABLE IF NOT EXISTS multisig_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  owners JSONB NOT NULL,
  threshold INTEGER NOT NULL,
  transaction_hash TEXT,
  deployment_gas_used TEXT,
  deployment_gas_cost TEXT,
  status TEXT DEFAULT 'success',
  tags VARCHAR(255) DEFAULT NULL, -- 用户自定义标签（如 "小蜜蜂 Little Bee"）
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON multisig_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_contract_address ON multisig_deployments(contract_address);
CREATE INDEX IF NOT EXISTS idx_deployments_network ON multisig_deployments(network);

-- 如果表已存在，添加 tags 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'multisig_deployments' AND column_name = 'tags'
  ) THEN
    ALTER TABLE multisig_deployments ADD COLUMN tags VARCHAR(255) DEFAULT NULL;
  END IF;
END $$;

-- ============================================
-- 4. multisig_transactions 表（新建）
-- ============================================
CREATE TABLE IF NOT EXISTS multisig_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  deployment_id UUID REFERENCES multisig_deployments(id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,
  tx_index INTEGER NOT NULL, -- 合约中的交易索引
  to_address TEXT NOT NULL, -- 接收地址
  value TEXT NOT NULL, -- 转账金额（字符串格式，支持大数）
  asset_type TEXT NOT NULL, -- 'native', 'usdt', 'usdc', 'usdcNative', etc.
  asset_address TEXT, -- 代币合约地址（如果是 native 则为 NULL）
  submitted_by TEXT NOT NULL, -- 提交者的钱包地址
  transaction_hash TEXT, -- 提交交易的哈希
  status TEXT DEFAULT 'pending', -- 'pending', 'executed', 'cancelled'
  current_confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER NOT NULL,
  notification_sent_at TIMESTAMP, -- 邮件通知发送时间
  executed_by TEXT, -- 执行者的钱包地址
  executed_at TIMESTAMP, -- 交易执行时间
  execution_transaction_hash TEXT, -- 执行交易的哈希
  execution_gas_used TEXT, -- 执行交易的 gas 使用量
  execution_gas_cost TEXT, -- 执行交易的 gas 费用
  expiration_time TIMESTAMP WITH TIME ZONE, -- 交易过期时间（可选）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON multisig_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_deployment_id ON multisig_transactions(deployment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_contract_address ON multisig_transactions(contract_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON multisig_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON multisig_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_multisig_transactions_expiration_time ON multisig_transactions(expiration_time);

-- ============================================
-- 5. transaction_approvals 表（新建）
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES multisig_transactions(id) ON DELETE CASCADE,
  approved_by TEXT NOT NULL, -- 批准者的钱包地址
  transaction_hash TEXT, -- 批准交易的哈希（如果有）
  approved_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(transaction_id, approved_by) -- 确保每个地址只能批准一次
);

CREATE INDEX IF NOT EXISTS idx_approvals_transaction_id ON transaction_approvals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approved_by ON transaction_approvals(approved_by);

-- ============================================
-- 6. activity_logs 表（已存在）
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- ============================================
-- 7. 更新 updated_at 的触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 multisig_deployments 添加触发器
DROP TRIGGER IF EXISTS update_multisig_deployments_updated_at ON multisig_deployments;
CREATE TRIGGER update_multisig_deployments_updated_at
  BEFORE UPDATE ON multisig_deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 multisig_transactions 添加触发器
DROP TRIGGER IF EXISTS update_multisig_transactions_updated_at ON multisig_transactions;
CREATE TRIGGER update_multisig_transactions_updated_at
  BEFORE UPDATE ON multisig_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 users 表添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. recipient_whitelist 表（白名单收款人）
-- ============================================
CREATE TABLE IF NOT EXISTS recipient_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_address TEXT NOT NULL,
  label VARCHAR(255), -- 用户自定义标签
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, recipient_address) -- 确保每个用户对同一地址只能有一个白名单记录
);

CREATE INDEX IF NOT EXISTS idx_whitelist_user_id ON recipient_whitelist(user_id);
CREATE INDEX IF NOT EXISTS idx_whitelist_recipient_address ON recipient_whitelist(recipient_address);

-- 为 recipient_whitelist 添加触发器
DROP TRIGGER IF EXISTS update_recipient_whitelist_updated_at ON recipient_whitelist;
CREATE TRIGGER update_recipient_whitelist_updated_at
  BEFORE UPDATE ON recipient_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 更新 multisig_transactions 表，添加收款人白名单标记
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'multisig_transactions' AND column_name = 'is_whitelisted_recipient'
  ) THEN
    ALTER TABLE multisig_transactions ADD COLUMN is_whitelisted_recipient BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- 10. 更新 multisig_transactions 表，添加过期时间字段
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'multisig_transactions' AND column_name = 'expiration_time'
  ) THEN
    ALTER TABLE multisig_transactions ADD COLUMN expiration_time TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS idx_multisig_transactions_expiration_time ON multisig_transactions(expiration_time);
  END IF;
END $$;

-- ============================================
-- 10. RLS (Row Level Security) 策略
-- ============================================
-- 注意：RLS 策略在单独的 DATABASE_RLS_POLICIES.sql 文件中
-- 请在创建表结构后，执行 DATABASE_RLS_POLICIES.sql 来启用 RLS
-- ============================================

