import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, whitelistId } = req.query

    if (!userId || !whitelistId) {
      return res.status(400).json({ error: 'User ID and whitelist ID are required' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 删除白名单记录（确保只删除属于该用户的记录）
    const { error } = await supabaseAdmin
      .from('recipient_whitelist')
      .delete()
      .eq('id', whitelistId)
      .eq('user_id', userId)

    if (error) throw error

    return res.status(200).json({
      success: true,
      message: 'Whitelist deleted',
    })
  } catch (error) {
    console.error('Delete whitelist error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

