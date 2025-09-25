export class NetworkManager {
  private isInitialized = false
  private roomId: string | null = null
  private isHost = false
  private connectedPeers: Set<string> = new Set()

  constructor() {
    this.setupEventListeners()
  }

  async initialize(): Promise<void> {
    // Network initialization will be handled by the network worker
    this.isInitialized = true
    console.log('🌐 Network manager initialized')
  }

  private setupEventListeners(): void {
    // Listen to network worker events
    window.addEventListener('worker-network', (event: Event) => {
      const customEvent = event as CustomEvent
      this.handleNetworkEvent(customEvent.detail)
    })
  }

  private handleNetworkEvent(message: any): void {
    switch (message.type) {
      case 'peer-connected':
        console.log('🔗 Peer connected:', message.payload.peerId)
        break

      case 'peer-joined':
        this.connectedPeers.add(message.payload.peerId)
        console.log('👤 Peer joined:', message.payload.peerId)
        break

      case 'peer-left':
        this.connectedPeers.delete(message.payload.peerId)
        console.log('👋 Peer left:', message.payload.peerId)
        break

      case 'room-hosted':
        this.roomId = message.payload.roomId
        this.isHost = message.payload.isHost
        console.log('🏠 Room hosted:', this.roomId)
        break

      case 'room-joined':
        this.roomId = message.payload.roomId
        this.isHost = message.payload.isHost
        console.log('🚪 Joined room:', this.roomId)
        break

      case 'data-received':
        this.handleDataReceived(message.payload.fromPeer, message.payload.data)
        break

      case 'error':
        console.error('🚨 Network error:', message.payload.error)
        break

      default:
        console.log('📡 Network event:', message.type, message.payload)
    }
  }

  private handleDataReceived(fromPeer: string, data: any): void {
    // Handle incoming data from peers
    console.log('📨 Data from', fromPeer, ':', data)

    // Emit custom event for other systems
    window.dispatchEvent(new CustomEvent('network-data', {
      detail: { fromPeer, data }
    }))
  }

  hostRoom(): void {
    if (!this.isInitialized) {
      console.error('Network manager not initialized')
      return
    }

    // Send message to network worker
    window.dispatchEvent(new CustomEvent('send-to-worker', {
      detail: {
        worker: 'network',
        type: 'host-room',
        payload: {}
      }
    }))
  }

  joinRoom(roomId: string): void {
    if (!this.isInitialized) {
      console.error('Network manager not initialized')
      return
    }

    window.dispatchEvent(new CustomEvent('send-to-worker', {
      detail: {
        worker: 'network',
        type: 'join-room',
        payload: { roomId }
      }
    }))
  }

  broadcast(data: any): void {
    if (!this.isInitialized || this.connectedPeers.size === 0) {
      return
    }

    window.dispatchEvent(new CustomEvent('send-to-worker', {
      detail: {
        worker: 'network',
        type: 'broadcast',
        payload: { payload: data }
      }
    }))
  }

  sendToPeer(peerId: string, data: any): void {
    if (!this.isInitialized) {
      return
    }

    window.dispatchEvent(new CustomEvent('send-to-worker', {
      detail: {
        worker: 'network',
        type: 'send-to-peer',
        payload: { peerId, payload: data }
      }
    }))
  }

  disconnect(): void {
    window.dispatchEvent(new CustomEvent('send-to-worker', {
      detail: {
        worker: 'network',
        type: 'disconnect',
        payload: {}
      }
    }))

    this.connectedPeers.clear()
    this.roomId = null
    this.isHost = false
  }

  getRoomId(): string | null {
    return this.roomId
  }

  isRoomHost(): boolean {
    return this.isHost
  }

  getConnectedPeers(): string[] {
    return Array.from(this.connectedPeers)
  }
}