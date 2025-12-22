import { X, AlertTriangle, CheckCircle2, Wallet, ExternalLink } from 'lucide-react'
import { useTranslation } from 'next-i18next'

interface ApproveConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  transaction: {
    contractAddress: string
    network: string
    toAddress: string
    value: string
    assetType: string
    submittedBy: string
    currentConfirmations: number
    requiredConfirmations: number
  }
}

export function ApproveConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  transaction,
}: ApproveConfirmDialogProps) {
  const { t } = useTranslation('common')

  if (!isOpen) return null

  const getExplorerUrl = (network: string, address: string) => {
    const explorers: Record<string, string> = {
      ethereum: 'https://etherscan.io/address/',
      polygon: 'https://polygonscan.com/address/',
      bsc: 'https://bscscan.com/address/',
      arbitrum: 'https://arbiscan.io/address/',
      optimism: 'https://optimistic.etherscan.io/address/',
      base: 'https://basescan.org/address/',
      avalanche: 'https://snowtrace.io/address/',
      linea: 'https://lineascan.build/address/',
      zksync: 'https://explorer.zksync.io/address/',
      scroll: 'https://scrollscan.com/address/',
    }
    return explorers[network.toLowerCase()] ? `${explorers[network.toLowerCase()]}${address}` : null
  }

  const explorerUrl = getExplorerUrl(transaction.network, transaction.contractAddress)
  const domain = typeof window !== 'undefined' ? window.location.hostname : ''

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-lg m-4 border border-primary-light/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-light/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white">{t('transactions.confirmApproval') || 'Confirm Approval'}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-primary-light/20 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-primary-gray hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm font-medium mb-2">
              {t('transactions.pleaseVerifyInfo') || 'Please verify the following information before approving:'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 bg-primary-dark/50 rounded-lg">
              <span className="text-primary-gray text-sm">{t('transactions.currentDomain') || 'Current Domain'}:</span>
              <span className="text-white text-sm font-mono">{domain}</span>
            </div>

            <div className="flex items-start justify-between p-3 bg-primary-dark/50 rounded-lg">
              <span className="text-primary-gray text-sm">{t('transactions.contractAddress') || 'Contract Address'}:</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-mono">{transaction.contractAddress.slice(0, 6)}...{transaction.contractAddress.slice(-4)}</span>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-light hover:text-primary-gray transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between p-3 bg-primary-dark/50 rounded-lg">
              <span className="text-primary-gray text-sm">{t('transactions.network') || 'Network'}:</span>
              <span className="text-white text-sm capitalize">{transaction.network}</span>
            </div>

            <div className="flex items-start justify-between p-3 bg-primary-dark/50 rounded-lg">
              <span className="text-primary-gray text-sm">{t('transactions.recipient') || 'Recipient'}:</span>
              <span className="text-white text-sm font-mono">{transaction.toAddress.slice(0, 6)}...{transaction.toAddress.slice(-4)}</span>
            </div>

            <div className="flex items-start justify-between p-3 bg-primary-dark/50 rounded-lg">
              <span className="text-primary-gray text-sm">{t('transactions.amount') || 'Amount'}:</span>
              <span className="text-white text-sm font-semibold">{transaction.value} {transaction.assetType.toUpperCase()}</span>
            </div>

            <div className="flex items-start justify-between p-3 bg-primary-dark/50 rounded-lg">
              <span className="text-primary-gray text-sm">{t('transactions.submittedBy') || 'Submitted By'}:</span>
              <span className="text-white text-sm font-mono">{transaction.submittedBy.slice(0, 6)}...{transaction.submittedBy.slice(-4)}</span>
            </div>

            <div className="flex items-start justify-between p-3 bg-primary-dark/50 rounded-lg">
              <span className="text-primary-gray text-sm">{t('transactions.confirmations') || 'Confirmations'}:</span>
              <span className="text-white text-sm">
                {transaction.currentConfirmations} / {transaction.requiredConfirmations}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-light/20">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-primary-gray/20 hover:bg-primary-gray/30 text-white rounded-lg transition-all border border-primary-gray/30 hover:border-primary-gray/50 font-medium"
          >
            {t('transactions.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-primary-light hover:bg-primary-light/80 text-white rounded-lg transition-all font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t('transactions.confirmAndApprove') || 'Confirm & Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

