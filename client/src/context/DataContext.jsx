"use client"

import { createContext, useContext, useState, useEffect } from "react"

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

export const useToast = () => {
  const showToast = (message, type = "info", duration = 3000) => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message, type, duration },
      }),
    )
  }

  return { showToast }
}

// API Base URL - automatically detects environment
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

export const DataProvider = ({ children }) => {
  const [sheets, setSheets] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverConnected, setServerConnected] = useState(false)

  // Add fallback data at the top of DataProvider
  const fallbackSheets = [
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

  const fallbackTasks = [
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

  // Helper function to get clean API URL
  const getApiUrl = (endpoint) => {
    const baseUrl = API_BASE_URL.replace(/\/$/, "") // Remove trailing slash
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    return `${baseUrl}${cleanEndpoint}`
  }

  // Check if server is running
  const checkServerConnection = async () => {
    try {
      console.log("🔍 Checking server connection...")
      console.log("API_BASE_URL:", API_BASE_URL)

      const healthUrl = getApiUrl("/api/health")
      console.log("Health check URL:", healthUrl)

      const response = await fetch(healthUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Health check response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Health check response:", data)
        setServerConnected(true)
        console.log("✅ Connected to server")
        return true
      } else {
        console.log("❌ Server health check failed:", response.status)
        setServerConnected(false)
        return false
      }
    } catch (error) {
      console.log("⚠️ Server not available:", error.message)
      setServerConnected(false)
      return false
    }
  }

  // Load data from JSON files
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Check server connection first
        const isServerConnected = await checkServerConnection()

        let sheetsData = []
        let tasksData = []

        if (isServerConnected) {
          // Load from server API
          try {
            console.log("📡 Loading data from server...")

            const sheetsUrl = getApiUrl("/api/sheets")
            const tasksUrl = getApiUrl("/api/tasks")

            console.log("Sheets URL:", sheetsUrl)
            console.log("Tasks URL:", tasksUrl)

            const [sheetsResponse, tasksResponse] = await Promise.all([fetch(sheetsUrl), fetch(tasksUrl)])

            console.log("Sheets response status:", sheetsResponse.status)
            console.log("Tasks response status:", tasksResponse.status)

            if (sheetsResponse.ok) {
              sheetsData = await sheetsResponse.json()
              console.log("✅ Sheets loaded from server:", sheetsData.length)
            }

            if (tasksResponse.ok) {
              tasksData = await tasksResponse.json()
              console.log("✅ Tasks loaded from server:", tasksData.length)
            }
          } catch (error) {
            console.log("❌ Failed to load from server:", error.message)
          }
        }

        // Fallback to local JSON files if server data is empty
        if (sheetsData.length === 0) {
          try {
            const sheetsResponse = await fetch("/data/sheets.json?" + Date.now())
            if (sheetsResponse.ok) {
              sheetsData = await sheetsResponse.json()
              console.log("✅ Sheets loaded from local file:", sheetsData.length)
            }
          } catch (error) {
            console.log("❌ Failed to load local sheets.json:", error.message)
          }
        }

        if (tasksData.length === 0) {
          try {
            const tasksResponse = await fetch("/data/tasks.json?" + Date.now())
            if (tasksResponse.ok) {
              tasksData = await tasksResponse.json()
              console.log("✅ Tasks loaded from local file:", tasksData.length)
            }
          } catch (error) {
            console.log("❌ Failed to load local tasks.json:", error.message)
          }
        }

        // Use fallback data if nothing loaded
        if (sheetsData.length === 0) {
          sheetsData = fallbackSheets
          console.log("📋 Using fallback sheets data")
        }

        if (tasksData.length === 0) {
          tasksData = fallbackTasks
          console.log("📋 Using fallback tasks data")
        }

        setSheets(sheetsData)
        setTasks(tasksData)

        // Save to localStorage as backup
        localStorage.setItem("allSheets", JSON.stringify(sheetsData))
        localStorage.setItem("allTasks", JSON.stringify(tasksData))

        console.log("🎉 Data loading completed!")
      } catch (error) {
        console.error("❌ Error loading data:", error)

        // Final fallback to localStorage or default data
        const savedSheets = localStorage.getItem("allSheets")
        const savedTasks = localStorage.getItem("allTasks")

        if (savedSheets) {
          setSheets(JSON.parse(savedSheets))
          console.log("📦 Loaded sheets from localStorage")
        } else {
          setSheets(fallbackSheets)
          localStorage.setItem("allSheets", JSON.stringify(fallbackSheets))
          console.log("📋 Using default sheets data")
        }

        if (savedTasks) {
          setTasks(JSON.parse(savedTasks))
          console.log("📦 Loaded tasks from localStorage")
        } else {
          setTasks(fallbackTasks)
          localStorage.setItem("allTasks", JSON.stringify(fallbackTasks))
          console.log("📋 Using default tasks data")
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Function to update JSON files automatically
  const updateJsonFiles = async (type, data) => {
    try {
      if (!serverConnected) {
        console.log(`⚠️ Server not connected, ${type} saved to localStorage only`)
        return false
      }

      const endpoint = type === "sheets" ? "/api/update-sheets" : "/api/update-tasks"
      const payload = type === "sheets" ? { sheets: data } : { tasks: data }
      const updateUrl = getApiUrl(endpoint)

      console.log(`🔄 Updating ${type}...`)
      console.log("Update URL:", updateUrl)
      console.log("Payload:", payload)

      const response = await fetch(updateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log(`Update ${type} response status:`, response.status)

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ ${type} updated successfully:`, result)
        return true
      } else {
        const errorText = await response.text()
        console.error(`❌ Server error (${response.status}):`, errorText)
        throw new Error(`Server responded with status: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error(`❌ Error updating ${type}:`, error.message)
      console.error("Full error:", error)
      return false
    }
  }

  // Update sheets and automatically save to JSON
  const updateSheetsData = async (newSheets) => {
    console.log("📝 Updating sheets data:", newSheets.length)
    setSheets(newSheets)
    localStorage.setItem("allSheets", JSON.stringify(newSheets))
    await updateJsonFiles("sheets", newSheets)
  }

  // Update tasks and automatically save to JSON
  const updateTasksData = async (newTasks) => {
    console.log("📝 Updating tasks data:", newTasks.length)
    setTasks(newTasks)
    localStorage.setItem("allTasks", JSON.stringify(newTasks))
    await updateJsonFiles("tasks", newTasks)
  }

  const addSheet = async (sheetData) => {
    console.log("➕ Adding new sheet:", sheetData)
    const newSheet = {
      id: Date.now(),
      ...sheetData,
    }
    const updatedSheets = [...sheets, newSheet]
    await updateSheetsData(updatedSheets)
  }

  const removeSheet = async (id) => {
    console.log("🗑️ Removing sheet:", id)
    const updatedSheets = sheets.filter((sheet) => sheet.id !== id)
    await updateSheetsData(updatedSheets)
  }

  const updateSheet = async (id, updates) => {
    console.log("✏️ Updating sheet:", id, updates)
    const updatedSheets = sheets.map((sheet) =>
      sheet.id === id ? { ...sheet, ...updates, lastUpdated: "Just now" } : sheet,
    )
    await updateSheetsData(updatedSheets)
  }

  const addTask = async (taskData) => {
    console.log("➕ Adding new task:", taskData)
    const newTask = {
      id: Date.now(),
      ...taskData,
    }
    const updatedTasks = [...tasks, newTask]
    await updateTasksData(updatedTasks)
  }

  const toggleTask = async (id) => {
    console.log("🔄 Toggling task:", id)
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    await updateTasksData(updatedTasks)
  }

  const removeTask = async (id) => {
    console.log("🗑️ Removing task:", id)
    const updatedTasks = tasks.filter((task) => task.id !== id)
    await updateTasksData(updatedTasks)
  }

  const updateTask = async (id, updates) => {
    console.log("✏️ Updating task:", id, updates)
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, ...updates, completed: updates.status === "completed" } : task,
    )
    await updateTasksData(updatedTasks)
  }

  return (
    <DataContext.Provider
      value={{
        sheets,
        tasks,
        loading,
        serverConnected,
        addSheet,
        removeSheet,
        updateSheet,
        addTask,
        toggleTask,
        removeTask,
        updateTask,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
