import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 客户端 Supabase（用于前端和 API）
// 使用单例模式，确保只创建一个客户端实例
let supabase: SupabaseClient | null = null
let supabaseAdmin: SupabaseClient | null = null

// 客户端单例：使用全局变量存储，避免重复创建
if (typeof window !== 'undefined') {
  // 客户端环境：使用全局变量存储单例
  const globalSupabase = (window as any).__supabase_client__
  if (globalSupabase) {
    supabase = globalSupabase
  } else if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
      // 存储到全局变量，避免重复创建
      ;(window as any).__supabase_client__ = supabase
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
    }
  } else {
    console.warn('Supabase environment variables not configured')
  }
} else {
  // 服务端环境
  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey)
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      // 不抛出错误，允许应用继续运行（API 路由会检查 supabase 是否为 null）
    }
  } else {
    console.warn('Supabase environment variables not configured (server-side)')
    // 不抛出错误，允许应用继续运行
  }
}

// 服务端用的客户端（有更高权限，仅在服务端使用）
// 注意：在服务端，每次请求都会重新执行这个模块，所以需要确保每次都创建客户端
if (typeof window === 'undefined') {
  // 服务端环境
  if (supabaseUrl && supabaseServiceRoleKey) {
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      })
      // Admin client created successfully (security: no key info logged)
    } catch (error: any) {
      console.error('❌ Failed to create Supabase admin client:', error)
      console.error('Error details:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceRoleKey,
        errorMessage: error?.message
      })
    }
  } else {
    console.error('❌ Supabase admin client not created - missing env vars:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceRoleKey
    })
  }
}

export { supabase, supabaseAdmin }

