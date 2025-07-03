"use client"

import { Link } from "react-router-dom"
import { ExternalLink, Plus, CheckCircle, Clock } from "lucide-react"
import { useData } from "../context/DataContext"

const Dashboard = () => {
  const { sheets, tasks } = useData()

  const completedTasks = tasks.filter((task) => task.completed).length
  const pendingTasks = tasks.filter((task) => !task.completed).length
  const recentSheets = sheets.slice(0, 4)

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green"
      case "pending":
        return "orange"
      case "inactive":
        return "red"
      default:
        return "gray"
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's an overview of your workspace</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stats-row">
          <div className="stats-card blue">
            <div className="stats-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stats-content">
              <h3>{tasks.length}</h3>
              <p>Total Tasks</p>
            </div>
          </div>
          <div className="stats-card green">
            <div className="stats-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stats-content">
              <h3>{completedTasks}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stats-card orange">
            <div className="stats-icon">
              <Clock size={24} />
            </div>
            <div className="stats-content">
              <h3>{pendingTasks}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stats-card purple">
            <div className="stats-icon">
              <ExternalLink size={24} />
            </div>
            <div className="stats-content">
              <h3>{sheets.length}</h3>
              <p>Google Sheets</p>
            </div>
          </div>
        </div>

        <div className="main-row">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Google Sheets</h2>
              <Link to="/google-sheets" className="view-all-btn">
                View All
              </Link>
            </div>
            <div className="sheets-preview">
              {recentSheets.map((sheet) => (
                <div key={sheet.id} className="sheet-preview-card">
                  <div className="sheet-info">
                    <h4>{sheet.title}</h4>
                    <div className="sheet-meta">
                      <span className={`status-badge ${getStatusColor(sheet.status)}`}>{sheet.status}</span>
                      <span className="last-updated">Updated {sheet.lastUpdated}</span>
                    </div>
                  </div>
                  <button
                    className="action-btn"
                    onClick={() => window.open(sheet.url, "_blank")}
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              ))}
              {sheets.length === 0 && (
                <div className="empty-preview">
                  <p>No Google Sheets yet</p>
                  <Link to="/google-sheets" className="add-btn primary">
                    <Plus size={16} />
                    Add First Sheet
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Tasks</h2>
              <Link to="/tasks" className="view-all-btn">
                View All
              </Link>
            </div>
            <div className="tasks-preview">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className={`task-preview-item ${task.completed ? "completed" : ""}`}>
                  <div className="task-checkbox-preview">
                    {task.completed ? <CheckCircle size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <span className={`status-badge ${task.completed ? "completed" : "pending"}`}>
                    {task.completed ? "Completed" : "Pending"}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="empty-preview">
                  <p>No tasks yet</p>
                  <Link to="/tasks" className="add-btn primary">
                    <Plus size={16} />
                    Add First Task
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
