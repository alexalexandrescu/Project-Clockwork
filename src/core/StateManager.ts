import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { GameState, PlayerState, SystemConfig } from '@/types'

interface AppState {
  // Game state
  game: GameState

  // System configuration
  config: SystemConfig

  // UI state
  ui: {
    isMenuOpen: boolean
    activePanel: string | null
    notifications: Array<{ id: string; message: string; type: 'info' | 'warning' | 'error' }>
  }

  // Actions
  updatePlayerPosition: (playerId: string, x: number, y: number) => void
  addPlayer: (player: PlayerState) => void
  removePlayer: (playerId: string) => void
  setConnectionStatus: (isConnected: boolean) => void
  setRoomId: (roomId: string) => void
  toggleMenu: () => void
  setActivePanel: (panel: string | null) => void
  addNotification: (message: string, type: 'info' | 'warning' | 'error') => void
  removeNotification: (id: string) => void
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    game: {
      players: new Map(),
      isConnected: false,
      roomId: undefined
    },

    config: {
      enableAI: true,
      enableP2P: true,
      maxPlayers: 8,
      debugMode: __DEV__
    },

    ui: {
      isMenuOpen: false,
      activePanel: null,
      notifications: []
    },

    updatePlayerPosition: (playerId, x, y) =>
      set((state) => {
        const player = state.game.players.get(playerId)
        if (player) {
          player.position.x = x
          player.position.y = y
        }
      }),

    addPlayer: (player) =>
      set((state) => {
        state.game.players.set(player.id, player)
      }),

    removePlayer: (playerId) =>
      set((state) => {
        state.game.players.delete(playerId)
      }),

    setConnectionStatus: (isConnected) =>
      set((state) => {
        state.game.isConnected = isConnected
      }),

    setRoomId: (roomId) =>
      set((state) => {
        state.game.roomId = roomId
      }),

    toggleMenu: () =>
      set((state) => {
        state.ui.isMenuOpen = !state.ui.isMenuOpen
      }),

    setActivePanel: (panel) =>
      set((state) => {
        state.ui.activePanel = panel
      }),

    addNotification: (message, type) =>
      set((state) => {
        const id = Date.now().toString()
        state.ui.notifications.push({ id, message, type })
      }),

    removeNotification: (id) =>
      set((state) => {
        state.ui.notifications = state.ui.notifications.filter(n => n.id !== id)
      })
  }))
)

export class StateManager {
  private store = useAppStore

  constructor() {
    console.log('📊 State manager initialized')
  }

  getState() {
    return this.store.getState()
  }

  subscribe(callback: (state: AppState) => void) {
    return this.store.subscribe(callback)
  }
}