import { VideoTile } from './VideoTile'
import type { Peer } from '../types'

interface VideoGridProps {
  localStream: MediaStream | null
  myName: string
  localAudioMuted: boolean
  localVideoMuted: boolean
  peers: Map<string, Peer>
}

export function VideoGrid({
  localStream,
  myName,
  localAudioMuted,
  localVideoMuted,
  peers
}: VideoGridProps) {
  const peerList = Array.from(peers.values())
  const total = peerList.length + 1 // +1 for local

  // Layout based on number of participants
  const gridClass =
    total === 1
      ? 'grid-cols-1'
      : total === 2
        ? 'grid-cols-2'
        : total === 3
          ? 'grid-cols-2'
          : 'grid-cols-2'

  return (
    <div className={`grid ${gridClass} gap-3 p-4 h-full auto-rows-fr`}>
      {/* Local video - if 3 people, local goes bottom left */}
      {total === 3 ? (
        <>
          {peerList.slice(0, 2).map((peer) => (
            <VideoTile
              key={peer.id}
              stream={peer.stream}
              name={peer.name}
              audioMuted={peer.audioMuted}
              videoMuted={peer.videoMuted}
            />
          ))}
          <VideoTile
            stream={localStream}
            name={myName}
            isLocal
            audioMuted={localAudioMuted}
            videoMuted={localVideoMuted}
          />
          {/* Empty slot for symmetry */}
          <div className="rounded-2xl bg-gray-900/30 border border-white/5 flex items-center justify-center">
            <p className="text-gray-600 text-sm">Waiting for more friends...</p>
          </div>
        </>
      ) : (
        <>
          <VideoTile
            stream={localStream}
            name={myName}
            isLocal
            audioMuted={localAudioMuted}
            videoMuted={localVideoMuted}
          />
          {peerList.map((peer) => (
            <VideoTile
              key={peer.id}
              stream={peer.stream}
              name={peer.name}
              audioMuted={peer.audioMuted}
              videoMuted={peer.videoMuted}
            />
          ))}
        </>
      )}
    </div>
  )
}
