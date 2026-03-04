import { useState, useCallback, useRef } from 'react'
import { JoinScreen } from './components/JoinScreen'
import { VideoGrid } from './components/VideoGrid'
import { TaskList } from './components/TaskList'
import { Controls } from './components/Controls'
import { useWebRTC } from './hooks/useWebRTC'
import { useTasks } from './hooks/useTasks'
import type { Task } from './types'

export default function App() {
  const [inCall, setInCall] = useState(false)
  const [taskPanelOpen, setTaskPanelOpen] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)

  // Task callbacks that get forwarded from DataChannel messages
  const onTasksSync = useCallback((tasks: Task[]) => {
    taskCallbacks.current?.syncTasks(tasks)
  }, [])
  const onTaskAdd = useCallback((task: Task) => {
    taskCallbacks.current?.receiveAdd(task)
  }, [])
  const onTaskUpdate = useCallback((task: Task) => {
    taskCallbacks.current?.receiveUpdate(task)
  }, [])
  const onTaskDelete = useCallback((taskId: string) => {
    taskCallbacks.current?.receiveDelete(taskId)
  }, [])

  const {
    peers,
    localStream,
    myId,
    myName,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    broadcastTaskAdd,
    broadcastTaskUpdate,
    broadcastTaskDelete,
    tasksRef
  } = useWebRTC({
    onTasksSync,
    onTaskAdd,
    onTaskUpdate,
    onTaskDelete
  })

  const {
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
  } = useTasks({
    myId,
    myName,
    onAdd: (task) => {
      tasksRef.current = [...tasksRef.current, task]
      broadcastTaskAdd(task)
    },
    onUpdate: (task) => {
      tasksRef.current = tasksRef.current.map((t) => (t.id === task.id ? task : t))
      broadcastTaskUpdate(task)
    },
    onDelete: (taskId) => {
      tasksRef.current = tasksRef.current.filter((t) => t.id !== taskId)
      broadcastTaskDelete(taskId)
    }
  })

  // Store task callbacks in a ref so WebRTC hook can call them
  const taskCallbacks = useRef({ syncTasks, receiveAdd, receiveUpdate, receiveDelete })
  taskCallbacks.current = { syncTasks, receiveAdd, receiveUpdate, receiveDelete }

  const handleJoin = async (name: string, roomId: string) => {
    await connect(roomId, name)
    setInCall(true)
  }

  const handleLeave = () => {
    disconnect()
    setInCall(false)
  }

  const handleToggleAudio = () => {
    toggleAudio()
    setAudioEnabled((v) => !v)
  }

  const handleToggleVideo = () => {
    toggleVideo()
    setVideoEnabled((v) => !v)
  }

  if (!inCall) {
    return <JoinScreen onJoin={handleJoin} />
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden select-none">
      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 overflow-hidden">
          <VideoGrid
            localStream={localStream}
            myName={myName}
            localAudioMuted={!audioEnabled}
            localVideoMuted={!videoEnabled}
            peers={peers}
          />
        </div>

        {/* Task panel */}
        {taskPanelOpen && (
          <div className="w-80 flex-shrink-0 overflow-hidden">
            <TaskList
              tasks={tasks}
              myId={myId}
              myName={myName}
              peers={peers}
              onAdd={addTask}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={editTask}
              onAssign={assignTask}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <Controls
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        taskPanelOpen={taskPanelOpen}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleTaskPanel={() => setTaskPanelOpen((v) => !v)}
        onLeave={handleLeave}
        connectedCount={peers.size}
      />
    </div>
  )
}
