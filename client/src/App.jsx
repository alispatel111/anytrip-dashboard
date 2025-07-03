"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import Dashboard from "./pages/Dashboard"
import GoogleSheets from "./pages/GoogleSheets"
import Tasks from "./pages/Tasks"
import Settings from "./pages/Settings"
import { ThemeProvider } from "./context/ThemeContext"
import { DataProvider } from "./context/DataContext"
import Toast from "./components/Toast"
import "./App.css"

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ThemeProvider>
      <DataProvider>
        <Router>
          <div className="app">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
              <main className="page-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/google-sheets" element={<GoogleSheets />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
            <Toast />
          </div>
        </Router>
      </DataProvider>
    </ThemeProvider>
  )
}

export default App
