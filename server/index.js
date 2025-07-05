import express from "express"
import cors from "cors"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Enable CORS for all routes with more permissive settings
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://anytrip-erp.vercel.app",
      "https://anytrip-dashboard-server.vercel.app",
      /\.vercel\.app$/,
      /localhost:\d+$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", JSON.stringify(req.body, null, 2))
  }
  next()
})

// In-memory storage with better default data
let sheetsData = [
  {
    id: 1,
    title: "Employee Database",
    url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    status: "active",
    lastUpdated: "2 hours ago",
    category: "HR",
    description: "Complete employee information and records",
    pinned: true,
  },
  {
    id: 2,
    title: "Project Timeline",
    url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    status: "active",
    lastUpdated: "1 day ago",
    category: "Project Management",
    description: "Project milestones and deadlines tracking",
    pinned: false,
  },
  {
    id: 3,
    title: "Budget Analysis",
    url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    status: "pending",
    lastUpdated: "3 days ago",
    category: "Finance",
    description: "Monthly budget analysis and forecasting",
    pinned: false,
  },
]

let tasksData = [
  {
    id: 1,
    title: "Review employee database",
    description: "Check for missing information and update records",
    completed: false,
    priority: "high",
    dueDate: "2024-01-15",
    category: "HR",
    pinned: true,
  },
  {
    id: 2,
    title: "Update project timeline",
    description: "Add Q2 milestones and deadlines",
    completed: true,
    priority: "medium",
    dueDate: "2024-01-10",
    category: "Project Management",
    pinned: false,
  },
  {
    id: 3,
    title: "Prepare monthly report",
    description: "Compile data for monthly performance report",
    completed: false,
    priority: "medium",
    dueDate: "2024-01-20",
    category: "General",
    pinned: false,
  },
]

// Helper function to write JSON files safely (for local development)
const writeJsonFile = (filename, data) => {
  try {
    if (process.env.NODE_ENV !== "production") {
      const filePath = join(__dirname, "data", filename)

      // Ensure directory exists
      const dir = dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8")
      console.log(`✅ Successfully updated ${filename}`)
    }
    return true
  } catch (error) {
    console.error(`❌ Error writing ${filename}:`, error)
    return false
  }
}

// Update sheets with better validation
app.post("/api/update-sheets", (req, res) => {
  try {
    console.log("📝 Updating sheets...")
    const { sheets } = req.body

    if (!sheets || !Array.isArray(sheets)) {
      console.error("❌ Invalid sheets data:", sheets)
      return res.status(400).json({
        success: false,
        error: "Invalid sheets data provided - must be an array",
      })
    }

    // Validate each sheet has required fields
    const validSheets = sheets.filter((sheet) => sheet && typeof sheet === "object" && sheet.title && sheet.url)

    if (validSheets.length !== sheets.length) {
      console.warn("⚠️ Some sheets were invalid and filtered out")
    }

    sheetsData = validSheets
    writeJsonFile("sheets.json", validSheets)

    console.log(`✅ Sheets updated successfully: ${validSheets.length} items`)

    res.json({
      success: true,
      message: "Sheets updated successfully",
      count: validSheets.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in /api/update-sheets:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Update tasks with better validation
app.post("/api/update-tasks", (req, res) => {
  try {
    console.log("📝 Updating tasks...")
    const { tasks } = req.body

    if (!tasks || !Array.isArray(tasks)) {
      console.error("❌ Invalid tasks data:", tasks)
      return res.status(400).json({
        success: false,
        error: "Invalid tasks data provided - must be an array",
      })
    }

    // Validate each task has required fields
    const validTasks = tasks.filter((task) => task && typeof task === "object" && task.title)

    if (validTasks.length !== tasks.length) {
      console.warn("⚠️ Some tasks were invalid and filtered out")
    }

    tasksData = validTasks
    writeJsonFile("tasks.json", validTasks)

    console.log(`✅ Tasks updated successfully: ${validTasks.length} items`)

    res.json({
      success: true,
      message: "Tasks updated successfully",
      count: validTasks.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in /api/update-tasks:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Health check endpoint with more info
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "AnyTrip Dashboard Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    dataStatus: {
      sheets: sheetsData.length,
      tasks: tasksData.length,
    },
    version: "1.0.0",
  })
})

// Get current data with better error handling
app.get("/api/sheets", (req, res) => {
  try {
    console.log(`📊 Serving ${sheetsData.length} sheets`)
    res.json(sheetsData)
  } catch (error) {
    console.error("❌ Error reading sheets:", error)
    res.status(500).json({
      error: "Failed to read sheets data",
      details: error.message,
    })
  }
})

app.get("/api/tasks", (req, res) => {
  try {
    console.log(`📊 Serving ${tasksData.length} tasks`)
    res.json(tasksData)
  } catch (error) {
    console.error("❌ Error reading tasks:", error)
    res.status(500).json({
      error: "Failed to read tasks data",
      details: error.message,
    })
  }
})

// Verify data endpoint
app.get("/api/verify/:type", (req, res) => {
  try {
    const { type } = req.params
    const data = type === "sheets" ? sheetsData : tasksData

    res.json({
      success: true,
      type: type,
      itemCount: data.length,
      lastModified: new Date().toISOString(),
      data: data,
    })
  } catch (error) {
    console.error("❌ Error verifying data:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Root endpoint with better info
app.get("/", (req, res) => {
  res.json({
    message: "AnyTrip Dashboard API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "GET /api/health",
      sheets: "GET /api/sheets",
      tasks: "GET /api/tasks",
      updateSheets: "POST /api/update-sheets",
      updateTasks: "POST /api/update-tasks",
      verify: "GET /api/verify/:type",
    },
    dataStatus: {
      sheets: sheetsData.length,
      tasks: tasksData.length,
    },
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error)
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: error.message,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
    method: req.method,
  })
})

// Start server
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
    console.log(`📊 Data status: Sheets: ${sheetsData.length}, Tasks: ${tasksData.length}`)
    console.log("✨ Ready to serve API requests!")
  })
}

// Export for Vercel
export default app
