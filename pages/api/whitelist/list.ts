import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 查询用户的白名单
    const { data: whitelist, error } = await supabaseAdmin
      .from('recipient_whitelist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({
      success: true,
      whitelist: whitelist || [],
    })
  } catch (error) {
    console.error('List whitelist error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

