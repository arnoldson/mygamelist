import { useEffect, useState } from "react"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"
import { ToastInterface } from "@/hooks/useToast"

interface ToastProps {
  toast: ToastInterface
  onRemove: (id: string) => void
}

const Toast = ({ toast, onRemove }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 300) // Wait for exit animation
  }

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "info":
        return "bg-blue-50 border-blue-200"
    }
  }

  const getTextColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-800"
      case "error":
        return "text-red-800"
      case "warning":
        return "text-yellow-800"
      case "info":
        return "text-blue-800"
    }
  }

  const getSecondaryTextColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "warning":
        return "text-yellow-600"
      case "info":
        return "text-blue-600"
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${
          isVisible && !isExiting
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      <div
        className={`
          ${getBackgroundColor()}
          border rounded-lg p-4 shadow-lg min-w-[320px] max-w-md
          backdrop-blur-sm
        `}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3 mt-0.5">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={`text-sm mt-1 ${getSecondaryTextColor()}`}>
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className={`
              flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600
              transition-colors duration-200
            `}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastInterface[]
  onRemove: (id: string) => void
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

export default ToastContainer
