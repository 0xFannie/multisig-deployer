import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'
import { sendVerificationEmail } from '../../../lib/email'

// 使用加密安全的随机数生成器生成验证码
function generateVerificationCode(): string {
  // Node.js 环境使用 crypto 模块生成加密安全的随机数
  const crypto = require('crypto')
  const randomBytes = crypto.randomBytes(4)
  const randomNum = randomBytes.readUInt32BE(0) % 1000000
  
  // 生成 6 位数字验证码（000000-999999），不足补零
  return randomNum.toString().padStart(6, '0')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, email, walletAddress } = req.body

    // 如果提供了 walletAddress 但没有 userId，尝试查找或创建用户
    let finalUserId = userId
    if (!finalUserId && walletAddress) {
      const client = supabaseAdmin || supabase
      if (!client) {
        return res.status(500).json({ error: 'Database not configured' })
      }

      // 查找用户
      let { data: user, error: findError } = await client
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .maybeSingle()

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding user:', findError)
        return res.status(500).json({ error: 'Database error' })
      }

      // 如果用户不存在，创建新用户
      if (!user) {
        const { data: newUser, error: createError } = await client
          .from('users')
          .insert([{
            wallet_address: walletAddress.toLowerCase(),
          }])
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          return res.status(500).json({ error: 'Failed to create user' })
        }

        user = newUser
        console.log('Created new user for wallet:', walletAddress, 'userId:', user.id)
      }

      finalUserId = user.id
    }

    if (!finalUserId || !email) {
      return res.status(400).json({ error: 'userId (or walletAddress) and email are required' })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // 使用 supabaseAdmin 以确保有足够的权限
    const client = supabaseAdmin || supabase
    if (!client) {
      console.error('Supabase client not available')
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 检查邮箱是否已被其他用户使用
    const { data: existing } = await client
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing && existing.id !== finalUserId) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    // 检查发送频率限制（防止滥发）
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const { data: recentAttempts } = await client
      .from('activity_logs')
      .select('created_at')
      .eq('user_id', finalUserId)
      .eq('action', 'verification_email_sent')
      .gte('created_at', oneMinuteAgo.toISOString())

    // 限制：每分钟最多 3 次
    if (recentAttempts && recentAttempts.length >= 3) {
      const oldest = new Date(recentAttempts[0].created_at)
      const cooldown = Math.ceil((60 - (Date.now() - oldest.getTime()) / 1000))
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        cooldown 
      })
    }

    // 生成加密安全的验证码（确保是 6 位数字字符串）
    const code = generateVerificationCode()
    const normalizedCode = code.padStart(6, '0') // 确保是 6 位数字
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分钟过期

    // 删除该用户和邮箱的旧验证记录（防止重复）
    await client
      .from('email_verifications')
      .delete()
      .eq('user_id', finalUserId)
      .eq('email', email.toLowerCase())

    console.log('Saving verification code:', { 
      userId: finalUserId, 
      email: email.toLowerCase(), 
      code: normalizedCode, 
      codeLength: normalizedCode.length,
      expiresAt: expiresAt.toISOString() 
    })

    // 保存新的验证码记录（使用规范化后的验证码）
    const { data: insertedData, error: insertError } = await client
      .from('email_verifications')
      .insert([{
        user_id: finalUserId,
        email: email.toLowerCase(),
        verification_code: normalizedCode, // 使用规范化后的验证码
        expires_at: expiresAt.toISOString(),
        verified: false
      }])
      .select()

    if (insertError) {
      console.error('Failed to save verification code:', insertError)
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      throw insertError
    }

    console.log('Verification code saved successfully:', insertedData?.[0]?.id)

    // 发送邮件（使用规范化后的验证码）
    const result = await sendVerificationEmail(email, normalizedCode)
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send email' })
    }

    // 记录活动日志
    try {
      await client.from('activity_logs').insert([{
        user_id: finalUserId,
        action: 'verification_email_sent',
        metadata: {
          email: email.toLowerCase(),
          expiresAt: expiresAt.toISOString(),
          attemptCount: recentAttempts ? recentAttempts.length + 1 : 1
        }
      }])
    } catch (logError) {
      console.error('Failed to log activity:', logError)
      // 不阻止成功，因为验证码已经保存
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code sent',
      expiresIn: 600, // 10分钟，单位秒
      userId: finalUserId // 返回 userId，前端可以保存
    })
  } catch (error) {
    console.error('Bind email error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

