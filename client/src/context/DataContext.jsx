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
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://anytrip-dashboard-server.vercel.app/"

export const DataProvider = ({ children }) => {
  const [sheets, setSheets] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverConnected, setServerConnected] = useState(false)

  // Check if server is running
  const checkServerConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`)
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
            const sheetsResponse = await fetch(`${API_BASE_URL}/api/sheets`)
            const tasksResponse = await fetch(`${API_BASE_URL}/api/tasks`)

            if (sheetsResponse.ok) sheetsData = await sheetsResponse.json()
            if (tasksResponse.ok) tasksData = await tasksResponse.json()
          } catch (error) {
            console.log("Failed to load from server, trying local files...")
          }
        }

        // Fallback to default data if server data is empty
        if (sheetsData.length === 0) {
          sheetsData = [
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
        }

        if (tasksData.length === 0) {
          tasksData = [
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
        }

        // Ensure all items have pinned property
        sheetsData = sheetsData.map((sheet) => ({ ...sheet, pinned: sheet.pinned || false }))
        tasksData = tasksData.map((task) => ({ ...task, pinned: task.pinned || false }))

        setSheets(sheetsData)
        setTasks(tasksData)

        // Save to localStorage as backup
        localStorage.setItem("allSheets", JSON.stringify(sheetsData))
        localStorage.setItem("allTasks", JSON.stringify(tasksData))
      } catch (error) {
        console.error("Error loading data:", error)

        // Final fallback to localStorage
        const savedSheets = localStorage.getItem("allSheets")
        const savedTasks = localStorage.getItem("allTasks")

        if (savedSheets) setSheets(JSON.parse(savedSheets))
        if (savedTasks) setTasks(JSON.parse(savedTasks))
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
      id: Date.now(),
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

  return (
    <DataContext.Provider
      value={{
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
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
