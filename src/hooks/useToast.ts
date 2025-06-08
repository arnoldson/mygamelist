import { useState, useCallback } from "react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastInterface {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastInterface[]>([])

  const addToast = useCallback((toast: Omit<ToastInterface, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastInterface = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  }
}
