import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, contractAddress, tags } = req.body

    // 使用 supabaseAdmin 以确保有足够的权限
    const client = supabaseAdmin || supabase
    if (!client) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 验证用户是否有权限更新该合约
    const { data: deployment, error: fetchError } = await client
      .from('multisig_deployments')
      .select('user_id')
      .eq('contract_address', contractAddress.toLowerCase())
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching deployment:', fetchError)
      return res.status(500).json({ error: 'Database error', details: fetchError.message })
    }

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' })
    }

    if (deployment.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // 更新 tags
    const { data, error } = await client
      .from('multisig_deployments')
      .update({ tags: tags || null })
      .eq('contract_address', contractAddress.toLowerCase())
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating tags:', error)
      throw error
    }

    if (!data) {
      return res.status(404).json({ error: 'Deployment not found after update' })
    }

    return res.status(200).json({ success: true, deployment: data })
  } catch (error) {
    console.error('Update tags error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

