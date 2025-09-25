// Global type definitions for Project Clockwork

export interface Vector2D {
  x: number
  y: number
}

export interface Vector3D extends Vector2D {
  z: number
}

export interface GameConfig {
  containerId: string
  width: number
  height: number
  debug?: boolean
}

export interface PlayerState {
  id: string
  position: Vector2D
  isOnline: boolean
  lastSeen: number
}

export interface GameState {
  players: Map<string, PlayerState>
  isConnected: boolean
  roomId?: string
}

export interface WorkerMessage<T = unknown> {
  id: string
  type: string
  payload: T
  timestamp: number
}

export interface NetworkEvent {
  type: 'player-join' | 'player-leave' | 'position-update' | 'room-created'
  data: unknown
  senderId?: string
}

export type WorkerType = 'ai' | 'database' | 'network' | 'processing'

export interface SystemConfig {
  enableAI: boolean
  enableP2P: boolean
  maxPlayers: number
  debugMode: boolean
}