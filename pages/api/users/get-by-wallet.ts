import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin, supabase } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { walletAddress } = req.body

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' })
    }

    // 优先使用 supabaseAdmin，如果不可用则使用 supabase
    const client = supabaseAdmin || supabase
    if (!client) {
      return res.status(500).json({ error: 'Database connection not available' })
    }

    // 查找用户（不创建新用户，只查找已存在的）
    const { data: user, error } = await client
      .from('users')
      .select('id, wallet_address, email, email_verified_at')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error('Database query error:', error)
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message 
      })
    }

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User does not exist. Please interact with the app first to create your account.'
      })
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        email: user.email,
        email_verified_at: user.email_verified_at,
      },
    })
  } catch (error: any) {
    console.error('Get user by wallet error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    })
  }
}

