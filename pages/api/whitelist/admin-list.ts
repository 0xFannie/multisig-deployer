import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 查询所有用户的白名单（管理员视图）
    const { data: whitelist, error } = await supabaseAdmin
      .from('recipient_whitelist')
      .select(`
        *,
        users:user_id (
          wallet_address,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({
      success: true,
      whitelist: whitelist || [],
    })
  } catch (error) {
    console.error('Admin list whitelist error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

