import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 查询用户部署的所有合约
    const { data: deployments, error } = await supabaseAdmin
      .from('multisig_deployments')
      .select('contract_address, network, tags, created_at')
      .eq('user_id', userId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching deployments:', error)
      throw error
    }

    return res.status(200).json({
      success: true,
      deployments: deployments || []
    })
  } catch (error: any) {
    console.error('List deployments error:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    })
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || String(error)
    })
  }
}

