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

// API Base URL - fixed for your deployment
const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || "https://anytrip-dashboard-server.vercel.app"
  }
  // Client-side - remove double slash issue
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://anytrip-dashboard-server.vercel.app"
  return baseUrl.replace(/\/+$/, "") // Remove trailing slashes
}

export const DataProvider = ({ children }) => {
  const [sheets, setSheets] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverConnected, setServerConnected] = useState(false)

  // Check if server is running with CORS handling
  const checkServerConnection = async () => {
    try {
      const API_BASE_URL = getApiBaseUrl()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      console.log(`🔍 Checking server connection: ${API_BASE_URL}/api/health`)

      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors", // Explicitly set CORS mode
        credentials: "omit", // Don't send credentials for CORS
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setServerConnected(true)
        console.log("✅ Connected to server:", data)
        return true
      } else {
        throw new Error(`Server responded with status: ${response.status}`)
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("⚠️ Server connection timeout, using localStorage fallback")
      } else if (error.message.includes("CORS")) {
        console.log("⚠️ CORS error - server needs CORS configuration, using localStorage fallback")
      } else {
        console.log("⚠️ Server not available, using localStorage fallback:", error.message)
      }
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

  // Load data with improved error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Check server connection first
        const isServerConnected = await checkServerConnection()

        let sheetsData = []
        let tasksData = []

        if (isServerConnected) {
          // Load from server API with proper CORS handling
          try {
            const API_BASE_URL = getApiBaseUrl()
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

            console.log(`📡 Fetching data from: ${API_BASE_URL}`)

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

            const [sheetsResponse, tasksResponse] = await Promise.allSettled([
              fetch(`${API_BASE_URL}/api/sheets`, fetchOptions),
              fetch(`${API_BASE_URL}/api/tasks`, fetchOptions),
            ])

            clearTimeout(timeoutId)

            if (sheetsResponse.status === "fulfilled" && sheetsResponse.value.ok) {
              sheetsData = await sheetsResponse.value.json()
              console.log("✅ Sheets data loaded from server")
            } else {
              console.log("⚠️ Failed to load sheets from server")
            }

            if (tasksResponse.status === "fulfilled" && tasksResponse.value.ok) {
              tasksData = await tasksResponse.value.json()
              console.log("✅ Tasks data loaded from server")
            } else {
              console.log("⚠️ Failed to load tasks from server")
            }
          } catch (error) {
            console.log("Failed to load from server, trying local storage...", error)
          }
        }

        // Fallback to localStorage or default data
        if (sheetsData.length === 0) {
          const savedSheets = safeLocalStorage.getItem("allSheets")
          if (savedSheets) {
            try {
              sheetsData = JSON.parse(savedSheets)
              console.log("📦 Loaded sheets from localStorage")
            } catch (error) {
              console.error("Error parsing saved sheets:", error)
              sheetsData = getDefaultSheets()
            }
          } else {
            sheetsData = getDefaultSheets()
            console.log("🔧 Using default sheets data")
          }
        }

        if (tasksData.length === 0) {
          const savedTasks = safeLocalStorage.getItem("allTasks")
          if (savedTasks) {
            try {
              tasksData = JSON.parse(savedTasks)
              console.log("📦 Loaded tasks from localStorage")
            } catch (error) {
              console.error("Error parsing saved tasks:", error)
              tasksData = getDefaultTasks()
            }
          } else {
            tasksData = getDefaultTasks()
            console.log("🔧 Using default tasks data")
          }
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

        setSheets(sheetsData)
        setTasks(tasksData)

        // Save to localStorage as backup
        safeLocalStorage.setItem("allSheets", JSON.stringify(sheetsData))
        safeLocalStorage.setItem("allTasks", JSON.stringify(tasksData))

        console.log(`📊 Final data loaded - Sheets: ${sheetsData.length}, Tasks: ${tasksData.length}`)
      } catch (error) {
        console.error("Error loading data:", error)

        // Final fallback to localStorage
        const savedSheets = safeLocalStorage.getItem("allSheets")
        const savedTasks = safeLocalStorage.getItem("allTasks")

        if (savedSheets) {
          try {
            setSheets(JSON.parse(savedSheets))
          } catch (error) {
            setSheets(getDefaultSheets())
          }
        } else {
          setSheets(getDefaultSheets())
        }

        if (savedTasks) {
          try {
            setTasks(JSON.parse(savedTasks))
          } catch (error) {
            setTasks(getDefaultTasks())
          }
        } else {
          setTasks(getDefaultTasks())
        }
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

  // Function to update server data with CORS handling
  const updateServerData = async (type, data) => {
    try {
      if (serverConnected) {
        const API_BASE_URL = getApiBaseUrl()
        const endpoint = type === "sheets" ? "/api/update-sheets" : "/api/update-tasks"
        const payload = type === "sheets" ? { sheets: data } : { tasks: data }

        console.log(`🔄 Updating ${type} on server...`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

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
          console.log(`✅ ${type} updated successfully on server:`, result)
          return true
        } else {
          throw new Error(`Server responded with status: ${response.status}`)
        }
      } else {
        console.log(`⚠️ Server not connected, ${type} saved to localStorage only`)
        return false
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error(`❌ Timeout updating ${type}:`, error)
      } else {
        console.error(`❌ Error updating ${type} on server:`, error)
      }
      return false
    }
  }

  // Update sheets and automatically save
  const updateSheetsData = async (newSheets) => {
    setSheets(newSheets)
    safeLocalStorage.setItem("allSheets", JSON.stringify(newSheets))
    await updateServerData("sheets", newSheets)
  }

  // Update tasks and automatically save
  const updateTasksData = async (newTasks) => {
    setTasks(newTasks)
    safeLocalStorage.setItem("allTasks", JSON.stringify(newTasks))
    await updateServerData("tasks", newTasks)
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
