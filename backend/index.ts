/**
 * Signaling server for WebRTC peer connections.
 * Handles room management, offer/answer exchange, and ICE candidates.
 * Also broadcasts task list updates to all peers in a room.
 *
 * Run with: bun run server/index.ts
 */

interface Peer {
  id: string
  name: string
  ws: WebSocket
  roomId: string
}

interface Room {
  id: string
  peers: Map<string, Peer>
}

type SignalMessage =
  | { type: 'join'; roomId: string; peerId: string; name: string }
  | { type: 'offer'; to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; to: string; from: string; candidate: RTCIceCandidateInit }
  | { type: 'peer-joined'; peerId: string; name: string }
  | { type: 'peer-left'; peerId: string; name: string }
  | { type: 'room-peers'; peers: Array<{ id: string; name: string }> }
  | { type: 'error'; message: string }

const rooms = new Map<string, Room>()
const peerToRoom = new Map<WebSocket, string>()
const peerById = new Map<string, Peer>()

const PORT = 3001

const server = Bun.serve<{ peerId: string }>({
  port: PORT,
  hostname: '0.0.0.0', // listen on all interfaces, not just localhost
  fetch(req, server) {
    const url = new URL(req.url)
    if (url.pathname === '/signal') {
      const upgraded = server.upgrade(req)
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 500 })
      }
      return undefined
    }
    return new Response('Friends Video Signaling Server', { status: 200 })
  },
  websocket: {
    open(ws) {
      console.log('Client connected')
    },
    message(ws, raw) {
      let msg: SignalMessage
      try {
        msg = JSON.parse(raw as string) as SignalMessage
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
        return
      }

      if (msg.type === 'join') {
        const { roomId, peerId, name } = msg

        // Get or create room
        if (!rooms.has(roomId)) {
          rooms.set(roomId, { id: roomId, peers: new Map() })
        }
        const room = rooms.get(roomId)!

        // Build peer list for the joining peer (before adding them)
        const existingPeers = Array.from(room.peers.values()).map((p) => ({
          id: p.id,
          name: p.name
        }))

        // Register the peer
        const peer: Peer = { id: peerId, name, ws: ws as unknown as WebSocket, roomId }
        room.peers.set(peerId, peer)
        peerToRoom.set(ws as unknown as WebSocket, roomId)
        peerById.set(peerId, peer)

        // Send existing peers to the new joiner
        ws.send(JSON.stringify({ type: 'room-peers', peers: existingPeers }))

        // Notify existing peers about the new joiner
        for (const existing of room.peers.values()) {
          if (existing.id !== peerId) {
            ;(existing.ws as unknown as typeof ws).send(
              JSON.stringify({ type: 'peer-joined', peerId, name })
            )
          }
        }

        console.log(`Peer ${name} (${peerId}) joined room ${roomId}. Room size: ${room.peers.size}`)
        return
      }

      // Route signaling messages between peers
      if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'ice-candidate') {
        const target = peerById.get(msg.to)
        if (!target) {
          ws.send(JSON.stringify({ type: 'error', message: `Peer ${msg.to} not found` }))
          return
        }
        ;(target.ws as unknown as typeof ws).send(JSON.stringify(msg))
        return
      }
    },
    close(ws) {
      const roomId = peerToRoom.get(ws as unknown as WebSocket)
      if (!roomId) return

      const room = rooms.get(roomId)
      if (!room) return

      // Find the peer by ws
      let leavingPeer: Peer | undefined
      for (const peer of room.peers.values()) {
        if (peer.ws === (ws as unknown as WebSocket)) {
          leavingPeer = peer
          break
        }
      }

      if (!leavingPeer) return

      room.peers.delete(leavingPeer.id)
      peerToRoom.delete(ws as unknown as WebSocket)
      peerById.delete(leavingPeer.id)

      // Notify remaining peers
      for (const peer of room.peers.values()) {
        ;(peer.ws as unknown as typeof ws).send(
          JSON.stringify({ type: 'peer-left', peerId: leavingPeer.id, name: leavingPeer.name })
        )
      }

      // Clean up empty rooms
      if (room.peers.size === 0) {
        rooms.delete(roomId)
      }

      console.log(`Peer ${leavingPeer.name} left room ${roomId}`)
    }
  }
})

import { networkInterfaces } from 'os'
const nets = networkInterfaces()
const localIPs: string[] = []
for (const ifaces of Object.values(nets)) {
  for (const iface of ifaces ?? []) {
    if (iface.family === 'IPv4' && !iface.internal) localIPs.push(iface.address)
  }
}
console.log(`\nSignaling server running on port ${PORT}`)
console.log(`Local:   ws://localhost:${PORT}/signal`)
for (const ip of localIPs) {
  console.log(`Network: ws://${ip}:${PORT}/signal  ← share this with friends on the same WiFi`)
}
console.log()
