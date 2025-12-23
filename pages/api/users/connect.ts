import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'
import { verifyMessage } from 'ethers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database connection not available' })
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

    // 查找或创建用户
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (error && error.code === 'PGRST116') {
      // 创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          wallet_address: walletAddress.toLowerCase(),
          last_login_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (createError) throw createError
      user = newUser
    } else if (error) {
      throw error
    } else {
      // 更新登录时间
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    // 记录活动日志
    await supabase.from('activity_logs').insert([{
      user_id: user.id,
      action: 'wallet_connected',
      metadata: { walletAddress }
    }])

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

