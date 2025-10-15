import { motion } from 'framer-motion'
import { CheckCircle, ExternalLink, X, Copy } from 'lucide-react'
import { useState } from 'react'

interface SuccessToastProps {
  title: string
  message?: string
  explorerUrl?: string
  onClose: () => void
}

const SuccessToast = ({ title, message, explorerUrl, onClose }: SuccessToastProps) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    if (explorerUrl) {
      await navigator.clipboard.writeText(explorerUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5 }}
      className="glass-dark rounded-xl p-4 shadow-2xl border border-white/10 min-w-[350px] max-w-md"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm">{title}</h4>
          {message && (
            <p className="text-gray-300 text-xs mt-1 leading-relaxed">{message}</p>
          )}
          
          {explorerUrl && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => window.open(explorerUrl, '_blank')}
                className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View on Explorer
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 text-gray-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  )
}

export default SuccessToast