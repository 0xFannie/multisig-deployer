import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'
import { verifyMessage } from 'ethers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 优先使用 supabaseAdmin，如果不可用则使用 supabase
  const client = supabaseAdmin || supabase
  if (!client) {
    console.error('❌ Supabase clients not available')
    return res.status(500).json({ 
      error: 'Database connection not available',
      details: 'Supabase clients are not initialized. Please check environment variables.'
    })
  }

  try {
    const { walletAddress, signature, message } = req.body

    // 验证必需参数
    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' })
    }
    if (!signature || !message) {
      return res.status(400).json({ error: 'signature and message are required' })
    }

    // 验证签名
    try {
      const recoveredAddress = verifyMessage(message, signature)
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ error: 'Invalid signature' })
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError)
      return res.status(401).json({ error: 'Signature verification failed' })
    }

    console.log('✅ Using client:', supabaseAdmin ? 'supabaseAdmin' : 'supabase')

    // 查找或创建用户
    let { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (error && error.code === 'PGRST116') {
      // 创建新用户
      console.log('Creating new user for wallet:', walletAddress.toLowerCase())
      const { data: newUser, error: createError } = await client
        .from('users')
        .insert([{
          wallet_address: walletAddress.toLowerCase(),
          last_login_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (createError) {
        console.error('Failed to create user:', createError)
        throw createError
      }
      user = newUser
      console.log('✅ New user created:', user.id)
    } else if (error) {
      console.error('Database query error:', error)
      throw error
    } else {
      // 更新登录时间
      console.log('Updating login time for existing user:', user.id)
      const { error: updateError } = await client
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to update login time:', updateError)
        // 不抛出错误，因为这不是关键操作
      }
    }

    // 记录活动日志（可选，如果失败不影响主流程）
    try {
      await client.from('activity_logs').insert([{
        user_id: user.id,
        action: 'wallet_connected',
        metadata: { walletAddress }
      }])
      console.log('✅ Activity log recorded')
    } catch (logError: any) {
      console.error('Failed to record activity log (non-critical):', logError)
      // 不抛出错误，因为活动日志不是关键操作
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        email: user.email
      }
    })
  } catch (error: any) {
    console.error('Connect error:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    })
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    })
  }
}

