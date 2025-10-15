import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const Toast = ({ id, type, title, message, duration = 5000, onClose }: ToastProps) => {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100))
        if (newProgress <= 0) {
          onClose(id)
          return 0
        }
        return newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, id, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'from-green-500 to-emerald-500',
    error: 'from-red-500 to-rose-500',
    warning: 'from-yellow-500 to-orange-500',
    info: 'from-blue-500 to-cyan-500'
  }

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5 }}
      className="glass-dark rounded-xl p-4 shadow-2xl border border-white/10 min-w-[320px] max-w-md"
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${colors[type]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm">{title}</h4>
          {message && (
            <p className="text-gray-300 text-xs mt-1 leading-relaxed">{message}</p>
          )}
        </div>
        
        <button
          onClick={() => onClose(id)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colors[type]} rounded-full`}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  )
}

export default Toast