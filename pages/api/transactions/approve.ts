import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      userId,
      transactionId,
      approvedBy,
      transactionHash
    } = req.body

    // 获取交易信息
    const { data: transaction, error: txError } = await supabase
      .from('multisig_transactions')
      .select('*, multisig_deployments!inner(threshold)')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // 检查是否已经批准过
    const { data: existingApproval } = await supabase
      .from('transaction_approvals')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('approved_by', approvedBy.toLowerCase())
      .single()

    if (existingApproval) {
      return res.status(400).json({ error: 'Already approved' })
    }

    // 创建批准记录
    const { data: approval, error: approvalError } = await supabase
      .from('transaction_approvals')
      .insert([{
        transaction_id: transactionId,
        approved_by: approvedBy.toLowerCase(),
        transaction_hash: transactionHash || null,
        approved_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (approvalError) throw approvalError

    // 更新交易的确认数
    const newConfirmations = (transaction.current_confirmations || 0) + 1
    const { data: updatedTx, error: updateError } = await supabase
      .from('multisig_transactions')
      .update({
        current_confirmations: newConfirmations
      })
      .eq('id', transactionId)
      .select()
      .single()

    if (updateError) throw updateError

    // 记录活动
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action: 'transaction_approved',
      metadata: {
        transactionId,
        approvedBy,
        confirmations: newConfirmations
      }
    }])

    return res.status(200).json({
      success: true,
      approval,
      transaction: updatedTx
    })
  } catch (error) {
    console.error('Approve transaction error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

