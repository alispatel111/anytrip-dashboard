"use client"

import { useState } from "react"
import { ExternalLink, Edit3, Plus, Trash2, Search } from "lucide-react"
import { useData } from "../context/DataContext"
import { useToast } from "../context/DataContext"
import { FileSpreadsheet } from "lucide-react"

const GoogleSheets = () => {
  const { sheets, addSheet, removeSheet, updateSheet, loading } = useData()
  const { showToast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingSheet, setEditingSheet] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteSheetId, setDeleteSheetId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    status: "active",
    category: "General",
    description: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.title.trim() && formData.url.trim()) {
      if (editingSheet) {
        updateSheet(editingSheet.id, {
          title: formData.title.trim(),
          url: formData.url.trim(),
          status: formData.status,
          category: formData.category,
          description: formData.description.trim(),
        })
        showToast("Google Sheet updated successfully!", "success")
        setShowEditForm(false)
        setEditingSheet(null)
      } else {
        addSheet({
          title: formData.title.trim(),
          url: formData.url.trim(),
          status: formData.status,
          category: formData.category,
          description: formData.description.trim(),
          lastUpdated: "Just now",
        })
        showToast("Google Sheet added successfully!", "success")
        setShowAddForm(false)
      }
      setFormData({
        title: "",
        url: "",
        status: "active",
        category: "General",
        description: "",
      })
    }
  }

  const handleEdit = (sheet) => {
    setEditingSheet(sheet)
    setFormData({
      title: sheet.title,
      url: sheet.url,
      status: sheet.status,
      category: sheet.category || "General",
      description: sheet.description || "",
    })
    setShowEditForm(true)
  }

  const handleDeleteClick = (id) => {
    setDeleteSheetId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (deleteSheetId) {
      removeSheet(deleteSheetId)
      showToast("Google Sheet deleted successfully!", "success")
      setShowDeleteConfirm(false)
      setDeleteSheetId(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteSheetId(null)
  }

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

  // Filter and search functionality
  const filteredSheets = sheets.filter((sheet) => {
    const matchesSearch =
      sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || sheet.status === filterStatus
    const matchesCategory = filterCategory === "all" || sheet.category === filterCategory

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Get unique categories for filter
  const categories = [...new Set(sheets.map((sheet) => sheet.category))].filter(Boolean)

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <h2>Loading Google Sheets...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Google Sheets</h1>
          <p>Manage your Google Sheets and quick access links</p>
        </div>
        <button className="add-btn primary" onClick={() => setShowAddForm(true)}>
          <Plus size={20} />
          Add New Sheet
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search sheets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || showEditForm) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingSheet ? "Edit Google Sheet" : "Add New Google Sheet"}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddForm(false)
                  setShowEditForm(false)
                  setEditingSheet(null)
                  setFormData({
                    title: "",
                    url: "",
                    status: "active",
                    category: "General",
                    description: "",
                  })
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Sheet Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter sheet name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Google Sheets URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Customer Service">Customer Service</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the sheet"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setShowEditForm(false)
                    setEditingSheet(null)
                    setFormData({
                      title: "",
                      url: "",
                      status: "active",
                      category: "General",
                      description: "",
                    })
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary">
                  {editingSheet ? "Update Sheet" : "Add Sheet"}
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
              <p>Are you sure you want to delete this Google Sheet? This action cannot be undone.</p>
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

      <div className="sheets-grid">
        {filteredSheets.map((sheet) => (
          <div key={sheet.id} className="sheet-card">
            <div className="sheet-header">
              <div className="sheet-title-section">
                <h3>{sheet.title}</h3>
                {sheet.category && <span className="category-tag">{sheet.category}</span>}
              </div>
              <div className="sheet-actions">
                <button className="action-btn" onClick={() => window.open(sheet.url, "_blank")} title="Open in new tab">
                  <ExternalLink size={16} />
                </button>
                <button className="action-btn" onClick={() => handleEdit(sheet)} title="Edit sheet">
                  <Edit3 size={16} />
                </button>
                <button className="action-btn delete" onClick={() => handleDeleteClick(sheet.id)} title="Delete sheet">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {sheet.description && <p className="sheet-description">{sheet.description}</p>}
            <div className="sheet-meta">
              <span className={`status-badge ${getStatusColor(sheet.status)}`}>{sheet.status}</span>
              <span className="last-updated">Updated {sheet.lastUpdated}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredSheets.length === 0 && sheets.length > 0 && (
        <div className="empty-state">
          <Search size={48} />
          <h3>No sheets found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {sheets.length === 0 && (
        <div className="empty-state">
          <FileSpreadsheet size={48} />
          <h3>No Google Sheets yet</h3>
          <p>Add your first Google Sheet to get started</p>
          <button className="add-btn primary" onClick={() => setShowAddForm(true)}>
            <Plus size={20} />
            Add New Sheet
          </button>
        </div>
      )}
    </div>
  )
}

export default GoogleSheets
