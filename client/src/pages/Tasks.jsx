"use client"

import { useState } from "react"
import { Plus, Check, Trash2, Clock, CheckCircle, Edit3, CheckSquare } from "lucide-react"
import { useData } from "../context/DataContext"
import { useToast } from "../context/DataContext"

const Tasks = () => {
  const { tasks, addTask, toggleTask, removeTask, updateTask } = useData()
  const { showToast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.title.trim()) {
      if (editingTask) {
        updateTask(editingTask, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
        })
        showToast("Task updated successfully!", "success")
        setEditingTask(null)
      } else {
        addTask({
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
          completed: formData.status === "completed",
        })
        showToast("Task added successfully!", "success")
      }
      setFormData({ title: "", description: "", status: "pending" })
      setShowAddForm(false)
    }
  }

  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.completed ? "completed" : "pending",
    })
    setEditingTask(task.id)
    setShowAddForm(true)
  }

  const handleToggle = (id) => {
    toggleTask(id)
    showToast("Task status updated", "info")
  }

  const handleDeleteClick = (id) => {
    setDeleteTaskId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (deleteTaskId) {
      removeTask(deleteTaskId)
      showToast("Task deleted successfully!", "success")
      setShowDeleteConfirm(false)
      setDeleteTaskId(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteTaskId(null)
  }

  const pendingTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Manage your tasks and track progress</p>
        </div>
        <button
          className="add-btn primary"
          onClick={() => {
            setFormData({ title: "", description: "", status: "pending" })
            setEditingTask(null)
            setShowAddForm(true)
          }}
        >
          <Plus size={20} />
          Add New Task
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingTask ? "Edit Task" : "Add New Task"}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingTask(null)
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description (optional)"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingTask(null)
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary">
                  {editingTask ? "Update Task" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-form">
              <p>Are you sure you want to delete this task? This action cannot be undone.</p>
              <div className="form-actions">
                <button type="button" onClick={cancelDelete}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  style={{ backgroundColor: "var(--accent-red)" }}
                  onClick={confirmDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="tasks-container">
        {pendingTasks.length > 0 && (
          <div className="task-section">
            <div className="section-header">
              <h2>
                <Clock size={20} />
                Pending Tasks ({pendingTasks.length})
              </h2>
            </div>
            <div className="tasks-grid">
              {pendingTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <button className="task-checkbox" onClick={() => handleToggle(task.id)}>
                      <Check size={14} />
                    </button>
                    <h3>{task.title}</h3>
                    <div className="task-actions">
                      <button className="action-btn" onClick={() => handleEdit(task)} title="Edit task">
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteClick(task.id)}
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {task.description && <p className="task-description">{task.description}</p>}
                  <div className="task-status">
                    <span className="status-badge pending">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="task-section">
            <div className="section-header">
              <h2>
                <CheckCircle size={20} />
                Completed Tasks ({completedTasks.length})
              </h2>
            </div>
            <div className="tasks-grid">
              {completedTasks.map((task) => (
                <div key={task.id} className="task-card completed">
                  <div className="task-header">
                    <button className="task-checkbox checked" onClick={() => handleToggle(task.id)}>
                      <Check size={14} />
                    </button>
                    <h3>{task.title}</h3>
                    <div className="task-actions">
                      <button className="action-btn" onClick={() => handleEdit(task)} title="Edit task">
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteClick(task.id)}
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {task.description && <p className="task-description">{task.description}</p>}
                  <div className="task-status">
                    <span className="status-badge completed">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {tasks.length === 0 && (
        <div className="empty-state">
          <CheckSquare size={48} />
          <h3>No tasks yet</h3>
          <p>Add your first task to get started</p>
          <button
            className="add-btn primary"
            onClick={() => {
              setFormData({ title: "", description: "", status: "pending" })
              setEditingTask(null)
              setShowAddForm(true)
            }}
          >
            <Plus size={20} />
            Add New Task
          </button>
        </div>
      )}
    </div>
  )
}

export default Tasks
