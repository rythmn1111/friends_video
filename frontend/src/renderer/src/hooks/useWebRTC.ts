import { useCallback, useEffect, useRef, useState } from 'react'
import type { Peer, SignalMessage, DataChannelMessage, Task } from '../types'

const DEFAULT_SIGNAL_URL = 'ws://localhost:3001/signal'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' }
]

interface PeerConnection {
  pc: RTCPeerConnection
  dataChannel: RTCDataChannel | null
}

interface UseWebRTCOptions {
  onTasksSync: (tasks: Task[]) => void
  onTaskAdd: (task: Task) => void
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (taskId: string) => void
}

export function useWebRTC(options: UseWebRTCOptions) {
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
  >('idle')
  const [myId, setMyId] = useState<string>('')
  const [myName, setMyName] = useState<string>('')

  const wsRef = useRef<WebSocket | null>(null)
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const myIdRef = useRef<string>('')
  const myNameRef = useRef<string>('')
  const tasksRef = useRef<Task[]>([])

  const handleDataMessage = useCallback(
    (raw: string, fromId: string) => {
      let msg: DataChannelMessage
      try {
        msg = JSON.parse(raw)
      } catch {
        return
      }

      if (msg.type === 'tasks-sync') {
        options.onTasksSync(msg.tasks)
        tasksRef.current = msg.tasks
      } else if (msg.type === 'task-add') {
        options.onTaskAdd(msg.task)
        tasksRef.current = [...tasksRef.current, msg.task]
      } else if (msg.type === 'task-update') {
        options.onTaskUpdate(msg.task)
        tasksRef.current = tasksRef.current.map((t) => (t.id === msg.task.id ? msg.task : t))
      } else if (msg.type === 'task-delete') {
        options.onTaskDelete(msg.taskId)
        tasksRef.current = tasksRef.current.filter((t) => t.id !== msg.taskId)
      } else if (msg.type === 'media-state') {
        setPeers((prev) => {
          const next = new Map(prev)
          const peer = next.get(fromId)
          if (peer) {
            next.set(fromId, {
              ...peer,
              audioMuted: msg.audioMuted,
              videoMuted: msg.videoMuted
            })
          }
          return next
        })
      }
    },
    [options]
  )

  const setupDataChannel = useCallback(
    (channel: RTCDataChannel, peerId: string) => {
      channel.onopen = () => {
        console.log(`Data channel open with ${peerId}`)
        // Send current task state to newly connected peer
        if (tasksRef.current.length > 0) {
          channel.send(JSON.stringify({ type: 'tasks-sync', tasks: tasksRef.current }))
        }
      }
      channel.onmessage = (e) => handleDataMessage(e.data, peerId)
      channel.onerror = (e) => console.error('Data channel error:', e)
    },
    [handleDataMessage]
  )

  const createPeerConnection = useCallback(
    (peerId: string, peerName: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

      // Add local tracks
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current)
        }
      }

      // Handle remote stream
      const remoteStream = new MediaStream()
      pc.ontrack = (e) => {
        remoteStream.addTrack(e.track)
        setPeers((prev) => {
          const next = new Map(prev)
          const peer = next.get(peerId) ?? {
            id: peerId,
            name: peerName,
            stream: remoteStream,
            audioMuted: false,
            videoMuted: false
          }
          next.set(peerId, { ...peer, stream: remoteStream })
          return next
        })
      }

      // ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'ice-candidate',
              to: peerId,
              from: myIdRef.current,
              candidate: e.candidate
            })
          )
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.log(`Connection to ${peerName} ${pc.connectionState}`)
        }
      }

      const conn: PeerConnection = { pc, dataChannel: null }
      peerConnectionsRef.current.set(peerId, conn)

      return conn
    },
    []
  )

  const sendToAllPeers = useCallback((msg: DataChannelMessage) => {
    const raw = JSON.stringify(msg)
    for (const conn of peerConnectionsRef.current.values()) {
      if (conn.dataChannel?.readyState === 'open') {
        conn.dataChannel.send(raw)
      }
    }
  }, [])

  const broadcastTaskAdd = useCallback(
    (task: Task) => {
      sendToAllPeers({ type: 'task-add', task })
    },
    [sendToAllPeers]
  )

  const broadcastTaskUpdate = useCallback(
    (task: Task) => {
      sendToAllPeers({ type: 'task-update', task })
    },
    [sendToAllPeers]
  )

  const broadcastTaskDelete = useCallback(
    (taskId: string) => {
      sendToAllPeers({ type: 'task-delete', taskId })
    },
    [sendToAllPeers]
  )

  const broadcastMediaState = useCallback(
    (audioMuted: boolean, videoMuted: boolean) => {
      sendToAllPeers({ type: 'media-state', audioMuted, videoMuted })
    },
    [sendToAllPeers]
  )

  const connect = useCallback(
    async (roomId: string, name: string, serverUrl: string = DEFAULT_SIGNAL_URL) => {
      setConnectionState('connecting')

      // Get local media
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch {
        // Try audio only
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        } catch {
          stream = new MediaStream()
        }
      }
      localStreamRef.current = stream
      setLocalStream(stream)

      // Generate peer ID
      const peerId = crypto.randomUUID()
      myIdRef.current = peerId
      myNameRef.current = name
      setMyId(peerId)
      setMyName(name)

      // Connect to signaling server
      const ws = new WebSocket(serverUrl)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', roomId, peerId, name }))
        setConnectionState('connected')
      }

      ws.onerror = () => setConnectionState('error')
      ws.onclose = () => setConnectionState('disconnected')

      ws.onmessage = async (e) => {
        const msg: SignalMessage = JSON.parse(e.data)

        if (msg.type === 'room-peers') {
          // Create offers for all existing peers
          for (const remotePeer of msg.peers) {
            setPeers((prev) => {
              const next = new Map(prev)
              if (!next.has(remotePeer.id)) {
                next.set(remotePeer.id, {
                  id: remotePeer.id,
                  name: remotePeer.name,
                  stream: null,
                  audioMuted: false,
                  videoMuted: false
                })
              }
              return next
            })

            const conn = createPeerConnection(remotePeer.id, remotePeer.name)

            // Create data channel (offerer creates it)
            const dc = conn.pc.createDataChannel('tasks')
            conn.dataChannel = dc
            setupDataChannel(dc, remotePeer.id)

            const offer = await conn.pc.createOffer()
            await conn.pc.setLocalDescription(offer)

            ws.send(
              JSON.stringify({
                type: 'offer',
                to: remotePeer.id,
                from: peerId,
                sdp: offer
              })
            )
          }
        }

        if (msg.type === 'peer-joined') {
          setPeers((prev) => {
            const next = new Map(prev)
            next.set(msg.peerId, {
              id: msg.peerId,
              name: msg.name,
              stream: null,
              audioMuted: false,
              videoMuted: false
            })
            return next
          })
          // Answerer waits for offer, no action needed here
        }

        if (msg.type === 'offer') {
          const conn = createPeerConnection(msg.from, '')
          // Update peer name
          setPeers((prev) => {
            const next = new Map(prev)
            const existing = next.get(msg.from)
            if (existing) next.set(msg.from, existing)
            return next
          })

          // Answerer receives data channel
          conn.pc.ondatachannel = (e) => {
            conn.dataChannel = e.channel
            setupDataChannel(e.channel, msg.from)
          }

          await conn.pc.setRemoteDescription(msg.sdp)
          const answer = await conn.pc.createAnswer()
          await conn.pc.setLocalDescription(answer)

          ws.send(
            JSON.stringify({
              type: 'answer',
              to: msg.from,
              from: peerId,
              sdp: answer
            })
          )
        }

        if (msg.type === 'answer') {
          const conn = peerConnectionsRef.current.get(msg.from)
          if (conn) {
            await conn.pc.setRemoteDescription(msg.sdp)
          }
        }

        if (msg.type === 'ice-candidate') {
          const conn = peerConnectionsRef.current.get(msg.from)
          if (conn) {
            try {
              await conn.pc.addIceCandidate(msg.candidate)
            } catch (err) {
              console.error('Error adding ICE candidate:', err)
            }
          }
        }

        if (msg.type === 'peer-left') {
          const conn = peerConnectionsRef.current.get(msg.peerId)
          if (conn) {
            conn.pc.close()
            peerConnectionsRef.current.delete(msg.peerId)
          }
          setPeers((prev) => {
            const next = new Map(prev)
            next.delete(msg.peerId)
            return next
          })
        }
      }
    },
    [createPeerConnection, setupDataChannel]
  )

  const disconnect = useCallback(() => {
    for (const conn of peerConnectionsRef.current.values()) {
      conn.pc.close()
    }
    peerConnectionsRef.current.clear()
    wsRef.current?.close()
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    setLocalStream(null)
    setPeers(new Map())
    setConnectionState('idle')
  }, [])

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const track = stream.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    broadcastMediaState(!track.enabled, !localStreamRef.current?.getVideoTracks()[0]?.enabled)
  }, [broadcastMediaState])

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    broadcastMediaState(!localStreamRef.current?.getAudioTracks()[0]?.enabled, !track.enabled)
  }, [broadcastMediaState])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    peers,
    localStream,
    connectionState,
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
  }
}
