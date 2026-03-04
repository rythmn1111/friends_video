import { useEffect, useRef } from 'react'

interface VideoTileProps {
  stream: MediaStream | null
  name: string
  isLocal?: boolean
  audioMuted?: boolean
  videoMuted?: boolean
  size?: 'large' | 'small'
}

export function VideoTile({
  stream,
  name,
  isLocal = false,
  audioMuted = false,
  videoMuted = false,
  size = 'large'
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center ${
        size === 'large' ? 'aspect-video' : 'aspect-video'
      }`}
    >
      {/* Video */}
      {stream && !videoMuted ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
          style={isLocal ? { transform: 'scaleX(-1)' } : undefined}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div
            className={`rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-semibold text-white ${
              size === 'large' ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-base'
            }`}
          >
            {initials}
          </div>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {name}
          {isLocal && <span className="text-gray-400 ml-1">(You)</span>}
        </span>
      </div>

      {/* Status icons */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        {audioMuted && (
          <div className="bg-red-500/90 rounded-full p-1.5" title="Muted">
            <MicOffIcon size={12} />
          </div>
        )}
        {videoMuted && (
          <div className="bg-red-500/90 rounded-full p-1.5" title="Camera off">
            <CamOffIcon size={12} />
          </div>
        )}
      </div>
    </div>
  )
}

function MicOffIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function CamOffIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
