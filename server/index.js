import express from "express"
import cors from "cors"

const app = express()
const PORT = process.env.PORT || 3001

// Enhanced CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true)

      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://anytrip-erp.vercel.app",
        "https://anytrip-dashboard-server.vercel.app",
      ]

      // Allow any vercel.app subdomain
      if (origin.includes(".vercel.app")) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(null, true) // Allow all for now
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  }),
)

// Middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`\n🔍 [${timestamp}] ${req.method} ${req.path}`)
  console.log(`📍 Origin: ${req.get("origin") || "No origin"}`)
  console.log(`🌐 User-Agent: ${req.get("user-agent") || "No user-agent"}`)

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, JSON.stringify(req.body, null, 2))
  }

  // Log response
  const originalSend = res.send
  res.send = function (data) {
    console.log(`📤 Response [${req.method} ${req.path}]:`, res.statusCode)
    return originalSend.call(this, data)
  }

  next()
})

// In-memory storage with persistent data
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  const healthData = {
    status: "OK",
    message: "AnyTrip Dashboard Server is running perfectly!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    dataStatus: {
      sheets: sheetsData.length,
      tasks: tasksData.length,
    },
    version: "2.0.0",
    uptime: process.uptime(),
  }

  console.log("✅ Health check successful:", healthData)
  res.json(healthData)
})

// Get sheets
app.get("/api/sheets", (req, res) => {
  try {
    console.log(`📊 Serving ${sheetsData.length} sheets`)
    res.json(sheetsData)
  } catch (error) {
    console.error("❌ Error serving sheets:", error)
    res.status(500).json({
      error: "Failed to get sheets",
      details: error.message,
    })
  }
})

// Get tasks
app.get("/api/tasks", (req, res) => {
  try {
    console.log(`📊 Serving ${tasksData.length} tasks`)
    res.json(tasksData)
  } catch (error) {
    console.error("❌ Error serving tasks:", error)
    res.status(500).json({
      error: "Failed to get tasks",
      details: error.message,
    })
  }
})

// Update sheets
app.post("/api/update-sheets", (req, res) => {
  try {
    console.log("📝 Processing sheets update...")
    const { sheets } = req.body

    if (!sheets || !Array.isArray(sheets)) {
      console.error("❌ Invalid sheets data received:", typeof sheets)
      return res.status(400).json({
        success: false,
        error: "Invalid sheets data - must be an array",
        received: typeof sheets,
      })
    }

    // Validate and clean data
    const validSheets = sheets.filter((sheet) => {
      return (
        sheet &&
        typeof sheet === "object" &&
        sheet.title &&
        typeof sheet.title === "string" &&
        sheet.url &&
        typeof sheet.url === "string"
      )
    })

    if (validSheets.length !== sheets.length) {
      console.warn(`⚠️ Filtered out ${sheets.length - validSheets.length} invalid sheets`)
    }

    // Update the data
    sheetsData = validSheets
    console.log(`✅ Sheets updated successfully: ${validSheets.length} items`)

    const response = {
      success: true,
      message: "Sheets updated successfully",
      count: validSheets.length,
      timestamp: new Date().toISOString(),
      filtered: sheets.length - validSheets.length,
    }

    console.log("📤 Sheets update response:", response)
    res.json(response)
  } catch (error) {
    console.error("❌ Error updating sheets:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    })
  }
})

// Update tasks
app.post("/api/update-tasks", (req, res) => {
  try {
    console.log("📝 Processing tasks update...")
    const { tasks } = req.body

    if (!tasks || !Array.isArray(tasks)) {
      console.error("❌ Invalid tasks data received:", typeof tasks)
      return res.status(400).json({
        success: false,
        error: "Invalid tasks data - must be an array",
        received: typeof tasks,
      })
    }

    // Validate and clean data
    const validTasks = tasks.filter((task) => {
      return task && typeof task === "object" && task.title && typeof task.title === "string"
    })

    if (validTasks.length !== tasks.length) {
      console.warn(`⚠️ Filtered out ${tasks.length - validTasks.length} invalid tasks`)
    }

    // Update the data
    tasksData = validTasks
    console.log(`✅ Tasks updated successfully: ${validTasks.length} items`)

    const response = {
      success: true,
      message: "Tasks updated successfully",
      count: validTasks.length,
      timestamp: new Date().toISOString(),
      filtered: tasks.length - validTasks.length,
    }

    console.log("📤 Tasks update response:", response)
    res.json(response)
  } catch (error) {
    console.error("❌ Error updating tasks:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    })
  }
})

// Debug endpoint to check current data
app.get("/api/debug", (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    },
    data: {
      sheets: {
        count: sheetsData.length,
        items: sheetsData,
      },
      tasks: {
        count: tasksData.length,
        items: tasksData,
      },
    },
  }

  console.log("🐛 Debug info requested:", debugInfo)
  res.json(debugInfo)
})

// Root endpoint
app.get("/", (req, res) => {
  const info = {
    message: "🚀 AnyTrip Dashboard API v2.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "GET /api/health",
      sheets: "GET /api/sheets",
      tasks: "GET /api/tasks",
      updateSheets: "POST /api/update-sheets",
      updateTasks: "POST /api/update-tasks",
      debug: "GET /api/debug",
    },
    dataStatus: {
      sheets: sheetsData.length,
      tasks: tasksData.length,
    },
  }

  console.log("🏠 Root endpoint accessed:", info)
  res.json(info)
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error)
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: error.message,
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Not found: ${req.method} ${req.path}`)
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  })
})

// Start server
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`\n🚀 AnyTrip Dashboard Server v2.0`)
    console.log(`📍 Running on: http://localhost:${PORT}`)
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
    console.log(`🐛 Debug info: http://localhost:${PORT}/api/debug`)
    console.log(`📊 Data status: Sheets: ${sheetsData.length}, Tasks: ${tasksData.length}`)
    console.log(`✨ Ready to serve API requests!\n`)
  })
}

// Export for Vercel
export default app
