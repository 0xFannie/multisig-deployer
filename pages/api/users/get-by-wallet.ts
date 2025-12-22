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

    console.log('Get user by wallet request:', { walletAddress })

    // 检查 Supabase 客户端
    console.log('Checking Supabase clients:', {
      hasSupabaseAdmin: !!supabaseAdmin,
      hasSupabase: !!supabase,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
    })

    // 优先使用 supabaseAdmin，如果不可用则使用 supabase
    const client = supabaseAdmin || supabase
    if (!client) {
      console.error('❌ Supabase clients not available')
      return res.status(500).json({ 
        error: 'Database connection not available',
        details: 'Supabase clients are not initialized. Please check environment variables.'
      })
    }

    console.log('✅ Using client:', supabaseAdmin ? 'supabaseAdmin' : 'supabase')

    // 查找用户（不创建新用户，只查找已存在的）
    console.log('Querying user with wallet address:', walletAddress.toLowerCase())
    const { data: user, error } = await client
      .from('users')
      .select('id, wallet_address, email, email_verified_at')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error('Database query error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message 
      })
    }

    if (!user) {
      console.log('User not found for wallet address:', walletAddress)
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User does not exist. Please interact with the app first to create your account.'
      })
    }

    console.log('User found:', { id: user.id, email: user.email, verified: !!user.email_verified_at })

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


