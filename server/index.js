import express from "express"
import cors from "cors"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Enable CORS for all routes
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://anytrip-erp.vercel.app/", // Replace with your client URL
      /\.vercel\.app$/,
    ],
    credentials: true,
  }),
)

app.use(express.json())

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// In-memory storage for Vercel (since file system is read-only)
let sheetsData = [
  {
    id: 1,
    title: "Employee Database",
    url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    status: "pending",
    lastUpdated: "Just now",
    category: "HR",
    description: "Complete employee information and records",
  },
  {
    id: 2,
    title: "Project Timeline",
    url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    status: "active",
    lastUpdated: "1 day ago",
    category: "Project Management",
    description: "Project milestones and deadlines tracking",
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
  },
  {
    id: 2,
    title: "Update project timeline",
    description: "Add Q2 milestones and deadlines",
    completed: true,
    priority: "medium",
    dueDate: "2024-01-10",
    category: "Project Management",
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

// Update sheets
app.post("/api/update-sheets", (req, res) => {
  try {
    const { sheets } = req.body

    if (!sheets || !Array.isArray(sheets)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sheets data provided",
      })
    }

    sheetsData = sheets
    writeJsonFile("sheets.json", sheets)

    res.json({
      success: true,
      message: "Sheets updated successfully",
      count: sheets.length,
    })
  } catch (error) {
    console.error("Error in /api/update-sheets:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Update tasks
app.post("/api/update-tasks", (req, res) => {
  try {
    const { tasks } = req.body

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: "Invalid tasks data provided",
      })
    }

    tasksData = tasks
    writeJsonFile("tasks.json", tasks)

    res.json({
      success: true,
      message: "Tasks updated successfully",
      count: tasks.length,
    })
  } catch (error) {
    console.error("Error in /api/update-tasks:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
})

// Get current data
app.get("/api/sheets", (req, res) => {
  try {
    res.json(sheetsData)
  } catch (error) {
    console.error("Error reading sheets:", error)
    res.status(500).json({ error: "Failed to read sheets data" })
  }
})

app.get("/api/tasks", (req, res) => {
  try {
    res.json(tasksData)
  } catch (error) {
    console.error("Error reading tasks:", error)
    res.status(500).json({ error: "Failed to read tasks data" })
  }
})

// Verify data endpoint
app.get("/api/verify/:type", (req, res) => {
  try {
    const { type } = req.params
    const data = type === "sheets" ? sheetsData : tasksData

    res.json({
      success: true,
      filename: `${type}.json`,
      itemCount: data.length,
      lastModified: new Date().toISOString(),
      data: data,
    })
  } catch (error) {
    console.error("Error verifying data:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "AnyTrip Dashboard API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      sheets: "/api/sheets",
      tasks: "/api/tasks",
      updateSheets: "POST /api/update-sheets",
      updateTasks: "POST /api/update-tasks",
    },
  })
})

// Start server
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
    console.log("✨ Ready to serve API requests!")
  })
}

// Export for Vercel
export default app
