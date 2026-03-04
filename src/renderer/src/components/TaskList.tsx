import { useState, useRef } from 'react'
import type { Task, Peer } from '../types'

interface TaskListProps {
  tasks: Task[]
  myId: string
  myName: string
  peers: Map<string, Peer>
  onAdd: (text: string) => void
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
  onEdit: (taskId: string, text: string) => void
  onAssign: (taskId: string, peerId: string | null, peerName: string | null) => void
}

export function TaskList({
  tasks,
  myId,
  myName,
  peers,
  onAdd,
  onToggle,
  onDelete,
  onEdit,
  onAssign
}: TaskListProps) {
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [filter, setFilter] = useState<'all' | 'mine' | 'pending' | 'done'>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  const allPeople = [
    { id: myId, name: myName },
    ...Array.from(peers.values()).map((p) => ({ id: p.id, name: p.name }))
  ]

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'mine') return task.assignee === myId || task.createdBy === myId
    if (filter === 'pending') return !task.completed
    if (filter === 'done') return task.completed
    return true
  })

  const handleAdd = () => {
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  const handleEditSave = (taskId: string) => {
    if (editText.trim()) {
      onEdit(taskId, editText.trim())
    }
    setEditingId(null)
  }

  const pendingCount = tasks.filter((t) => !t.completed).length
  const doneCount = tasks.filter((t) => t.completed).length

  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-white/10">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <span className="text-lg">✓</span>
            Task Board
          </h2>
          <div className="flex gap-3 text-xs text-gray-400">
            <span className="text-violet-400 font-medium">{pendingCount} left</span>
            <span>{doneCount} done</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'mine', 'pending', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">
            {filter === 'all' ? 'No tasks yet. Add one below!' : `No ${filter} tasks.`}
          </div>
        )}

        {filteredTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            myId={myId}
            allPeople={allPeople}
            isEditing={editingId === task.id}
            editText={editText}
            onEditStart={() => {
              setEditingId(task.id)
              setEditText(task.text)
            }}
            onEditChange={setEditText}
            onEditSave={() => handleEditSave(task.id)}
            onEditCancel={() => setEditingId(null)}
            onToggle={() => onToggle(task.id)}
            onDelete={() => onDelete(task.id)}
            onAssign={(peerId, peerName) => onAssign(task.id, peerId, peerName)}
          />
        ))}
      </div>

      {/* Add task input */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a task..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 focus:bg-white/8 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  myId: string
  allPeople: Array<{ id: string; name: string }>
  isEditing: boolean
  editText: string
  onEditStart: () => void
  onEditChange: (text: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onToggle: () => void
  onDelete: () => void
  onAssign: (peerId: string | null, peerName: string | null) => void
}

function TaskItem({
  task,
  myId,
  allPeople,
  isEditing,
  editText,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onToggle,
  onDelete,
  onAssign
}: TaskItemProps) {
  const [showAssign, setShowAssign] = useState(false)

  const assigneeName = task.assigneeName ?? task.assignee
  const isMyTask = task.assignee === myId || task.createdBy === myId

  return (
    <div
      className={`group rounded-xl border p-3 transition-all ${
        task.completed
          ? 'bg-white/2 border-white/5 opacity-60'
          : isMyTask
            ? 'bg-violet-950/30 border-violet-500/20 hover:border-violet-500/40'
            : 'bg-white/3 border-white/8 hover:border-white/15'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-violet-600 border-violet-600'
              : 'border-gray-500 hover:border-violet-400'
          }`}
        >
          {task.completed && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditSave()
                if (e.key === 'Escape') onEditCancel()
              }}
              onBlur={onEditSave}
              className="w-full bg-white/10 rounded-lg px-2 py-0.5 text-sm text-white outline-none border border-violet-500"
            />
          ) : (
            <p
              onDoubleClick={onEditStart}
              className={`text-sm leading-snug break-words ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-100'
              }`}
            >
              {task.text}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-gray-600">by {task.createdByName}</span>

            {/* Assignee badge */}
            {task.assignee ? (
              <button
                onClick={() => setShowAssign(!showAssign)}
                className="text-xs bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded-full hover:bg-indigo-800/50 transition-colors"
              >
                → {assigneeName}
              </button>
            ) : (
              <button
                onClick={() => setShowAssign(!showAssign)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                + assign
              </button>
            )}
          </div>

          {/* Assign dropdown */}
          {showAssign && (
            <div className="mt-2 bg-gray-900 border border-white/10 rounded-lg overflow-hidden shadow-lg">
              <button
                onClick={() => {
                  onAssign(null, null)
                  setShowAssign(false)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 transition-colors"
              >
                Unassign
              </button>
              {allPeople.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onAssign(p.id, p.name)
                    setShowAssign(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${
                    task.assignee === p.id ? 'text-violet-400' : 'text-gray-300'
                  }`}
                >
                  {p.name} {p.id === myId && '(You)'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-1 flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
