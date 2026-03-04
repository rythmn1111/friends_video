export interface Task {
  id: string
  text: string
  completed: boolean
  assignee: string | null // peerId
  assigneeName: string | null
  createdBy: string // peerId
  createdByName: string
  createdAt: number
}

export interface Peer {
  id: string
  name: string
  stream: MediaStream | null
  audioMuted: boolean
  videoMuted: boolean
}

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export type SignalMessage =
  | { type: 'join'; roomId: string; peerId: string; name: string }
  | { type: 'offer'; to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; to: string; from: string; candidate: RTCIceCandidateInit }
  | { type: 'peer-joined'; peerId: string; name: string }
  | { type: 'peer-left'; peerId: string; name: string }
  | { type: 'room-peers'; peers: Array<{ id: string; name: string }> }
  | { type: 'error'; message: string }

export type DataChannelMessage =
  | { type: 'tasks-sync'; tasks: Task[] }
  | { type: 'task-add'; task: Task }
  | { type: 'task-update'; task: Task }
  | { type: 'task-delete'; taskId: string }
  | { type: 'media-state'; audioMuted: boolean; videoMuted: boolean }
