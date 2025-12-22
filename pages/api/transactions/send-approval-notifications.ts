import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'
import { sendApprovalNotificationEmail } from '../../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      transactionId,
      contractAddress,
      network,
      approverAddresses // 被勾选的审批者地址列表（可选，如果提供则只发送给这些地址）
    } = req.body

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 获取交易信息
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('multisig_transactions')
      .select('*, multisig_deployments!inner(owners, threshold)')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // 确定需要通知的所有者地址
    // 如果提供了 approverAddresses，则只发送给这些地址；否则发送给所有所有者
    const ownersToNotify = approverAddresses && Array.isArray(approverAddresses) && approverAddresses.length > 0
      ? approverAddresses.map((addr: string) => addr.toLowerCase())
      : (transaction.multisig_deployments.owners || []).map((addr: string) => addr.toLowerCase())

    // 获取需要通知的所有者邮箱
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('wallet_address, email, email_verified_at')
      .in('wallet_address', ownersToNotify)
      .not('email', 'is', null)
      .not('email_verified_at', 'is', null) // 只发送给已验证邮箱的用户

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    // 发送邮件通知
    const emailResults = []
    const emailsToNotify = users?.filter(u => u.email) || []

    for (const user of emailsToNotify) {
      // 跳过提交者（如果已设置邮箱）
      if (user.wallet_address.toLowerCase() === transaction.submitted_by?.toLowerCase()) {
        continue
      }

      try {
        const result = await sendApprovalNotificationEmail({
          to: user.email!,
          contractAddress,
          network,
          txIndex: transaction.tx_index,
          toAddress: transaction.to_address,
          value: transaction.value,
          assetType: transaction.asset_type,
          submittedBy: transaction.submitted_by,
          explorerUrl: getExplorerUrl(network, transaction.transaction_hash)
        })

        emailResults.push({
          email: user.email,
          success: result.success
        })
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error)
        emailResults.push({
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // 记录邮件发送时间
    await supabaseAdmin
      .from('multisig_transactions')
      .update({
        notification_sent_at: new Date().toISOString()
      })
      .eq('id', transactionId)

    return res.status(200).json({
      success: true,
      emailsSent: emailResults.filter(r => r.success).length,
      emailsTotal: emailResults.length,
      results: emailResults
    })
  } catch (error) {
    console.error('Send approval notifications error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

function getExplorerUrl(network: string, txHash: string | null): string {
  if (!txHash) return ''
  
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    bsc: 'https://bscscan.com/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    base: 'https://basescan.org/tx/',
    avalanche: 'https://snowtrace.io/tx/',
    linea: 'https://lineascan.build/tx/',
    zksync: 'https://explorer.zksync.io/tx/',
    scroll: 'https://scrollscan.com/tx/'
  }

  return explorers[network.toLowerCase()] ? `${explorers[network.toLowerCase()]}${txHash}` : ''
}

