import { useState } from 'react'

interface JoinScreenProps {
  onJoin: (name: string, roomId: string, serverUrl: string) => void
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [serverUrl, setServerUrl] = useState('ws://localhost:3001/signal')
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [newRoomId] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const room = mode === 'create' ? newRoomId : roomId.trim().toUpperCase()
    if (!room) return
    onJoin(name.trim(), room, serverUrl.trim())
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Friends Video</h1>
          <p className="text-gray-400 text-sm mt-1">Video calls with shared task boards</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-black/30 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'create' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'join' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Join Room
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors text-sm"
              />
            </div>

            {mode === 'create' ? (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Room code — share this with friends
                </label>
                <div className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                  <span className="text-white font-mono font-semibold tracking-widest text-lg flex-1">
                    {newRoomId}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(newRoomId)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Room code</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room code"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors text-sm font-mono uppercase tracking-widest"
                  maxLength={6}
                />
              </div>
            )}

            {/* Advanced: server URL */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                <span>{showAdvanced ? '▾' : '▸'}</span>
                Advanced (server URL)
              </button>
              {showAdvanced && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="ws://localhost:3001/signal"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors text-sm font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Everyone in the call must use the same server URL.
                    Run <code className="text-gray-400">bun run server</code> on one machine and
                    enter its IP here — e.g. <code className="text-gray-400">ws://192.168.1.5:3001/signal</code>
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!name.trim() || (mode === 'join' && !roomId.trim())}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 font-medium text-sm transition-colors mt-2"
            >
              {mode === 'create' ? 'Create & Join' : 'Join Room'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          One person runs <code className="text-gray-500">bun run server</code> and shares their IP
        </p>
      </div>
    </div>
  )
}
