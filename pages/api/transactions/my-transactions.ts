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

    // 查询用户作为发起人的交易
    const { data: submittedTransactions, error: submittedError } = await supabaseAdmin
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
      .eq('submitted_by', walletAddr)
      .order('created_at', { ascending: false })

    if (submittedError) {
      console.error('Error fetching submitted transactions:', submittedError)
    }

    // 查询用户作为审批者的交易（通过 transaction_approvals 表）
    const { data: approvalRecords, error: approvalError } = await supabaseAdmin
      .from('transaction_approvals')
      .select(`
        transaction_id,
        approved_by,
        approved_at,
        transaction_hash,
        multisig_transactions!inner(
          *,
          multisig_deployments!inner(
            contract_address,
            network,
            owners,
            threshold
          )
        )
      `)
      .eq('approved_by', walletAddr)

    if (approvalError) {
      console.error('Error fetching approval records:', approvalError)
    }

    // 合并交易，去重
    const allTransactions: any[] = []
    const transactionMap = new Map<string, any>()

    // 添加作为发起人的交易
    submittedTransactions?.forEach((tx: any) => {
      transactionMap.set(tx.id, {
        ...tx,
        userRole: 'submitter',
        userApprovedAt: null,
      })
    })

    // 添加作为审批者的交易
    approvalRecords?.forEach((approval: any) => {
      const tx = approval.multisig_transactions
      if (tx) {
        const existing = transactionMap.get(tx.id)
        if (existing) {
          // 如果用户既是发起人又是审批者
          existing.userRole = 'both'
          existing.userApprovedAt = approval.approved_at
        } else {
          transactionMap.set(tx.id, {
            ...tx,
            userRole: 'approver',
            userApprovedAt: approval.approved_at,
          })
        }
      }
    })

    // 转换为数组并排序
    const transactions = Array.from(transactionMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return res.status(200).json({
      success: true,
      transactions,
    })
  } catch (error: any) {
    console.error('Get my transactions error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    })
  }
}

