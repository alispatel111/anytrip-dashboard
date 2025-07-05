"use client"

import { useState, useEffect } from "react"
import { X, Check, Info, AlertTriangle, Wifi, WifiOff } from "lucide-react"

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

    // Listen for custom toast events
    window.addEventListener("show-toast", handleToast)

    // Listen for server connection status
    window.addEventListener("server-status", (event) => {
      const { connected } = event.detail
      const message = connected ? "Server connected" : "Server disconnected - using local storage"
      const type = connected ? "success" : "warning"
      handleToast({ detail: { message, type, duration: 2000 } })
    })

    return () => {
      window.removeEventListener("show-toast", handleToast)
      window.removeEventListener("server-status", handleToast)
    }
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
      case "server-connected":
        return <Wifi size={16} />
      case "server-disconnected":
        return <WifiOff size={16} />
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
