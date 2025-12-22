import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { walletAddresses } = req.body

    if (!walletAddresses || !Array.isArray(walletAddresses) || walletAddresses.length === 0) {
      return res.status(400).json({ error: 'Wallet addresses array is required' })
    }

    if (!supabaseAdmin) {
      console.error('Get emails error: supabaseAdmin is not configured')
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 查询所有钱包地址对应的邮箱
    const normalizedAddresses = walletAddresses.map((addr: string) => addr.toLowerCase())
    console.log('Fetching emails for addresses:', normalizedAddresses)

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('wallet_address, email, email_verified_at')
      .in('wallet_address', normalizedAddresses)

    if (error) {
      console.error('Get emails database error:', error)
      throw error
    }

    console.log('Found users:', users?.length || 0)

    // 构建地址到邮箱的映射
    const emailMap: Record<string, string | null> = {}
    // 先初始化所有地址为 null
    normalizedAddresses.forEach((addr: string) => {
      emailMap[addr] = null
    })
    // 然后填充有邮箱的地址
    users?.forEach((user) => {
      const normalizedAddr = user.wallet_address.toLowerCase()
      emailMap[normalizedAddr] = user.email_verified_at ? user.email : null
    })

    console.log('Email map:', emailMap)

    return res.status(200).json({
      success: true,
      emails: emailMap,
    })
  } catch (error) {
    console.error('Get emails error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

