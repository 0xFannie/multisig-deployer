import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useTranslation } from 'next-i18next'
import { Settings, Mail, Shield, Plus, Trash2, Edit2, Save, X, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmDialog } from './ConfirmDialog'

interface WhitelistItem {
  id: string
  recipient_address: string
  label: string | null
  created_at: string
}

export function UserSettings() {
  const { t, ready } = useTranslation('common')
  const { address, isConnected } = useAccount()

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editLabelValue, setEditLabelValue] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [countdown, setCountdown] = useState(0) // 倒计时秒数
  const [addressError, setAddressError] = useState<string | null>(null) // 地址输入错误提示
  const [addButtonError, setAddButtonError] = useState<string | null>(null) // 添加按钮错误提示
  const [showUnbindDialog, setShowUnbindDialog] = useState(false) // 解绑邮箱确认对话框

  // 加载用户信息
  useEffect(() => {
    if (!isConnected || !address) {
      // 如果钱包未连接，清除状态和 localStorage
      setUserId(null)
      setUserEmail(null)
      setEmailVerified(false)
      setWhitelist([])
      localStorage.removeItem('multisig_user_id')
      return
    }

    const loadUser = async () => {
      setLoading(true)
      
      // 先尝试从 localStorage 获取
      let savedUserId = localStorage.getItem('multisig_user_id')
      
      // 验证 localStorage 中的 userId 是否属于当前钱包地址
      if (savedUserId) {
        try {
          console.log('Validating saved userId:', savedUserId, 'for wallet:', address)
          const validateResponse = await fetch('/api/users/get-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: savedUserId }),
          })
          
          if (validateResponse.ok) {
            const validateData = await validateResponse.json()
            if (validateData.success && validateData.user) {
              const savedWalletAddress = validateData.user.wallet_address?.toLowerCase()
              const currentWalletAddress = address.toLowerCase()
              
              // 如果钱包地址不匹配，清除 localStorage 并重新获取
              if (savedWalletAddress !== currentWalletAddress) {
                console.warn('Wallet address mismatch! Saved:', savedWalletAddress, 'Current:', currentWalletAddress)
                console.log('Clearing localStorage and fetching new user...')
                localStorage.removeItem('multisig_user_id')
                savedUserId = null
              } else {
                console.log('Saved userId is valid for current wallet address')
              }
            } else {
              // userId 无效，清除
              console.warn('Saved userId is invalid, clearing localStorage')
              localStorage.removeItem('multisig_user_id')
              savedUserId = null
            }
          } else {
            // API 调用失败，清除并重新获取
            console.warn('Failed to validate saved userId, clearing localStorage')
            localStorage.removeItem('multisig_user_id')
            savedUserId = null
          }
        } catch (error) {
          console.error('Error validating saved userId:', error)
          // 验证失败，清除并重新获取
          localStorage.removeItem('multisig_user_id')
          savedUserId = null
        }
      }
      
      // 如果没有有效的 userId，通过 API 获取用户（根据钱包地址）
      if (!savedUserId) {
        // 使用专门的 API 端点，根据钱包地址查找用户，不需要签名验证
        try {
          console.log('Fetching user by wallet address:', address)
          const response = await fetch('/api/users/get-by-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: address
            })
          })
          
          if (!response.ok) {
            console.error('API response not OK:', response.status, response.statusText)
            const errorData = await response.json().catch(() => ({}))
            console.error('Error data:', errorData)
            throw new Error(errorData.error || `API error: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('API response:', data)
          
          if (data.success && data.user?.id) {
            savedUserId = data.user.id
            if (savedUserId) {
              localStorage.setItem('multisig_user_id', savedUserId)
              console.log('User ID saved to localStorage:', savedUserId)
            }
          } else {
            console.warn('User not found by wallet address:', data.error || data.message)
            // 如果用户不存在，显示错误信息
            if (data.error === 'User not found') {
              console.warn('User needs to interact with the app first to create account')
              toast.error(ready ? t('settings.userNotFound') || 'User not found. Please interact with the app first.' : '用户未找到，请先与应用交互')
            } else if (data.error === 'Database connection not available') {
              console.error('Database connection not available')
              toast.error(ready ? t('settings.databaseError') || 'Database connection error' : '数据库连接错误')
            }
          }
        } catch (error: any) {
          console.error('Failed to get user ID:', error)
          toast.error(ready ? t('settings.loadUserFailed') || 'Failed to load user information' : '加载用户信息失败')
        }
      }
      
      if (savedUserId) {
        setUserId(savedUserId)
        await loadUserInfo(savedUserId)
        await loadWhitelist(savedUserId)
      } else {
        console.warn('User ID not found. User may need to interact with the app first.')
        // 清除状态
        setUserId(null)
        setUserEmail(null)
        setEmailVerified(false)
        setWhitelist([])
      }
      setLoading(false)
    }
    
    loadUser()
  }, [isConnected, address, ready, t])

  const loadUserInfo = async (uid: string | null) => {
    if (!uid) {
      console.warn('loadUserInfo called with null userId')
      return
    }
    try {
      console.log('Loading user info for userId:', uid)
      const response = await fetch('/api/users/get-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      })
      
      if (!response.ok) {
        console.error('get-info API response not OK:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error data:', errorData)
        throw new Error(errorData.error || `API error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('User info loaded:', data)
      
      if (data.success) {
        setUserEmail(data.user.email)
        setEmailVerified(!!data.user.email_verified_at)
        setEmailInput(data.user.email || '')
        console.log('User info set:', { email: data.user.email, verified: !!data.user.email_verified_at })
      } else {
        console.error('Failed to load user info:', data.error)
        toast.error(data.error || (ready ? t('settings.loadUserInfoFailed') || 'Failed to load user information' : '加载用户信息失败'))
      }
    } catch (error: any) {
      console.error('Failed to load user info:', error)
      toast.error(error.message || (ready ? t('settings.loadUserInfoFailed') || 'Failed to load user information' : '加载用户信息失败'))
    }
  }

  const loadWhitelist = async (uid: string | null) => {
    if (!uid) {
      console.warn('loadWhitelist called with null userId')
      return
    }
    try {
      console.log('Loading whitelist for userId:', uid)
      const response = await fetch(`/api/whitelist/list?userId=${uid}`)
      
      if (!response.ok) {
        console.error('whitelist/list API response not OK:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error data:', errorData)
        throw new Error(errorData.error || `API error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Whitelist loaded:', data)
      
      if (data.success) {
        setWhitelist(data.whitelist || [])
        console.log(`Whitelist set with ${data.whitelist?.length || 0} entries`)
      } else {
        console.error('Failed to load whitelist:', data.error)
        toast.error(data.error || (ready ? t('settings.loadWhitelistFailed') || 'Failed to load whitelist' : '加载白名单失败'))
      }
    } catch (error: any) {
      console.error('Failed to load whitelist:', error)
      toast.error(error.message || (ready ? t('settings.loadWhitelistFailed') || 'Failed to load whitelist' : '加载白名单失败'))
    }
  }

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleBindEmail = async () => {
    const trimmedEmail = emailInput.trim()
    
    if (!userId) {
      toast.error(ready ? t('settings.userIdRequired') : '用户ID未找到，请刷新页面')
      return
    }
    
    if (!trimmedEmail) {
      toast.error(ready ? t('settings.emailRequired') : '请输入邮箱地址')
      return
    }

    // 基本邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      toast.error(ready ? t('settings.invalidEmailFormat') : '邮箱格式无效')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/users/bind-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: trimmedEmail }),
      })
      const data = await response.json()
      if (data.success) {
        setShowCodeInput(true)
        setCountdown(120) // 启动120秒倒计时
        toast.success(ready ? t('settings.verificationCodeSent') : '验证码已发送')
      } else {
        toast.error(data.error || (ready ? t('settings.bindEmailFailed') : '发送验证码失败'))
      }
    } catch (error) {
      toast.error(ready ? t('settings.bindEmailFailed') : '绑定邮箱失败')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!userId || !emailInput || !verificationCode) {
      toast.error(ready ? t('settings.codeRequired') : '请输入验证码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/users/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: emailInput, code: verificationCode }),
      })
      const data = await response.json()
      if (data.success) {
        setEmailVerified(true)
        setShowCodeInput(false)
        setVerificationCode('')
        setCountdown(0) // 重置倒计时
        toast.success(ready ? t('settings.emailVerified') : '邮箱已验证')
        loadUserInfo(userId)
      } else {
        toast.error(data.error || (ready ? t('settings.verificationFailed') : '验证失败'))
      }
    } catch (error) {
      toast.error(ready ? t('settings.verificationFailed') : '验证失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUnbindEmail = async () => {
    if (!userId) {
      toast.error(ready ? t('settings.userIdRequired') : '用户ID未找到，请刷新页面')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/users/unbind-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await response.json()
      if (data.success) {
        // 重置所有邮箱相关状态
        setUserEmail(null)
        setEmailVerified(false)
        setEmailInput('')
        setVerificationCode('')
        setShowCodeInput(false)
        setCountdown(0)
        setShowUnbindDialog(false)
        toast.success(ready ? t('settings.emailUnbound') : '邮箱已解绑')
        loadUserInfo(userId)
      } else {
        toast.error(data.error || (ready ? t('settings.unbindEmailFailed') : '解绑邮箱失败'))
      }
    } catch (error) {
      toast.error(ready ? t('settings.unbindEmailFailed') : '解绑邮箱失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWhitelist = async () => {
    // 清除之前的错误提示
    setAddButtonError(null)
    setAddressError(null)

    // 验证：如果没有输入地址
    if (!userId || !newAddress.trim()) {
      const errorMsg = ready ? t('settings.pleaseEnterAddress') : '请先输入需要添加的收款地址'
      setAddButtonError(errorMsg)
      return
    }

    // 验证：地址格式
    const trimmedAddress = newAddress.trim()
    if (!trimmedAddress.startsWith('0x')) {
      const errorMsg = ready ? t('settings.addressMustStartWith0x') : '请输入0x开头的地址，当前地址不符合要求'
      setAddressError(errorMsg)
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      const errorMsg = ready ? t('settings.invalidAddressFormat') : '请输入0x开头的有效EVM地址，当前地址不符合要求'
      setAddressError(errorMsg)
      return
    }

    // 检查白名单数量限制（这个检查应该在API层面，但前端也做一次）
    if (whitelist.length >= 10) {
      const errorMsg = ready ? t('settings.whitelistFullDeleteFirst') : '位置已满，请先删除几个，腾出位置才能新增'
      setAddButtonError(errorMsg)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/whitelist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          recipientAddress: newAddress,
          label: newLabel || null,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setNewAddress('')
        setNewLabel('')
        setAddressError(null)
        setAddButtonError(null)
        toast.success(ready ? t('settings.whitelistAdded') : '地址已添加到白名单')
        loadWhitelist(userId)
      } else {
        if (data.error === 'Whitelist limit reached' || data.message?.includes('Maximum 10')) {
          const errorMsg = ready ? t('settings.whitelistFullDeleteFirst') : '位置已满，请先删除几个，腾出位置才能新增'
          setAddButtonError(errorMsg)
          toast.error(ready ? t('settings.whitelistLimitReached') : '白名单已满（最多10个）。请先删除现有条目后再添加新条目。')
        } else {
          toast.error(data.error || (ready ? t('settings.addWhitelistFailed') : '添加白名单失败'))
        }
      }
    } catch (error) {
      toast.error(ready ? t('settings.addWhitelistFailed') : '添加白名单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWhitelist = async (whitelistId: string) => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/whitelist/delete?userId=${userId}&whitelistId=${whitelistId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        toast.success(ready ? t('settings.whitelistDeleted') : '地址已从白名单移除')
        loadWhitelist(userId)
      } else {
        toast.error(data.error || (ready ? t('settings.deleteWhitelistFailed') : '删除失败'))
      }
    } catch (error) {
      toast.error(ready ? t('settings.deleteWhitelistFailed') : '删除白名单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLabel = async (whitelistId: string) => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch('/api/whitelist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          recipientAddress: whitelist.find(w => w.id === whitelistId)?.recipient_address,
          label: editLabelValue || null,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setEditingLabel(null)
        setEditLabelValue('')
        toast.success(ready ? t('settings.labelSaved') : '标签已保存')
        loadWhitelist(userId)
      } else {
        toast.error(data.error || (ready ? t('settings.saveLabelFailed') : '保存标签失败'))
      }
    } catch (error) {
      toast.error(ready ? t('settings.saveLabelFailed') : '保存标签失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-primary-gray">{t('settings.connectWallet') || 'Please connect your wallet'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 邮件绑定 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-6 h-6 text-primary-light" />
          <h2 className="text-2xl font-bold text-white">{t('settings.emailBinding') || 'Email Binding'}</h2>
        </div>

        {emailVerified && userEmail ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary-light/10 rounded-lg border border-primary-light/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">{userEmail}</p>
                  <p className="text-primary-gray text-sm">{t('settings.emailVerified') || 'Email verified'}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setShowUnbindDialog(true)
                }}
                disabled={loading}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all font-medium disabled:opacity-50 border border-red-500/30"
              >
                {ready ? t('settings.unbindEmail') : '解绑邮箱'}
              </button>
            </div>
            <div className="text-primary-gray text-sm">
              {ready ? t('settings.unbindEmailHint') : '解绑后可以重新绑定新的邮箱地址'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-primary-gray text-sm mb-2">
                {t('settings.emailAddress') || 'Email Address'}
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-primary-dark/50 border border-primary-gray/30 rounded-lg text-white placeholder-primary-gray focus:outline-none focus:border-primary-light/50"
                disabled={loading || showCodeInput}
              />
            </div>

            {showCodeInput && (
              <div>
                <label className="block text-primary-gray text-sm mb-2">
                  {t('settings.verificationCode') || 'Verification Code'}
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-primary-dark/50 border border-primary-gray/30 rounded-lg text-white placeholder-primary-gray focus:outline-none focus:border-primary-light/50"
                />
              </div>
            )}

            <div className="flex gap-3">
              {!showCodeInput ? (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleBindEmail()
                  }}
                  disabled={loading || !userId || !emailInput.trim() || countdown > 0}
                  className="px-6 py-2.5 bg-primary-light hover:bg-primary-light/80 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? (t('settings.sending') || 'Sending...') 
                    : countdown > 0 
                      ? `${t('settings.resendIn') || 'Resend in'} ${countdown}s`
                      : (t('settings.sendCode') || 'Send Verification Code')
                  }
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleVerifyEmail()
                    }}
                    disabled={loading}
                    className="px-6 py-2.5 bg-primary-light hover:bg-primary-light/80 text-white rounded-lg transition-all font-medium disabled:opacity-50"
                  >
                    {t('settings.verify') || 'Verify'}
                  </button>
                  {countdown > 0 ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleBindEmail()
                      }}
                      disabled={loading || countdown > 0}
                      className="px-6 py-2.5 bg-primary-gray/20 hover:bg-primary-gray/30 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-primary-gray/30"
                    >
                      {t('settings.resendIn') || 'Resend in'} {countdown}{t('settings.seconds') || 's'})
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleBindEmail()
                      }}
                      disabled={loading || !userId || !emailInput.trim()}
                      className="px-6 py-2.5 bg-primary-gray/20 hover:bg-primary-gray/30 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-primary-gray/30"
                    >
                      {t('settings.resendCode') || 'Resend Code'}
                    </button>
                  )}
                </>
              )}
            </div>
            {!userId && (
              <p className="text-yellow-400 text-sm mt-2">
                {t('settings.userIdLoading') || 'Loading user information...'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 白名单管理 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary-light" />
          <h2 className="text-2xl font-bold text-white">{t('settings.whitelistManagement') || 'Whitelist Management'}</h2>
        </div>

        {/* 添加白名单 */}
        <div className="mb-6 p-4 bg-primary-dark/50 rounded-lg border border-primary-gray/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">{t('settings.addWhitelist') || 'Add Recipient Address'}</h3>
            <span className="text-primary-gray text-sm">
              {ready ? `${whitelist.length}/10 ${t('settings.whitelistEntries')}` : `${whitelist.length}/10 个条目`}
            </span>
          </div>
          {whitelist.length >= 10 && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                {t('settings.whitelistLimitReached') || 'Whitelist limit reached (10 entries). Please delete existing entries to add new ones.'}
              </p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-primary-gray text-sm mb-2">
                {t('settings.recipientAddress') || 'Recipient Address'}
              </label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => {
                  setNewAddress(e.target.value)
                  // 清除地址错误提示当用户开始输入时
                  if (addressError) {
                    setAddressError(null)
                  }
                }}
                placeholder="0x..."
                disabled={whitelist.length >= 10}
                className={`w-full px-4 py-2 bg-primary-dark border rounded-lg text-white placeholder-primary-gray focus:outline-none font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  addressError 
                    ? 'border-red-500/50 focus:border-red-500' 
                    : 'border-primary-gray/30 focus:border-primary-light/50'
                }`}
              />
              {addressError && (
                <p className="mt-1 text-sm text-red-400">{addressError}</p>
              )}
            </div>
            <div>
              <label className="block text-primary-gray text-sm mb-2">
                {t('settings.label') || 'Label (Optional)'}
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder={t('settings.labelPlaceholder') || 'e.g., Company Wallet'}
                disabled={whitelist.length >= 10}
                className="w-full px-4 py-2 bg-primary-dark border border-primary-gray/30 rounded-lg text-white placeholder-primary-gray focus:outline-none focus:border-primary-light/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleAddWhitelist}
              disabled={loading || whitelist.length >= 10}
              className="w-full px-4 py-2.5 bg-primary-light hover:bg-primary-light/80 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('settings.add') || 'Add'}
            </button>
            {/* 添加按钮错误提示 */}
            {addButtonError && (
              <p className="text-sm text-red-400 mt-1">{addButtonError}</p>
            )}
            {/* 白名单已满提示 */}
            {whitelist.length >= 10 && !addButtonError && (
              <p className="text-sm text-yellow-400 mt-1">
                {t('settings.whitelistFullDeleteFirst') || 'Whitelist is full. Please delete some entries to make room for new ones.'}
              </p>
            )}
          </div>
        </div>

        {/* 白名单列表 */}
        <div className="space-y-3">
          <h3 className="text-white font-medium">{t('settings.whitelist') || 'Whitelist'}</h3>
          {whitelist.length === 0 ? (
            <p className="text-primary-gray text-sm">{t('settings.noWhitelist') || 'No whitelist addresses yet'}</p>
          ) : (
            whitelist.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-primary-dark/50 rounded-lg border border-primary-gray/30 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-white font-mono text-sm">{item.recipient_address}</p>
                  {editingLabel === item.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={editLabelValue}
                        onChange={(e) => setEditLabelValue(e.target.value)}
                        placeholder={t('settings.labelPlaceholder') || 'Label'}
                        className="flex-1 px-3 py-1.5 bg-primary-dark border border-primary-gray/30 rounded text-white text-sm focus:outline-none focus:border-primary-light/50"
                      />
                      <button
                        onClick={() => handleSaveLabel(item.id)}
                        className="p-1.5 hover:bg-primary-light/20 rounded"
                      >
                        <Save className="w-4 h-4 text-primary-light" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingLabel(null)
                          setEditLabelValue('')
                        }}
                        className="p-1.5 hover:bg-primary-light/20 rounded"
                      >
                        <X className="w-4 h-4 text-primary-gray" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-primary-gray text-sm">
                        {item.label || t('settings.noLabel') || 'No label'}
                      </p>
                      <button
                        onClick={() => {
                          setEditingLabel(item.id)
                          setEditLabelValue(item.label || '')
                        }}
                        className="p-1 hover:bg-primary-light/20 rounded"
                      >
                        <Edit2 className="w-3 h-3 text-primary-gray hover:text-primary-light" />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteWhitelist(item.id)}
                  disabled={loading}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-all ml-4"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 解绑邮箱确认对话框 */}
      <ConfirmDialog
        isOpen={showUnbindDialog}
        title={ready ? t('settings.unbindEmail') : '解绑邮箱'}
        message={ready ? t('settings.confirmUnbindEmail') : '确定要解绑当前邮箱吗？解绑后需要重新绑定新邮箱。'}
        onConfirm={handleUnbindEmail}
        onCancel={() => setShowUnbindDialog(false)}
        confirmText={ready ? t('settings.unbindEmail') : '解绑'}
        cancelText={ready ? t('common.cancel') : '取消'}
        confirmButtonClass="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
      />
    </div>
  )
}

