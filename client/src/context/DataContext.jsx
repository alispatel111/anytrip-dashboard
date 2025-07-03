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

  // Check if server is running
  const checkServerConnection = async () => {
    try {
      // Remove any trailing slash and ensure proper URL formation
      const baseUrl = API_BASE_URL.replace(/\/$/, "")
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) {
        setServerConnected(true)
        console.log("✅ Connected to server")
        return true
      }
    } catch (error) {
      console.log("⚠️ Server not available, using localStorage fallback")
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
            const baseUrl = API_BASE_URL.replace(/\/$/, "")
            const sheetsResponse = await fetch(`${baseUrl}/api/sheets`)
            const tasksResponse = await fetch(`${baseUrl}/api/tasks`)

            if (sheetsResponse.ok) sheetsData = await sheetsResponse.json()
            if (tasksResponse.ok) tasksData = await tasksResponse.json()
          } catch (error) {
            console.log("Failed to load from server, trying local files...")
          }
        }

        // Fallback to local JSON files if server data is empty
        if (sheetsData.length === 0) {
          try {
            const sheetsResponse = await fetch("/data/sheets.json?" + Date.now())
            sheetsData = await sheetsResponse.json()
          } catch (error) {
            console.log("Failed to load local sheets.json")
          }
        }

        if (tasksData.length === 0) {
          try {
            const tasksResponse = await fetch("/data/tasks.json?" + Date.now())
            tasksData = await tasksResponse.json()
          } catch (error) {
            console.log("Failed to load local tasks.json")
          }
        }

        setSheets(sheetsData)
        setTasks(tasksData)

        // Save to localStorage as backup
        localStorage.setItem("allSheets", JSON.stringify(sheetsData))
        localStorage.setItem("allTasks", JSON.stringify(tasksData))
      } catch (error) {
        console.error("Error loading data:", error)

        // Final fallback to localStorage or default data
        const savedSheets = localStorage.getItem("allSheets")
        const savedTasks = localStorage.getItem("allTasks")

        if (savedSheets) {
          setSheets(JSON.parse(savedSheets))
        } else {
          setSheets(fallbackSheets)
          localStorage.setItem("allSheets", JSON.stringify(fallbackSheets))
        }

        if (savedTasks) {
          setTasks(JSON.parse(savedTasks))
        } else {
          setTasks(fallbackTasks)
          localStorage.setItem("allTasks", JSON.stringify(fallbackTasks))
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
      if (serverConnected) {
        const endpoint = type === "sheets" ? "/api/update-sheets" : "/api/update-tasks"
        const payload = type === "sheets" ? { sheets: data } : { tasks: data }

        console.log(`🔄 Updating ${type} JSON file...`)

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`✅ ${type} JSON file updated successfully:`, result)
          return true
        } else {
          throw new Error(`Server responded with status: ${response.status}`)
        }
      } else {
        console.log(`⚠️ Server not connected, ${type} saved to localStorage only`)
        return false
      }
    } catch (error) {
      console.error(`❌ Error updating ${type}:`, error)
      return false
    }
  }

  // Update sheets and automatically save to JSON
  const updateSheetsData = async (newSheets) => {
    setSheets(newSheets)
    localStorage.setItem("allSheets", JSON.stringify(newSheets))
    await updateJsonFiles("sheets", newSheets)
  }

  // Update tasks and automatically save to JSON
  const updateTasksData = async (newTasks) => {
    setTasks(newTasks)
    localStorage.setItem("allTasks", JSON.stringify(newTasks))
    await updateJsonFiles("tasks", newTasks)
  }

  const addSheet = async (sheetData) => {
    const newSheet = {
      id: Date.now(),
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

  const addTask = async (taskData) => {
    const newTask = {
      id: Date.now(),
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
