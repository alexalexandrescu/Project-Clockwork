import Dexie, { Table } from 'dexie'
import { WorkerMessage } from '@/types'

interface GameData {
  id?: number
  key: string
  value: unknown
  timestamp: number
}

interface PlayerData {
  id: string
  name: string
  position: { x: number; y: number }
  lastSeen: number
}

class GameDatabase extends Dexie {
  gameData!: Table<GameData>
  players!: Table<PlayerData>

  constructor() {
    super('ProjectClockworkDB')

    this.version(1).stores({
      gameData: '++id, key, timestamp',
      players: 'id, name, lastSeen'
    })
  }
}

class DatabaseWorker {
  private db: GameDatabase

  constructor() {
    this.db = new GameDatabase()
    self.addEventListener('message', this.handleMessage.bind(this))
  }

  private handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { id, type, payload } = event.data

    switch (type) {
      case 'init':
        this.initialize()
        break
      case 'save':
        this.saveData(id, payload as { key: string; value: unknown })
        break
      case 'load':
        this.loadData(id, payload as { key: string })
        break
      case 'savePlayer':
        this.savePlayer(id, payload as PlayerData)
        break
      case 'loadPlayers':
        this.loadPlayers(id)
        break
      case 'clear':
        this.clearData(id, payload as { table?: string })
        break
      default:
        console.warn('Unknown database worker message type:', type)
    }
  }

  private async initialize(): Promise<void> {
    try {
      await this.db.open()

      this.postMessage({
        id: 'init-response',
        type: 'ready',
        payload: { message: 'Database worker initialized' },
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Database initialization failed:', error)
      this.postMessage({
        id: 'init-response',
        type: 'error',
        payload: { error: 'Database initialization failed' },
        timestamp: Date.now()
      })
    }
  }

  private async saveData(messageId: string, data: { key: string; value: unknown }): Promise<void> {
    try {
      await this.db.gameData.put({
        key: data.key,
        value: data.value,
        timestamp: Date.now()
      })

      this.postMessage({
        id: messageId,
        type: 'save-result',
        payload: { success: true },
        timestamp: Date.now()
      })
    } catch (error) {
      this.postMessage({
        id: messageId,
        type: 'save-result',
        payload: { success: false, error },
        timestamp: Date.now()
      })
    }
  }

  private async loadData(messageId: string, data: { key: string }): Promise<void> {
    try {
      const result = await this.db.gameData.where('key').equals(data.key).first()

      this.postMessage({
        id: messageId,
        type: 'load-result',
        payload: { success: true, data: result },
        timestamp: Date.now()
      })
    } catch (error) {
      this.postMessage({
        id: messageId,
        type: 'load-result',
        payload: { success: false, error },
        timestamp: Date.now()
      })
    }
  }

  private async savePlayer(messageId: string, player: PlayerData): Promise<void> {
    try {
      await this.db.players.put(player)

      this.postMessage({
        id: messageId,
        type: 'player-saved',
        payload: { success: true },
        timestamp: Date.now()
      })
    } catch (error) {
      this.postMessage({
        id: messageId,
        type: 'player-saved',
        payload: { success: false, error },
        timestamp: Date.now()
      })
    }
  }

  private async loadPlayers(messageId: string): Promise<void> {
    try {
      const players = await this.db.players.toArray()

      this.postMessage({
        id: messageId,
        type: 'players-loaded',
        payload: { success: true, players },
        timestamp: Date.now()
      })
    } catch (error) {
      this.postMessage({
        id: messageId,
        type: 'players-loaded',
        payload: { success: false, error },
        timestamp: Date.now()
      })
    }
  }

  private async clearData(messageId: string, data: { table?: string }): Promise<void> {
    try {
      if (data.table === 'players') {
        await this.db.players.clear()
      } else if (data.table === 'gameData') {
        await this.db.gameData.clear()
      } else {
        await this.db.delete()
        this.db = new GameDatabase()
        await this.db.open()
      }

      this.postMessage({
        id: messageId,
        type: 'clear-result',
        payload: { success: true },
        timestamp: Date.now()
      })
    } catch (error) {
      this.postMessage({
        id: messageId,
        type: 'clear-result',
        payload: { success: false, error },
        timestamp: Date.now()
      })
    }
  }

  private postMessage(message: WorkerMessage): void {
    self.postMessage(message)
  }
}

// Initialize the worker
new DatabaseWorker()