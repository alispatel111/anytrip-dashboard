"use client"

import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { Menu, Sun, Moon, User } from "lucide-react"

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme()
  const [employeeName, setEmployeeName] = useState("")
  const [showNameInput, setShowNameInput] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem("employeeName")
    if (savedName) {
      setEmployeeName(savedName)
    }
  }, [])

  const handleNameSave = (name) => {
    setEmployeeName(name)
    localStorage.setItem("employeeName", name)
    setShowNameInput(false)
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="welcome-section">
          {employeeName ? (
            <div className="welcome-message">
              <span>Welcome back, </span>
              <button className="employee-name" onClick={() => setShowNameInput(true)}>
                {employeeName}
              </button>
            </div>
          ) : (
            <button className="add-name-btn" onClick={() => setShowNameInput(true)}>
              <User size={16} />
              Add your name
            </button>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {showNameInput && (
        <div className="name-modal">
          <div className="name-modal-content">
            <h3>Enter your name</h3>
            <input
              type="text"
              placeholder="Your name"
              defaultValue={employeeName}
              onKeyPress={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  handleNameSave(e.target.value.trim())
                }
              }}
              autoFocus
            />
            <div className="name-modal-actions">
              <button onClick={() => setShowNameInput(false)}>Cancel</button>
              <button
                onClick={(e) => {
                  const input = e.target.parentElement.previousElementSibling
                  if (input.value.trim()) {
                    handleNameSave(input.value.trim())
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
