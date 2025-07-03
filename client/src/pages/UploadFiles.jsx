"use client"

import { useState } from "react"
import { Upload, File, X, Download } from "lucide-react"
import { useToast } from "../context/DataContext"

const UploadFiles = () => {
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState([])
  const { showToast } = useToast()

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    const fileObjects = newFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toLocaleString(),
    }))
    setFiles((prev) => [...prev, ...fileObjects])
    showToast(`${newFiles.length} file(s) uploaded successfully!`, "success")
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
    showToast("File removed", "info")
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Upload Files</h1>
          <p>Upload and manage your files</p>
        </div>
        {files.length > 0 && (
          <button className="add-btn secondary">
            <Download size={20} />
            Download All
          </button>
        )}
      </div>

      <div className="upload-section">
        <div
          className={`upload-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={48} />
          <h3>Drag & drop files here</h3>
          <p>or click to browse files</p>
          <label className="upload-btn">
            <input type="file" multiple onChange={handleFileInput} style={{ display: "none" }} />
            Choose Files
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="files-section">
          <div className="section-header">
            <h2>Uploaded Files ({files.length})</h2>
          </div>
          <div className="files-grid">
            {files.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-icon">
                  <File size={24} />
                </div>
                <div className="file-info">
                  <h4>{file.name}</h4>
                  <p>{formatFileSize(file.size)}</p>
                  <span className="upload-time">Uploaded {file.uploadedAt}</span>
                </div>
                <div className="file-actions">
                  <button className="action-btn" title="Download">
                    <Download size={16} />
                  </button>
                  <button className="action-btn delete" onClick={() => removeFile(file.id)} title="Remove file">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="empty-state">
          <Upload size={48} />
          <h3>No files uploaded yet</h3>
          <p>Start by uploading your first file</p>
        </div>
      )}
    </div>
  )
}

export default UploadFiles
