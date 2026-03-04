import { useCallback, useState } from 'react'
import type { Task } from '../types'

interface UseTasksOptions {
  myId: string
  myName: string
  onAdd: (task: Task) => void
  onUpdate: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function useTasks(options: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([])

  const syncTasks = useCallback((incoming: Task[]) => {
    setTasks(incoming)
  }, [])

  const receiveAdd = useCallback((task: Task) => {
    setTasks((prev) => {
      if (prev.find((t) => t.id === task.id)) return prev
      return [...prev, task]
    })
  }, [])

  const receiveUpdate = useCallback((task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
  }, [])

  const receiveDelete = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  const addTask = useCallback(
    (text: string) => {
      const task: Task = {
        id: crypto.randomUUID(),
        text: text.trim(),
        completed: false,
        assignee: null,
        assigneeName: null,
        createdBy: options.myId,
        createdByName: options.myName,
        createdAt: Date.now()
      }
      setTasks((prev) => [...prev, task])
      options.onAdd(task)
      return task
    },
    [options]
  )

  const toggleTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId)
        if (!task) return prev
        const updated = { ...task, completed: !task.completed }
        options.onUpdate(updated)
        return prev.map((t) => (t.id === taskId ? updated : t))
      })
    },
    [options]
  )

  const assignTask = useCallback(
    (taskId: string, peerId: string | null, peerName: string | null) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId)
        if (!task) return prev
        const updated = { ...task, assignee: peerId, assigneeName: peerName }
        options.onUpdate(updated)
        return prev.map((t) => (t.id === taskId ? updated : t))
      })
    },
    [options]
  )

  const deleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      options.onDelete(taskId)
    },
    [options]
  )

  const editTask = useCallback(
    (taskId: string, text: string) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId)
        if (!task) return prev
        const updated = { ...task, text: text.trim() }
        options.onUpdate(updated)
        return prev.map((t) => (t.id === taskId ? updated : t))
      })
    },
    [options]
  )

  return {
    tasks,
    syncTasks,
    receiveAdd,
    receiveUpdate,
    receiveDelete,
    addTask,
    toggleTask,
    assignTask,
    deleteTask,
    editTask
  }
}
