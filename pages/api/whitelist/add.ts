import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, recipientAddress, label } = req.body

    if (!userId || !recipientAddress) {
      return res.status(400).json({ error: 'User ID and recipient address are required' })
    }

    // 验证地址格式（简单检查）
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      return res.status(400).json({ error: 'Invalid recipient address format' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 检查是否已存在
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('recipient_whitelist')
      .select('id')
      .eq('user_id', userId)
      .eq('recipient_address', recipientAddress.toLowerCase())
      .maybeSingle()

    // PGRST116 表示没有找到记录，这是正常的，继续创建
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing whitelist:', existingError)
      throw existingError
    }

    if (existing) {
      // 如果已存在，更新标签
      const { data, error } = await supabaseAdmin
        .from('recipient_whitelist')
        .update({ label: label || null })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating whitelist:', error)
        throw error
      }

      return res.status(200).json({
        success: true,
        whitelist: data,
        message: 'Whitelist updated',
      })
    }

    // 检查白名单数量限制（最多10个）
    const { count, error: countError } = await supabaseAdmin
      .from('recipient_whitelist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('Error counting whitelist:', countError)
      throw countError
    }

    if (count && count >= 10) {
      return res.status(400).json({ 
        error: 'Whitelist limit reached',
        message: 'Maximum 10 whitelist entries allowed. Please delete existing entries to add new ones.'
      })
    }

    // 创建新的白名单记录
    const { data, error } = await supabaseAdmin
      .from('recipient_whitelist')
      .insert([{
        user_id: userId,
        recipient_address: recipientAddress.toLowerCase(),
        label: label || null,
      }])
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({
      success: true,
      whitelist: data,
      message: 'Whitelist added',
    })
  } catch (error: any) {
    console.error('Add whitelist error:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Recipient already in whitelist' })
    }
    
    if (error.code === 'PGRST116') {
      // 记录不存在，这是正常的，继续创建
      // 这种情况不应该发生，因为我们在创建前检查了
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      code: error?.code
    })
  }
}

