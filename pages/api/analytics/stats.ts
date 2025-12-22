import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 检查 Supabase 客户端
    const client = supabaseAdmin || supabase
    if (!client) {
      console.error('❌ Supabase client not available')
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 获取总部署数
    const { count: totalDeployments } = await client
      .from('multisig_deployments')
      .select('*', { count: 'exact', head: true })

    // 获取总用户数
    const { count: totalUsers } = await client
      .from('users')
      .select('*', { count: 'exact', head: true })

    // 按网络统计部署数
    const { data: deploymentsByNetwork } = await client
      .from('multisig_deployments')
      .select('network')

    const networkStats: Record<string, number> = {}
    deploymentsByNetwork?.forEach((deployment) => {
      const network = deployment.network || 'unknown'
      networkStats[network] = (networkStats[network] || 0) + 1
    })

    // 获取最近7天的部署趋势
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentDeployments } = await client
      .from('multisig_deployments')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())

    const dailyStats: Record<string, number> = {}
    recentDeployments?.forEach((deployment) => {
      const date = new Date(deployment.created_at).toISOString().split('T')[0]
      dailyStats[date] = (dailyStats[date] || 0) + 1
    })

    return res.status(200).json({
      success: true,
      stats: {
        totalDeployments: totalDeployments || 0,
        totalUsers: totalUsers || 0,
        deploymentsByNetwork: networkStats,
        dailyDeployments: dailyStats
      }
    })
  } catch (error) {
    console.error('Stats error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

