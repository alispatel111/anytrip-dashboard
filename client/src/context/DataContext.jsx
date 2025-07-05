"use client"

import { createContext, useContext, useState, useEffect } from "react"

const DataContext = createContext(undefined)

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

export const useToast = () => {
  const showToast = (message, type = "info", duration = 3000) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message, type, duration },
        }),
      )
    }
  }
  return { showToast }
}

// Simple API configuration
const API_BASE_URL = "https://anytrip-dashboard-server.vercel.app"

export const DataProvider = ({ children }) => {
  const [sheets, setSheets] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverConnected, setServerConnected] = useState(false)

  // Debug logging function
  const debugLog = (message, data = null) => {
    console.log(`🔍 [DataContext] ${message}`, data || "")
  }

  // Safe localStorage operations
  const safeLocalStorage = {
    getItem: (key) => {
      try {
        if (typeof window !== "undefined") {
          const item = localStorage.getItem(key)
          debugLog(`📦 Retrieved from localStorage [${key}]:`, item ? "Found" : "Not found")
          return item
        }
        return null
      } catch (error) {
        debugLog(`❌ Error reading localStorage [${key}]:`, error.message)
        return null
      }
    },
    setItem: (key, value) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, value)
          debugLog(`💾 Saved to localStorage [${key}]:`, "Success")
        }
      } catch (error) {
        debugLog(`❌ Error writing localStorage [${key}]:`, error.message)
      }
    },
  }

  // Default data
  const getDefaultSheets = () => [
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

  const getDefaultTasks = () => [
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

  // API functions with detailed logging
  const apiCall = async (endpoint, options = {}) => {
    try {
      debugLog(`📡 API Call: ${endpoint}`, options.method || "GET")

      const url = `${API_BASE_URL}${endpoint}`
      const defaultOptions = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
      }

      const response = await fetch(url, { ...defaultOptions, ...options })

      debugLog(`📡 API Response [${endpoint}]:`, {
        status: response.status,
        ok: response.ok,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      debugLog(`📡 API Data [${endpoint}]:`, data)
      return data
    } catch (error) {
      debugLog(`❌ API Error [${endpoint}]:`, error.message)
      throw error
    }
  }

  // Check server health
  const checkServerHealth = async () => {
    try {
      debugLog("🏥 Checking server health...")
      const health = await apiCall("/api/health")
      setServerConnected(true)
      debugLog("✅ Server is healthy:", health)
      return true
    } catch (error) {
      setServerConnected(false)
      debugLog("❌ Server health check failed:", error.message)
      return false
    }
  }

  // Load data from server
  const loadFromServer = async () => {
    try {
      debugLog("📥 Loading data from server...")

      const [sheetsResult, tasksResult] = await Promise.allSettled([apiCall("/api/sheets"), apiCall("/api/tasks")])

      let serverSheets = []
      let serverTasks = []

      if (sheetsResult.status === "fulfilled") {
        serverSheets = Array.isArray(sheetsResult.value) ? sheetsResult.value : []
        debugLog("✅ Sheets loaded from server:", serverSheets.length)
      } else {
        debugLog("❌ Failed to load sheets from server:", sheetsResult.reason?.message)
      }

      if (tasksResult.status === "fulfilled") {
        serverTasks = Array.isArray(tasksResult.value) ? tasksResult.value : []
        debugLog("✅ Tasks loaded from server:", serverTasks.length)
      } else {
        debugLog("❌ Failed to load tasks from server:", tasksResult.reason?.message)
      }

      return { sheets: serverSheets, tasks: serverTasks }
    } catch (error) {
      debugLog("❌ Error loading from server:", error.message)
      return { sheets: [], tasks: [] }
    }
  }

  // Save data to server
  const saveToServer = async (type, data) => {
    try {
      if (!serverConnected) {
        debugLog(`⚠️ Server not connected, skipping ${type} save`)
        return false
      }

      debugLog(`💾 Saving ${type} to server:`, data.length)

      const endpoint = type === "sheets" ? "/api/update-sheets" : "/api/update-tasks"
      const payload = type === "sheets" ? { sheets: data } : { tasks: data }

      const result = await apiCall(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      debugLog(`✅ ${type} saved to server:`, result)
      return true
    } catch (error) {
      debugLog(`❌ Error saving ${type} to server:`, error.message)
      return false
    }
  }

  // Load data from localStorage
  const loadFromLocalStorage = () => {
    debugLog("📦 Loading data from localStorage...")

    let localSheets = []
    let localTasks = []

    try {
      const savedSheets = safeLocalStorage.getItem("dashboard_sheets")
      if (savedSheets) {
        localSheets = JSON.parse(savedSheets)
        debugLog("✅ Sheets loaded from localStorage:", localSheets.length)
      }
    } catch (error) {
      debugLog("❌ Error parsing sheets from localStorage:", error.message)
    }

    try {
      const savedTasks = safeLocalStorage.getItem("dashboard_tasks")
      if (savedTasks) {
        localTasks = JSON.parse(savedTasks)
        debugLog("✅ Tasks loaded from localStorage:", localTasks.length)
      }
    } catch (error) {
      debugLog("❌ Error parsing tasks from localStorage:", error.message)
    }

    return { sheets: localSheets, tasks: localTasks }
  }

  // Save data to localStorage
  const saveToLocalStorage = (type, data) => {
    try {
      const key = type === "sheets" ? "dashboard_sheets" : "dashboard_tasks"
      safeLocalStorage.setItem(key, JSON.stringify(data))
      debugLog(`💾 ${type} saved to localStorage:`, data.length)
    } catch (error) {
      debugLog(`❌ Error saving ${type} to localStorage:`, error.message)
    }
  }

  // Main data loading function
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        debugLog("🚀 Starting data load process...")

        // Step 1: Check server health
        const isServerHealthy = await checkServerHealth()

        // Step 2: Try to load from server if healthy
        let finalSheets = []
        let finalTasks = []

        if (isServerHealthy) {
          const serverData = await loadFromServer()
          finalSheets = serverData.sheets
          finalTasks = serverData.tasks
        }

        // Step 3: Fallback to localStorage if server data is empty
        if (finalSheets.length === 0 || finalTasks.length === 0) {
          debugLog("📦 Falling back to localStorage...")
          const localData = loadFromLocalStorage()

          if (finalSheets.length === 0) {
            finalSheets = localData.sheets
          }
          if (finalTasks.length === 0) {
            finalTasks = localData.tasks
          }
        }

        // Step 4: Use default data if still empty
        if (finalSheets.length === 0) {
          debugLog("🔧 Using default sheets data")
          finalSheets = getDefaultSheets()
        }
        if (finalTasks.length === 0) {
          debugLog("🔧 Using default tasks data")
          finalTasks = getDefaultTasks()
        }

        // Step 5: Ensure data integrity
        finalSheets = finalSheets.map((sheet) => ({
          ...sheet,
          id: sheet.id || Date.now() + Math.random(),
          pinned: Boolean(sheet.pinned),
        }))

        finalTasks = finalTasks.map((task) => ({
          ...task,
          id: task.id || Date.now() + Math.random(),
          pinned: Boolean(task.pinned),
        }))

        // Step 6: Set the data
        setSheets(finalSheets)
        setTasks(finalTasks)

        // Step 7: Save to localStorage as backup
        saveToLocalStorage("sheets", finalSheets)
        saveToLocalStorage("tasks", finalTasks)

        // Step 8: Sync to server if connected and data came from localStorage/default
        if (isServerHealthy && (finalSheets.length > 0 || finalTasks.length > 0)) {
          debugLog("🔄 Syncing data to server...")
          await saveToServer("sheets", finalSheets)
          await saveToServer("tasks", finalTasks)
        }

        debugLog("✅ Data load complete:", {
          sheets: finalSheets.length,
          tasks: finalTasks.length,
          serverConnected: isServerHealthy,
        })
      } catch (error) {
        debugLog("❌ Critical error in data loading:", error.message)

        // Emergency fallback
        const emergency = loadFromLocalStorage()
        setSheets(emergency.sheets.length > 0 ? emergency.sheets : getDefaultSheets())
        setTasks(emergency.tasks.length > 0 ? emergency.tasks : getDefaultTasks())
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Update functions with proper sync
  const updateData = async (type, newData) => {
    debugLog(`🔄 Updating ${type}:`, newData.length)

    // Update state immediately
    if (type === "sheets") {
      setSheets(newData)
    } else {
      setTasks(newData)
    }

    // Save to localStorage immediately
    saveToLocalStorage(type, newData)

    // Try to sync to server
    if (serverConnected) {
      const synced = await saveToServer(type, newData)
      if (synced) {
        debugLog(`✅ ${type} synced to server successfully`)
      } else {
        debugLog(`⚠️ ${type} sync to server failed, saved locally only`)
      }
    } else {
      debugLog(`⚠️ Server not connected, ${type} saved locally only`)
    }
  }

  // CRUD operations
  const addSheet = async (sheetData) => {
    const newSheet = {
      id: Date.now() + Math.random(),
      pinned: false,
      lastUpdated: "Just now",
      ...sheetData,
    }
    const updatedSheets = [...sheets, newSheet]
    await updateData("sheets", updatedSheets)
  }

  const removeSheet = async (id) => {
    const updatedSheets = sheets.filter((sheet) => sheet.id !== id)
    await updateData("sheets", updatedSheets)
  }

  const updateSheet = async (id, updates) => {
    const updatedSheets = sheets.map((sheet) =>
      sheet.id === id ? { ...sheet, ...updates, lastUpdated: "Just now" } : sheet,
    )
    await updateData("sheets", updatedSheets)
  }

  const toggleSheetPin = async (id) => {
    const updatedSheets = sheets.map((sheet) => (sheet.id === id ? { ...sheet, pinned: !sheet.pinned } : sheet))
    await updateData("sheets", updatedSheets)
  }

  const addTask = async (taskData) => {
    const newTask = {
      id: Date.now() + Math.random(),
      pinned: false,
      ...taskData,
    }
    const updatedTasks = [...tasks, newTask]
    await updateData("tasks", updatedTasks)
  }

  const toggleTask = async (id) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    await updateData("tasks", updatedTasks)
  }

  const removeTask = async (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id)
    await updateData("tasks", updatedTasks)
  }

  const updateTask = async (id, updates) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, ...updates, completed: updates.status === "completed" } : task,
    )
    await updateData("tasks", updatedTasks)
  }

  const toggleTaskPin = async (id) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, pinned: !task.pinned } : task))
    await updateData("tasks", updatedTasks)
  }

  // Helper function to sort items with pinned items first
  const sortWithPinned = (items) => {
    return [...items].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })
  }

  const contextValue = {
    sheets: sortWithPinned(sheets),
    tasks: sortWithPinned(tasks),
    loading,
    serverConnected,
    addSheet,
    removeSheet,
    updateSheet,
    toggleSheetPin,
    addTask,
    toggleTask,
    removeTask,
    updateTask,
    toggleTaskPin,
  }

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
}
