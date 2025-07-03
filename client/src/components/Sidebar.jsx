"use client"

import { Link, useLocation } from "react-router-dom"
import { Home, FileSpreadsheet, CheckSquare, Upload, Download, Settings, X } from "lucide-react"
import { useData } from "../context/DataContext"

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { sheets, tasks } = useData()

  const menuItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/dashboard",
      count: null,
    },
    {
      icon: FileSpreadsheet,
      label: "Google Sheets",
      path: "/google-sheets",
      count: sheets.length,
    },
    {
      icon: CheckSquare,
      label: "Tasks",
      path: "/tasks",
      count: tasks.length,
    },
    {
      icon: Upload,
      label: "Upload Files",
      path: "/upload-files",
      count: null,
    },
    {
      icon: Download,
      label: "Downloads",
      path: "/downloads",
      count: null,
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
      count: null,
    },
  ]

  const isActive = (path) => {
    if (path === "/dashboard" && (location.pathname === "/" || location.pathname === "/dashboard")) {
      return true
    }
    return location.pathname === path
  }

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "active" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Dashboard</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={onClose}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.count !== null && <span className="count-badge">{item.count}</span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
