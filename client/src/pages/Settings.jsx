"use client"

import { useState } from "react"
import { User, Bell, Palette, Globe, Save } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { useToast } from "../context/DataContext"

const Settings = () => {
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const [settings, setSettings] = useState({
    name: localStorage.getItem("employeeName") || "",
    email: "",
    notifications: true,
    autoSave: true,
    language: "en",
  })

  const handleSave = () => {
    localStorage.setItem("employeeName", settings.name)
    showToast("Settings saved successfully!", "success")
  }

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and application preferences</p>
        </div>
        <button className="add-btn primary" onClick={handleSave}>
          <Save size={20} />
          Save Changes
        </button>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <div className="section-header">
            <h2>
              <User size={20} />
              Profile Settings
            </h2>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h2>
              <Palette size={20} />
              Appearance
            </h2>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>Theme</label>
              <div className="theme-options">
                <button
                  className={`theme-btn ${theme === "light" ? "active" : ""}`}
                  onClick={() => theme === "dark" && toggleTheme()}
                >
                  Light Mode
                </button>
                <button
                  className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                  onClick={() => theme === "light" && toggleTheme()}
                >
                  Dark Mode
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h2>
              <Bell size={20} />
              Notifications
            </h2>
          </div>
          <div className="settings-form">
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleChange("notifications", e.target.checked)}
                />
                Enable notifications
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => handleChange("autoSave", e.target.checked)}
                />
                Auto-save changes
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h2>
              <Globe size={20} />
              Language & Region
            </h2>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>Language</label>
              <select value={settings.language} onChange={(e) => handleChange("language", e.target.value)}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
