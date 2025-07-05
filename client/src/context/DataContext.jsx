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

// API Base URL - improved configuration
const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "https://anytrip-dashboard-server.vercel.app"
  }
  return process.env.VITE_API_URL || "https://anytrip-dashboard-server.vercel.app"
}

export const DataProvider = ({ children }) => {
  const [sheets, setSheets] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverConnected, setServerConnected] = useState(false)

  // Improved server connection check
  const checkServerConnection = async () => {
    try {
      const API_BASE_URL = getApiBaseUrl()
      console.log(`🔍 Checking server connection: ${API_BASE_URL}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setServerConnected(true)
        console.log("✅ Server connected:", data)
        return true
      } else {
        throw new Error(`Server responded with status: ${response.status}`)
      }
    } catch (error) {
      console.log("⚠️ Server connection failed:", error.message)
      setServerConnected(false)
      return false
    }
  }

  // Safe localStorage operations
  const safeLocalStorage = {
    getItem: (key) => {
      try {
        if (typeof window !== "undefined") {
          return localStorage.getItem(key)
        }
        return null
      } catch (error) {
        console.error("Error reading from localStorage:", error)
        return null
      }
    },
    setItem: (key, value) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, value)
        }
      } catch (error) {
        console.error("Error writing to localStorage:", error)
      }
    },
  }

  // Improved data loading with better error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        console.log("📡 Starting data load...")

        // Check server connection
        const isServerConnected = await checkServerConnection()

        let sheetsData = []
        let tasksData = []

        if (isServerConnected) {
          try {
            const API_BASE_URL = getApiBaseUrl()
            console.log(`📡 Fetching data from server: ${API_BASE_URL}`)

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            const fetchOptions = {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              mode: "cors",
              credentials: "omit",
              signal: controller.signal,
            }

            // Fetch both sheets and tasks
            const [sheetsResponse, tasksResponse] = await Promise.allSettled([
              fetch(`${API_BASE_URL}/api/sheets`, fetchOptions),
              fetch(`${API_BASE_URL}/api/tasks`, fetchOptions),
            ])

            clearTimeout(timeoutId)

            // Process sheets response
            if (sheetsResponse.status === "fulfilled" && sheetsResponse.value.ok) {
              const sheetsResult = await sheetsResponse.value.json()
              if (Array.isArray(sheetsResult) && sheetsResult.length > 0) {
                sheetsData = sheetsResult
                console.log("✅ Sheets loaded from server:", sheetsData.length)
              }
            }

            // Process tasks response
            if (tasksResponse.status === "fulfilled" && tasksResponse.value.ok) {
              const tasksResult = await tasksResponse.value.json()
              if (Array.isArray(tasksResult) && tasksResult.length > 0) {
                tasksData = tasksResult
                console.log("✅ Tasks loaded from server:", tasksData.length)
              }
            }
          } catch (error) {
            console.log("❌ Server fetch failed:", error.message)
          }
        }

        // Fallback to localStorage if server data is empty
        if (sheetsData.length === 0) {
          const savedSheets = safeLocalStorage.getItem("allSheets")
          if (savedSheets) {
            try {
              const parsedSheets = JSON.parse(savedSheets)
              if (Array.isArray(parsedSheets) && parsedSheets.length > 0) {
                sheetsData = parsedSheets
                console.log("📦 Loaded sheets from localStorage:", sheetsData.length)
              }
            } catch (error) {
              console.error("Error parsing saved sheets:", error)
            }
          }
        }

        if (tasksData.length === 0) {
          const savedTasks = safeLocalStorage.getItem("allTasks")
          if (savedTasks) {
            try {
              const parsedTasks = JSON.parse(savedTasks)
              if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
                tasksData = parsedTasks
                console.log("📦 Loaded tasks from localStorage:", tasksData.length)
              }
            } catch (error) {
              console.error("Error parsing saved tasks:", error)
            }
          }
        }

        // Use default data if nothing is found
        if (sheetsData.length === 0) {
          sheetsData = getDefaultSheets()
          console.log("🔧 Using default sheets data")
        }

        if (tasksData.length === 0) {
          tasksData = getDefaultTasks()
          console.log("🔧 Using default tasks data")
        }

        // Ensure all items have required properties
        sheetsData = sheetsData.map((sheet) => ({
          ...sheet,
          pinned: sheet.pinned || false,
          id: sheet.id || Date.now() + Math.random(),
        }))

        tasksData = tasksData.map((task) => ({
          ...task,
          pinned: task.pinned || false,
          id: task.id || Date.now() + Math.random(),
        }))

        // Set the data
        setSheets(sheetsData)
        setTasks(tasksData)

        // Save to localStorage as backup
        safeLocalStorage.setItem("allSheets", JSON.stringify(sheetsData))
        safeLocalStorage.setItem("allTasks", JSON.stringify(tasksData))

        // If server is connected, sync the data to server
        if (isServerConnected) {
          await syncToServer("sheets", sheetsData)
          await syncToServer("tasks", tasksData)
        }

        console.log(`📊 Data loaded successfully - Sheets: ${sheetsData.length}, Tasks: ${tasksData.length}`)
      } catch (error) {
        console.error("❌ Error loading data:", error)

        // Final fallback
        setSheets(getDefaultSheets())
        setTasks(getDefaultTasks())
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Default data functions
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

  // Improved server sync function
  const syncToServer = async (type, data) => {
    try {
      if (!serverConnected) {
        console.log(`⚠️ Server not connected, skipping ${type} sync`)
        return false
      }

      const API_BASE_URL = getApiBaseUrl()
      const endpoint = type === "sheets" ? "/api/update-sheets" : "/api/update-tasks"
      const payload = type === "sheets" ? { sheets: data } : { tasks: data }

      console.log(`🔄 Syncing ${type} to server...`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ ${type} synced successfully:`, result)
        return true
      } else {
        throw new Error(`Server responded with status: ${response.status}`)
      }
    } catch (error) {
      console.error(`❌ Error syncing ${type}:`, error.message)
      return false
    }
  }

  // Update functions with improved error handling
  const updateSheetsData = async (newSheets) => {
    setSheets(newSheets)
    safeLocalStorage.setItem("allSheets", JSON.stringify(newSheets))

    // Try to sync to server
    if (serverConnected) {
      const synced = await syncToServer("sheets", newSheets)
      if (!synced) {
        console.log("⚠️ Failed to sync sheets to server, data saved locally")
      }
    }
  }

  const updateTasksData = async (newTasks) => {
    setTasks(newTasks)
    safeLocalStorage.setItem("allTasks", JSON.stringify(newTasks))

    // Try to sync to server
    if (serverConnected) {
      const synced = await syncToServer("tasks", newTasks)
      if (!synced) {
        console.log("⚠️ Failed to sync tasks to server, data saved locally")
      }
    }
  }

  const addSheet = async (sheetData) => {
    const newSheet = {
      id: Date.now() + Math.random(),
      pinned: false,
      ...sheetData,
    }
    const updatedSheets = [...sheets, newSheet]
    await updateSheetsData(updatedSheets)
  }

  const removeSheet = async (id) => {
    const updatedSheets = sheets.filter((sheet) => sheet.id !== id)
    await updateSheetsData(updatedSheets)
  }

  const updateSheet = async (id, updates) => {
    const updatedSheets = sheets.map((sheet) =>
      sheet.id === id ? { ...sheet, ...updates, lastUpdated: "Just now" } : sheet,
    )
    await updateSheetsData(updatedSheets)
  }

  const toggleSheetPin = async (id) => {
    const updatedSheets = sheets.map((sheet) => (sheet.id === id ? { ...sheet, pinned: !sheet.pinned } : sheet))
    await updateSheetsData(updatedSheets)
  }

  const addTask = async (taskData) => {
    const newTask = {
      id: Date.now() + Math.random(),
      pinned: false,
      ...taskData,
    }
    const updatedTasks = [...tasks, newTask]
    await updateTasksData(updatedTasks)
  }

  const toggleTask = async (id) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    await updateTasksData(updatedTasks)
  }

  const removeTask = async (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id)
    await updateTasksData(updatedTasks)
  }

  const updateTask = async (id, updates) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, ...updates, completed: updates.status === "completed" } : task,
    )
    await updateTasksData(updatedTasks)
  }

  const toggleTaskPin = async (id) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, pinned: !task.pinned } : task))
    await updateTasksData(updatedTasks)
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
