import { X, AlertCircle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  confirmButtonClass?: string
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-primary-light hover:bg-primary-light/80',
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md m-4 border border-primary-light/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-light/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-light/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-primary-light" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-primary-light/20 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-primary-gray hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-primary-gray text-base leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-light/20">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-primary-gray/20 hover:bg-primary-gray/30 text-white rounded-lg transition-all border border-primary-gray/30 hover:border-primary-gray/50 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 ${confirmButtonClass} text-white rounded-lg transition-all font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

