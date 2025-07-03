import { Download, File, ExternalLink } from "lucide-react"

const Downloads = () => {
  const sampleDownloads = [
    {
      id: 1,
      name: "Employee_Report_2024.pdf",
      size: "2.4 MB",
      downloadedAt: "2 hours ago",
      type: "PDF Document",
    },
    {
      id: 2,
      name: "Budget_Analysis.xlsx",
      size: "1.8 MB",
      downloadedAt: "1 day ago",
      type: "Excel Spreadsheet",
    },
    {
      id: 3,
      name: "Project_Timeline.png",
      size: "856 KB",
      downloadedAt: "3 days ago",
      type: "Image",
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Downloads</h1>
          <p>View and manage your downloaded files</p>
        </div>
        <button className="add-btn secondary">
          <Download size={20} />
          Clear All
        </button>
      </div>

      <div className="downloads-section">
        <div className="section-header">
          <h2>Recent Downloads</h2>
        </div>
        <div className="downloads-list">
          {sampleDownloads.map((download) => (
            <div key={download.id} className="download-item">
              <div className="download-icon">
                <File size={24} />
              </div>
              <div className="download-info">
                <h4>{download.name}</h4>
                <p>
                  {download.type} • {download.size}
                </p>
                <span className="download-time">Downloaded {download.downloadedAt}</span>
              </div>
              <div className="download-actions">
                <button className="action-btn" title="Open file">
                  <ExternalLink size={16} />
                </button>
                <button className="action-btn" title="Download again">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {sampleDownloads.length === 0 && (
        <div className="empty-state">
          <Download size={48} />
          <h3>No downloads yet</h3>
          <p>Your downloaded files will appear here</p>
        </div>
      )}
    </div>
  )
}

export default Downloads
