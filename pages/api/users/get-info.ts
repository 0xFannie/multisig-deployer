import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin, supabase } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    console.log('Get user info request:', { userId })

    if (!userId) {
      console.error('Missing userId in request body')
      return res.status(400).json({ error: 'User ID is required' })
    }

    // 检查 Supabase 客户端
    console.log('Checking Supabase clients:', {
      hasSupabaseAdmin: !!supabaseAdmin,
      hasSupabase: !!supabase,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
    })

    if (!supabaseAdmin && !supabase) {
      console.error('❌ Supabase clients not available')
      console.error('supabaseAdmin:', !!supabaseAdmin, 'supabase:', !!supabase)
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'Supabase clients are not initialized. Please check environment variables.'
      })
    }

    // 优先使用 supabaseAdmin，如果不可用则使用 supabase
    const client = supabaseAdmin || supabase
    if (!client) {
      console.error('❌ Supabase client not available after check')
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'Failed to initialize Supabase client.'
      })
    }

    console.log('✅ Using client:', supabaseAdmin ? 'supabaseAdmin' : 'supabase')
    console.log('Querying user:', userId)

    const { data: user, error } = await client
      .from('users')
      .select('id, wallet_address, email, email_verified_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Database query error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    if (!user) {
      console.log('User not found:', userId)
      return res.status(404).json({ error: 'User not found' })
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
    console.error('❌ Get user info error:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      cause: error?.cause
    })
    
    // 如果是 Supabase 错误，提供更详细的错误信息
    if (error?.code) {
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
        code: error?.code,
        hint: error?.hint
      })
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    })
  }
}

