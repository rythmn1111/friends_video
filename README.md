# Friends Video

A WebRTC video calling app for friends with a shared real-time task board.

## Features

- 🎥 Video/audio calls for up to 4 people (mesh WebRTC)
- ✅ Shared task board — add, complete, assign, and delete tasks in real time
- 👤 Assign tasks to any person in the call
- 🔇 Mute audio/video with status shown on tiles
- 🌙 Dark theme

## How it works

- **Signaling server** (Bun WebSocket): handles WebRTC offer/answer/ICE exchange
- **WebRTC mesh**: direct peer-to-peer connections for video/audio
- **DataChannels**: task list is synced peer-to-peer, no server roundtrip needed

## Running locally (everyone on same network)

### 1. Start the signaling server (one person)

```bash
bun run server
```

This starts the WebSocket signaling server on port `3001`.

### 2. Start the app (each person)

```bash
bun run dev
```

### 3. Create or join a room

- One person clicks **Create Room** → shares the 6-letter room code
- Others click **Join Room** → paste the code

> **Note:** By default the app connects to `ws://localhost:3001`. If you want to call friends over the internet, deploy the signaling server somewhere and update `SIGNAL_URL` in `src/renderer/src/hooks/useWebRTC.ts`.

## Building

```bash
bun run build
```

Outputs to `out/`.

## Project structure

```
src/
  main/          Electron main process
  preload/       Electron preload (context bridge)
  renderer/src/
    App.tsx             Root component
    components/
      JoinScreen.tsx    Room join UI
      VideoGrid.tsx     Video tile grid
      VideoTile.tsx     Individual video tile
      TaskList.tsx      Task board panel
      Controls.tsx      Bottom control bar
    hooks/
      useWebRTC.ts      WebRTC connections + DataChannel
      useTasks.ts       Task state management
    types/index.ts      Shared TypeScript types
server/
  index.ts       Bun WebSocket signaling server
```
