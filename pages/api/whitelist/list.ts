import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin, supabase } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // 优先使用 supabaseAdmin，如果不可用则使用 supabase
    const client = supabaseAdmin || supabase
    if (!client) {
      console.error('❌ Supabase clients not available')
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'Supabase clients are not initialized. Please check environment variables.'
      })
    }

    console.log('✅ Querying whitelist for userId:', userId)
    console.log('Using client:', supabaseAdmin ? 'supabaseAdmin' : 'supabase')

    // 查询用户的白名单
    const { data: whitelist, error } = await client
      .from('recipient_whitelist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

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

    console.log(`✅ Found ${whitelist?.length || 0} whitelist entries for user ${userId}`)

    return res.status(200).json({
      success: true,
      whitelist: whitelist || [],
    })
  } catch (error: any) {
    console.error('❌ List whitelist error:', error)
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    })
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    })
  }
}

