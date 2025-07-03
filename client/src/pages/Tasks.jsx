"use client"

import { useState } from "react"
import { Plus, Check, Trash2, Clock, CheckCircle, Edit3, CheckSquare, Search, Pin, PinOff } from "lucide-react"
import { useData } from "../context/DataContext"
import { useToast } from "../context/DataContext"

const Tasks = () => {
  const { tasks, addTask, toggleTask, removeTask, updateTask, toggleTaskPin } = useData()
  const { showToast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
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

  const handleTogglePin = (id) => {
    const task = tasks.find((t) => t.id === id)
    toggleTaskPin(id)
    showToast(task.pinned ? "Task unpinned" : "Task pinned to top", "info")
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

  // Filter tasks by search term
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Separate tasks by completion and pin status
  const pinnedPendingTasks = filteredTasks.filter((task) => !task.completed && task.pinned)
  const unpinnedPendingTasks = filteredTasks.filter((task) => !task.completed && !task.pinned)
  const pinnedCompletedTasks = filteredTasks.filter((task) => task.completed && task.pinned)
  const unpinnedCompletedTasks = filteredTasks.filter((task) => task.completed && !task.pinned)

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

      {/* Search Section */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search tasks by title, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
        {/* Pinned Pending Tasks */}
        {pinnedPendingTasks.length > 0 && (
          <div className="task-section pinned-section">
            <div className="section-header">
              <h2>
                📌 <Clock size={20} />
                Pinned Pending Tasks ({pinnedPendingTasks.length})
              </h2>
            </div>
            <div className="tasks-grid">
              {pinnedPendingTasks.map((task) => (
                <div key={task.id} className="task-card pinned">
                  <div className="task-header">
                    <button className="task-checkbox" onClick={() => handleToggle(task.id)}>
                      <Check size={14} />
                    </button>
                    <h3>{task.title}</h3>
                    <div className="task-actions">
                      <button
                        className="action-btn pin-btn active"
                        onClick={() => handleTogglePin(task.id)}
                        title="Unpin from top"
                      >
                        <Pin size={14} />
                      </button>
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

        {/* Regular Pending Tasks */}
        {unpinnedPendingTasks.length > 0 && (
          <div className="task-section">
            <div className="section-header">
              <h2>
                <Clock size={20} />
                {pinnedPendingTasks.length > 0 ? "Other " : ""}Pending Tasks ({unpinnedPendingTasks.length})
              </h2>
            </div>
            <div className="tasks-grid">
              {unpinnedPendingTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <button className="task-checkbox" onClick={() => handleToggle(task.id)}>
                      <Check size={14} />
                    </button>
                    <h3>{task.title}</h3>
                    <div className="task-actions">
                      <button
                        className="action-btn pin-btn"
                        onClick={() => handleTogglePin(task.id)}
                        title="Pin to top"
                      >
                        <PinOff size={14} />
                      </button>
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

        {/* Pinned Completed Tasks */}
        {pinnedCompletedTasks.length > 0 && (
          <div className="task-section pinned-section">
            <div className="section-header">
              <h2>
                📌 <CheckCircle size={20} />
                Pinned Completed Tasks ({pinnedCompletedTasks.length})
              </h2>
            </div>
            <div className="tasks-grid">
              {pinnedCompletedTasks.map((task) => (
                <div key={task.id} className="task-card completed pinned">
                  <div className="task-header">
                    <button className="task-checkbox checked" onClick={() => handleToggle(task.id)}>
                      <Check size={14} />
                    </button>
                    <h3>{task.title}</h3>
                    <div className="task-actions">
                      <button
                        className="action-btn pin-btn active"
                        onClick={() => handleTogglePin(task.id)}
                        title="Unpin from top"
                      >
                        <Pin size={14} />
                      </button>
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

        {/* Regular Completed Tasks */}
        {unpinnedCompletedTasks.length > 0 && (
          <div className="task-section">
            <div className="section-header">
              <h2>
                <CheckCircle size={20} />
                {pinnedCompletedTasks.length > 0 ? "Other " : ""}Completed Tasks ({unpinnedCompletedTasks.length})
              </h2>
            </div>
            <div className="tasks-grid">
              {unpinnedCompletedTasks.map((task) => (
                <div key={task.id} className="task-card completed">
                  <div className="task-header">
                    <button className="task-checkbox checked" onClick={() => handleToggle(task.id)}>
                      <Check size={14} />
                    </button>
                    <h3>{task.title}</h3>
                    <div className="task-actions">
                      <button
                        className="action-btn pin-btn"
                        onClick={() => handleTogglePin(task.id)}
                        title="Pin to top"
                      >
                        <PinOff size={14} />
                      </button>
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

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="empty-state">
          <Search size={48} />
          <h3>No tasks found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      )}

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
