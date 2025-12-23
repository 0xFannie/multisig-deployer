import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useTranslation } from 'next-i18next'
import { X, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

interface SignatureAuthModalProps {
  isOpen: boolean
  onSuccess: (userId: string) => void
  onClose?: () => void
}

export function SignatureAuthModal({ isOpen, onSuccess, onClose }: SignatureAuthModalProps) {
  const { t } = useTranslation('common')
  const { address } = useAccount()
  const [message, setMessage] = useState<string>('')
  const [isSigning, setIsSigning] = useState(false)

  // 生成签名消息
  useEffect(() => {
    if (address && isOpen) {
      const authMessage = `Welcome to MultiSig Wallet Deployer!\n\nPlease sign this message to authorize access to your wallet information.\n\nWallet: ${address}\n\nThis signature does not grant any transaction permissions.`
      setMessage(authMessage)
    }
  }, [address, isOpen])

  const { signMessageAsync } = useSignMessage()

  const handleSign = async () => {
    if (!address || !message) return

    setIsSigning(true)
    try {
      // 请求用户签名
      const signature = await signMessageAsync({ message })

      // 发送签名到后端
      const response = await fetch('/api/users/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to connect wallet')
      }

      const data = await response.json()
      if (data.success && data.user?.id) {
        // 保存 userId 到 localStorage
        localStorage.setItem('multisig_user_id', data.user.id)
        toast.success(t('auth.signatureSuccess') || 'Wallet authorized successfully!')
        onSuccess(data.user.id)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Signature error:', error)
      if (error?.message?.includes('User rejected')) {
        toast.error(t('auth.signatureRejected') || 'Signature was rejected')
      } else {
        toast.error(error?.message || t('auth.signatureFailed') || 'Failed to authorize wallet')
      }
    } finally {
      setIsSigning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-primary-light/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {t('auth.authorizeWallet') || 'Authorize Wallet'}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-primary-gray hover:text-white transition-colors"
              disabled={isSigning}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-4 bg-primary-dark/50 rounded-lg border border-primary-light/10">
            <AlertCircle className="w-5 h-5 text-primary-light flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-primary-gray">
                {t('auth.authorizeDescription') || 'Please sign this message to authorize MultiSig Wallet Deployer to access your wallet information. This signature does not grant any transaction permissions.'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-primary-dark/30 rounded-lg border border-primary-light/10">
            <p className="text-xs text-primary-gray mb-2">
              {t('auth.messageToSign') || 'Message to sign:'}
            </p>
            <p className="text-sm text-white whitespace-pre-wrap break-words font-mono">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              disabled={isSigning}
              className="flex-1 px-4 py-3 rounded-lg bg-primary-dark border border-primary-light/30 text-primary-gray hover:text-white hover:border-primary-light/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
          )}
          <button
            onClick={handleSign}
            disabled={isSigning || !message}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-light to-primary-gray text-primary-black font-semibold hover:shadow-lg hover:shadow-primary-light/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSigning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>{t('auth.signing') || 'Signing...'}</span>
              </>
            ) : (
              <span>{t('auth.signMessage') || 'Sign Message'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

