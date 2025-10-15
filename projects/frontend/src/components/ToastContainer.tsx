import { AnimatePresence } from 'framer-motion'
import Toast, { ToastProps } from './Toast'

interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastContainer