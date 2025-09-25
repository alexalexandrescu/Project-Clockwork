import Peer from 'peerjs'
import { WorkerMessage, NetworkEvent } from '@/types'

class NetworkWorker {
  private peer: Peer | null = null
  private connections: Map<string, any> = new Map()
  private isInitialized = false
  private isHost = false

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this))
  }

  private handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { id, type, payload } = event.data

    switch (type) {
      case 'init':
        this.initialize()
        break
      case 'host-room':
        this.hostRoom(id, payload)
        break
      case 'join-room':
        this.joinRoom(id, payload)
        break
      case 'broadcast':
        this.broadcast(id, payload)
        break
      case 'send-to-peer':
        this.sendToPeer(id, payload)
        break
      case 'disconnect':
        this.disconnect(id)
        break
      default:
        console.warn('Unknown network worker message type:', type)
    }
  }

  private initialize(): void {
    try {
      this.peer = new Peer({
        host: 'localhost',
        port: 9000,
        path: '/myapp',
        debug: 2
      })

      this.peer.on('open', (id) => {
        this.isInitialized = true
        this.postMessage({
          id: 'peer-ready',
          type: 'peer-connected',
          payload: { peerId: id },
          timestamp: Date.now()
        })
      })

      this.peer.on('connection', (conn) => {
        this.handleIncomingConnection(conn)
      })

      this.peer.on('error', (error) => {
        console.error('PeerJS error:', error)
        this.postMessage({
          id: 'peer-error',
          type: 'error',
          payload: { error: error.message },
          timestamp: Date.now()
        })
      })

      this.postMessage({
        id: 'init-response',
        type: 'ready',
        payload: { message: 'Network worker initialized' },
        timestamp: Date.now()
      })

    } catch (error) {
      this.postMessage({
        id: 'init-response',
        type: 'error',
        payload: { error: 'Network initialization failed' },
        timestamp: Date.now()
      })
    }
  }

  private hostRoom(messageId: string, data: any): void {
    if (!this.peer) return

    this.isHost = true
    const roomId = this.peer.id

    this.postMessage({
      id: messageId,
      type: 'room-hosted',
      payload: { roomId, isHost: true },
      timestamp: Date.now()
    })
  }

  private joinRoom(messageId: string, data: { roomId: string }): void {
    if (!this.peer) return

    const conn = this.peer.connect(data.roomId)
    this.setupConnection(conn)

    conn.on('open', () => {
      this.postMessage({
        id: messageId,
        type: 'room-joined',
        payload: { roomId: data.roomId, isHost: false },
        timestamp: Date.now()
      })
    })
  }

  private handleIncomingConnection(conn: any): void {
    this.setupConnection(conn)

    this.postMessage({
      id: 'peer-joined',
      type: 'peer-joined',
      payload: { peerId: conn.peer },
      timestamp: Date.now()
    })
  }

  private setupConnection(conn: any): void {
    this.connections.set(conn.peer, conn)

    conn.on('data', (data: any) => {
      this.postMessage({
        id: `data-${Date.now()}`,
        type: 'data-received',
        payload: { fromPeer: conn.peer, data },
        timestamp: Date.now()
      })
    })

    conn.on('close', () => {
      this.connections.delete(conn.peer)
      this.postMessage({
        id: `peer-left-${Date.now()}`,
        type: 'peer-left',
        payload: { peerId: conn.peer },
        timestamp: Date.now()
      })
    })

    conn.on('error', (error: any) => {
      console.error('Connection error:', error)
    })
  }

  private broadcast(messageId: string, data: any): void {
    const sent = []

    for (const [peerId, conn] of this.connections) {
      try {
        conn.send(data.payload)
        sent.push(peerId)
      } catch (error) {
        console.error(`Failed to send to ${peerId}:`, error)
      }
    }

    this.postMessage({
      id: messageId,
      type: 'broadcast-result',
      payload: { sent, total: this.connections.size },
      timestamp: Date.now()
    })
  }

  private sendToPeer(messageId: string, data: { peerId: string; payload: any }): void {
    const conn = this.connections.get(data.peerId)

    if (conn) {
      try {
        conn.send(data.payload)
        this.postMessage({
          id: messageId,
          type: 'send-result',
          payload: { success: true, peerId: data.peerId },
          timestamp: Date.now()
        })
      } catch (error) {
        this.postMessage({
          id: messageId,
          type: 'send-result',
          payload: { success: false, error, peerId: data.peerId },
          timestamp: Date.now()
        })
      }
    } else {
      this.postMessage({
        id: messageId,
        type: 'send-result',
        payload: { success: false, error: 'Peer not found', peerId: data.peerId },
        timestamp: Date.now()
      })
    }
  }

  private disconnect(messageId: string): void {
    for (const conn of this.connections.values()) {
      conn.close()
    }
    this.connections.clear()

    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }

    this.postMessage({
      id: messageId,
      type: 'disconnected',
      payload: { message: 'Disconnected from network' },
      timestamp: Date.now()
    })
  }

  private postMessage(message: WorkerMessage): void {
    self.postMessage(message)
  }
}

// Initialize the worker
new NetworkWorker()