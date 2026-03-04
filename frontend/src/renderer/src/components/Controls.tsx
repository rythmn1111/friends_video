interface ControlsProps {
  audioEnabled: boolean
  videoEnabled: boolean
  taskPanelOpen: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleTaskPanel: () => void
  onLeave: () => void
  connectedCount: number
}

export function Controls({
  audioEnabled,
  videoEnabled,
  taskPanelOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleTaskPanel,
  onLeave,
  connectedCount
}: ControlsProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-950 border-t border-white/10">
      {/* Left: connection info */}
      <div className="flex items-center gap-2 w-32">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-gray-400 text-xs">
          {connectedCount} connected
        </span>
      </div>

      {/* Center: main controls */}
      <div className="flex items-center gap-3">
        <ControlButton
          active={audioEnabled}
          onClick={onToggleAudio}
          activeLabel="Mute"
          inactiveLabel="Unmute"
          activeIcon={<MicIcon />}
          inactiveIcon={<MicOffIcon />}
          danger={!audioEnabled}
        />

        <ControlButton
          active={videoEnabled}
          onClick={onToggleVideo}
          activeLabel="Stop video"
          inactiveLabel="Start video"
          activeIcon={<CamIcon />}
          inactiveIcon={<CamOffIcon />}
          danger={!videoEnabled}
        />

        {/* Leave button */}
        <button
          onClick={onLeave}
          className="bg-red-600 hover:bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors shadow-lg"
          title="Leave call"
        >
          <PhoneOffIcon />
        </button>
      </div>

      {/* Right: task panel toggle */}
      <div className="flex items-center gap-2 w-32 justify-end">
        <button
          onClick={onToggleTaskPanel}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            taskPanelOpen
              ? 'bg-violet-600 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle task panel"
        >
          <TaskIcon />
          <span className="text-xs">Tasks</span>
        </button>
      </div>
    </div>
  )
}

interface ControlButtonProps {
  active: boolean
  onClick: () => void
  activeLabel: string
  inactiveLabel: string
  activeIcon: React.ReactNode
  inactiveIcon: React.ReactNode
  danger?: boolean
}

function ControlButton({
  active,
  onClick,
  activeLabel,
  inactiveLabel,
  activeIcon,
  inactiveIcon,
  danger
}: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={active ? activeLabel : inactiveLabel}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
        danger
          ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  )
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function CamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

function CamOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function PhoneOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 3.07 8.63 19.79 19.79 0 0 1 0 0a2 2 0 0 1 2-2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.18 5.36" transform="translate(0 2)" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function TaskIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
