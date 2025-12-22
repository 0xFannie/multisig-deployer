import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, email, code } = req.body

    console.log('Verify email request:', { userId, email, code: code ? '***' : 'missing' })

    if (!userId || !email || !code) {
      console.error('Missing required fields:', { userId: !!userId, email: !!email, code: !!code })
      return res.status(400).json({ error: 'userId, email, and code are required' })
    }

    // 检查 Supabase 客户端
    console.log('Checking Supabase clients:', {
      hasSupabaseAdmin: !!supabaseAdmin,
      hasSupabase: !!supabase,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
    })

    if (!supabaseAdmin && !supabase) {
      console.error('❌ Supabase clients not available')
      console.error('supabaseAdmin:', !!supabaseAdmin, 'supabase:', !!supabase)
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'Supabase clients are not initialized. Please check environment variables.'
      })
    }

    // 优先使用 supabaseAdmin 以确保有足够的权限
    const client = supabaseAdmin || supabase
    if (!client) {
      console.error('❌ Supabase client not available after check')
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'Failed to initialize Supabase client.'
      })
    }

    console.log('✅ Using client:', supabaseAdmin ? 'supabaseAdmin' : 'supabase')

    // 验证码格式检查（6位数字）
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid code format' })
    }

    // 检查失败尝试次数（防止暴力破解）
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const { data: failedAttempts, error: failedAttemptsError } = await client
      .from('activity_logs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('action', 'email_verification_failed')
      .gte('created_at', fifteenMinutesAgo.toISOString())

    if (failedAttemptsError) {
      console.error('Error checking failed attempts:', failedAttemptsError)
    }

    // 限制：15分钟内最多 5 次失败尝试
    if (failedAttempts && failedAttempts.length >= 5) {
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please request a new verification code.',
        lockoutTime: 15 * 60 // 15分钟，单位秒
      })
    }

    // 查找验证码记录（不检查 verified 状态，因为可能已经部分处理）
    console.log('Looking up verification code:', { 
      userId, 
      email: email.toLowerCase(), 
      code,
      codeType: typeof code,
      codeLength: code?.length
    })

    // 先查询该用户和邮箱的所有验证码记录（用于调试）
    const { data: allVerifications, error: allVerificationsError } = await client
      .from('email_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(5)

    if (allVerificationsError) {
      console.error('Error querying all verifications:', allVerificationsError)
    } else {
      console.log('All verification records for user/email:', allVerifications?.map(v => ({
        id: v.id,
        code: v.verification_code,
        verified: v.verified,
        expires_at: v.expires_at,
        created_at: v.created_at
      })))
    }

    // 规范化验证码：确保是 6 位数字字符串（去除空格，补零）
    const normalizedCode = String(code).trim().replace(/\s/g, '').padStart(6, '0')
    console.log('Normalized verification code:', {
      original: code,
      normalized: normalizedCode,
      originalType: typeof code,
      originalLength: String(code).length
    })

    const { data: verification, error: verifyError } = await client
      .from('email_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('email', email.toLowerCase())
      .eq('verification_code', normalizedCode) // 使用规范化后的验证码
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // PGRST116 表示没有找到记录，这是正常的（验证码错误）
    if (verifyError && verifyError.code !== 'PGRST116') {
      console.error('Verification code lookup error:', verifyError)
      console.error('Error details:', {
        code: verifyError.code,
        message: verifyError.message,
        details: verifyError.details,
        hint: verifyError.hint
      })
      throw verifyError
    }

    if (!verification) {
      console.log('Verification code not found', {
        searchedCode: code,
        searchedCodeType: typeof code,
        allCodes: allVerifications?.map(v => v.verification_code)
      })
      // 记录失败的尝试
      try {
        await client.from('activity_logs').insert([{
          user_id: userId,
          action: 'email_verification_failed',
          metadata: { 
            email: email.toLowerCase(),
            code: code,
            attemptCount: failedAttempts ? failedAttempts.length + 1 : 1,
            reason: 'code_not_found',
            searchedCode: code,
            availableCodes: allVerifications?.map(v => v.verification_code)
          }
        }])
      } catch (logError) {
        console.error('Failed to log failed attempt:', logError)
      }
      
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    console.log('Verification code found:', {
      id: verification.id,
      code: verification.verification_code,
      verified: verification.verified,
      expires_at: verification.expires_at
    })

    // 检查是否已经验证过
    if (verification.verified === true) {
      console.log('Verification code already used')
      return res.status(400).json({ error: 'Verification code already used' })
    }

    // 检查是否过期
    const expiresAt = new Date(verification.expires_at)
    if (expiresAt < new Date()) {
      // 记录失败的尝试
      await client.from('activity_logs').insert([{
        user_id: userId,
        action: 'email_verification_failed',
        metadata: { 
          email: email.toLowerCase(),
          code: code,
          reason: 'expired'
        }
      }])
      return res.status(400).json({ error: 'Verification code expired' })
    }

    // 更新用户邮箱和验证状态
    // 使用 supabaseAdmin 以确保有足够的权限更新用户表
    if (!supabaseAdmin) {
      console.error('supabaseAdmin not available for user update')
      console.error('Attempting to use regular client, which may fail due to RLS policies')
    }
    
    const adminClient = supabaseAdmin || client
    if (!adminClient) {
      console.error('Admin client not available for user update')
      return res.status(500).json({ error: 'Database admin client not configured' })
    }

    console.log('Updating user email:', { userId, email: email.toLowerCase() })
    
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ 
        email: email.toLowerCase(),
        email_verified_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update user email:', updateError)
      console.error('Update error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        userId: userId,
        usingAdmin: !!supabaseAdmin
      })
      
      // 如果是权限错误，提供更明确的提示
      if (updateError.code === '42501' || updateError.message?.includes('permission') || updateError.message?.includes('policy')) {
        return res.status(500).json({ 
          error: 'Permission denied. Please check SUPABASE_SERVICE_ROLE_KEY configuration',
          details: updateError.message,
          code: updateError.code
        })
      }
      
      return res.status(500).json({ 
        error: 'Failed to update user email', 
        details: updateError.message,
        code: updateError.code
      })
    }

    if (!updatedUser) {
      console.error('User update returned no data')
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('User email updated successfully:', {
      userId: userId,
      email: email.toLowerCase(),
      updatedUserId: updatedUser.id
    })

    // 标记验证码为已使用
    const { error: markVerifiedError } = await adminClient
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verification.id)

    if (markVerifiedError) {
      console.error('Failed to mark verification as used:', markVerifiedError)
      console.error('Mark verified error details:', {
        code: markVerifiedError.code,
        message: markVerifiedError.message,
        verificationId: verification.id
      })
      // 不阻止成功，因为用户已经更新了
    } else {
      console.log('Verification code marked as used:', verification.id)
    }

    // 记录成功的验证
    try {
      await client.from('activity_logs').insert([{
        user_id: userId,
        action: 'email_verified',
        metadata: { email: email.toLowerCase() }
      }])
    } catch (logError) {
      console.error('Failed to log successful verification:', logError)
      // 不阻止成功，因为用户已经更新了
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error: any) {
    console.error('❌ Verify email error:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      cause: error?.cause
    })
    
    // 如果是 Supabase 错误，提供更详细的错误信息
    if (error?.code) {
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
        code: error?.code,
        hint: error?.hint
      })
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    })
  }
}

