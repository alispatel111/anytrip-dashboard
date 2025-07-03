"use client"

import { useState, useEffect } from "react"
import { X, Check, Info, AlertTriangle } from "lucide-react"

let toastId = 0

const Toast = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handleToast = (event) => {
      const { message, type = "info", duration = 3000 } = event.detail
      const id = ++toastId

      setToasts((prev) => [...prev, { id, message, type }])

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, duration)
    }

    window.addEventListener("show-toast", handleToast)
    return () => window.removeEventListener("show-toast", handleToast)
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <Check size={16} />
      case "error":
        return <AlertTriangle size={16} />
      case "warning":
        return <AlertTriangle size={16} />
      default:
        return <Info size={16} />
    }
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <div className="toast-icon">{getIcon(toast.type)}</div>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toast
