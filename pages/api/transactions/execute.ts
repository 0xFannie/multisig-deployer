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
      executedBy,
      transactionHash,
      gasUsed,
      gasCost
    } = req.body

    // 获取交易信息
    const { data: transaction, error: txError } = await supabase
      .from('multisig_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.status === 'executed') {
      return res.status(400).json({ error: 'Transaction already executed' })
    }

    // 更新交易状态
    const { data: updatedTx, error: updateError } = await supabase
      .from('multisig_transactions')
      .update({
        status: 'executed',
        executed_by: executedBy.toLowerCase(),
        executed_at: new Date().toISOString(),
        execution_transaction_hash: transactionHash,
        execution_gas_used: gasUsed?.toString() || null,
        execution_gas_cost: gasCost?.toString() || null
      })
      .eq('id', transactionId)
      .select()
      .single()

    if (updateError) throw updateError

    // 记录活动
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action: 'transaction_executed',
      metadata: {
        transactionId,
        executedBy,
        transactionHash
      }
    }])

    return res.status(200).json({
      success: true,
      transaction: updatedTx
    })
  } catch (error) {
    console.error('Execute transaction error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

