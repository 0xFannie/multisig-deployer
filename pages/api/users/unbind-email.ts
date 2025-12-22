import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    console.log('Unbind email request:', { userId })

    if (!userId) {
      console.error('Missing userId in request body')
      return res.status(400).json({ error: 'User ID is required' })
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

    // 获取当前用户信息
    const { data: currentUser, error: fetchError } = await client
      .from('users')
      .select('email, email_verified_at')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Failed to fetch user:', fetchError)
      throw fetchError
    }

    if (!currentUser) {
      console.log('User not found:', userId)
      return res.status(404).json({ error: 'User not found' })
    }

    if (!currentUser.email) {
      console.log('User has no email to unbind')
      return res.status(400).json({ error: 'No email bound to this account' })
    }

    console.log('Unbinding email:', { userId, currentEmail: currentUser.email })

    // 使用 supabaseAdmin 以确保有足够的权限更新用户表
    const adminClient = supabaseAdmin || client
    if (!adminClient) {
      console.error('Admin client not available for user update')
      return res.status(500).json({ error: 'Database admin client not configured' })
    }

    // 解绑邮件：清空 email 和 email_verified_at
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ 
        email: null,
        email_verified_at: null
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to unbind email:', updateError)
      console.error('Update error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
      
      return res.status(500).json({ 
        error: 'Failed to unbind email', 
        details: updateError.message,
        code: updateError.code
      })
    }

    if (!updatedUser) {
      console.error('User update returned no data')
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('Email unbound successfully:', {
      userId: userId,
      previousEmail: currentUser.email
    })

    // 记录活动日志
    try {
      await client.from('activity_logs').insert([{
        user_id: userId,
        action: 'email_unbound',
        metadata: { 
          previousEmail: currentUser.email
        }
      }])
    } catch (logError) {
      console.error('Failed to log email unbind:', logError)
      // 不阻止成功，因为邮件已经解绑
    }

    return res.status(200).json({
      success: true,
      message: 'Email unbound successfully'
    })
  } catch (error: any) {
    console.error('❌ Unbind email error:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      cause: error?.cause
    })
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      code: error?.code
    })
  }
}

