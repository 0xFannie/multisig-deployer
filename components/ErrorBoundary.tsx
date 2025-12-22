import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // 检查是否是 MetaMask 相关错误，如果是则不显示错误边界
    const errorMessage = String(error?.message || error?.toString() || '')
    if (
      errorMessage.includes('Failed to connect to MetaMask') ||
      errorMessage.includes('MetaMask extension not found') ||
      errorMessage.includes('MetaMask') ||
      errorMessage.includes('i: Failed to connect')
    ) {
      // 不显示错误边界，让 RainbowKit 正常处理
      return { hasError: false, error: null }
    }
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMessage = String(error?.message || error?.toString() || '')
    // 不记录 MetaMask 相关错误
    if (
      !errorMessage.includes('Failed to connect to MetaMask') &&
      !errorMessage.includes('MetaMask extension not found') &&
      !errorMessage.includes('MetaMask') &&
      !errorMessage.includes('i: Failed to connect')
    ) {
      console.error('Uncaught error:', error, errorInfo)
    }
  }

  public render() {
    // 如果是 MetaMask 错误，不显示错误边界
    if (this.state.hasError && this.state.error) {
      const errorMessage = String(this.state.error?.message || this.state.error?.toString() || '')
      if (
        errorMessage.includes('Failed to connect to MetaMask') ||
        errorMessage.includes('MetaMask extension not found') ||
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('i: Failed to connect')
      ) {
        return this.props.children
      }
      
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h2 className="text-red-400 font-semibold mb-2">Something went wrong</h2>
          <p className="text-red-300 text-sm">{this.state.error.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}

