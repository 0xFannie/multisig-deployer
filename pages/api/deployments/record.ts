import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      userId,
      contractAddress,
      network,
      contractType,
      owners,
      threshold,
      transactionHash,
      gasUsed,
      gasCost,
      tags
    } = req.body

    // 使用 supabaseAdmin 以确保有足够的权限
    const client = supabaseAdmin || supabase
    if (!client) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    const { data, error } = await client
      .from('multisig_deployments')
      .insert([{
        user_id: userId,
        contract_address: contractAddress.toLowerCase(),
        network,
        contract_type: contractType,
        owners,
        threshold,
        transaction_hash: transactionHash,
        deployment_gas_used: gasUsed,
        deployment_gas_cost: gasCost,
        status: 'success',
        tags: tags || null
      }])
      .select()
      .single()

    if (error) throw error

    // 记录活动
    try {
      await client.from('activity_logs').insert([{
        user_id: userId,
        action: 'contract_deployed',
        metadata: { contractAddress, network, contractType }
      }])
    } catch (logError) {
      console.error('Failed to log activity:', logError)
      // 不阻止成功，因为部署已经记录
    }

    return res.status(200).json({ success: true, deployment: data })
  } catch (error) {
    console.error('Record deployment error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

