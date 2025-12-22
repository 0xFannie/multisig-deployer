import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, walletAddress } = req.query

    if (!userId || !walletAddress) {
      return res.status(400).json({ error: 'User ID and wallet address are required' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    const walletAddr = (walletAddress as string).toLowerCase()

    // 查询所有待处理的交易
    const { data: pendingTransactions, error: pendingError } = await supabaseAdmin
      .from('multisig_transactions')
      .select(`
        *,
        multisig_deployments!inner(
          contract_address,
          network,
          owners,
          threshold
        ),
        transaction_approvals(
          approved_by,
          approved_at,
          transaction_hash
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pendingError) {
      console.error('Error fetching pending transactions:', pendingError)
      throw pendingError
    }

    // 过滤出需要当前用户审批的交易
    const transactionsNeedingApproval = pendingTransactions?.filter((tx: any) => {
      const owners = tx.multisig_deployments?.owners || []
      const isOwner = owners.some((owner: string) => owner.toLowerCase() === walletAddr)
      
      if (!isOwner) return false

      // 检查用户是否已经审批过
      const approvals = tx.transaction_approvals || []
      const hasApproved = approvals.some((approval: any) => 
        approval.approved_by.toLowerCase() === walletAddr
      )

      // 如果用户是发起人，不需要审批
      if (tx.submitted_by.toLowerCase() === walletAddr) {
        return false
      }

      return !hasApproved
    }) || []

    return res.status(200).json({
      success: true,
      transactions: transactionsNeedingApproval,
    })
  } catch (error: any) {
    console.error('Get pending approvals error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    })
  }
}

