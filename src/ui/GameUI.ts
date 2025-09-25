import { useAppStore } from '@/core/StateManager'

export class GameUI {
  private container: HTMLElement
  private isInitialized = false

  constructor() {
    this.container = document.createElement('div')
    this.container.id = 'game-ui'
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: 'Inter', sans-serif;
    `

    document.body.appendChild(this.container)
    this.initialize()
  }

  private initialize(): void {
    this.createMainMenu()
    this.createNotificationSystem()
    this.setupStateSubscription()

    this.isInitialized = true
    console.log('🖥️ Game UI initialized')
  }

  private createMainMenu(): void {
    const menu = document.createElement('div')
    menu.id = 'main-menu'
    menu.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border-radius: 10px;
      padding: 30px;
      min-width: 300px;
      pointer-events: auto;
      display: none;
    `

    menu.innerHTML = `
      <h2 style="color: white; margin: 0 0 20px 0; text-align: center;">Project Clockwork</h2>
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <button id="host-room-btn" style="padding: 12px; background: #4ecdc4; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Host Room</button>
        <button id="join-room-btn" style="padding: 12px; background: #45b7d1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Join Room</button>
        <input id="room-id-input" type="text" placeholder="Enter Room ID" style="padding: 12px; border: 1px solid #666; border-radius: 5px; background: #333; color: white;">
        <button id="settings-btn" style="padding: 12px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Settings</button>
        <button id="close-menu-btn" style="padding: 12px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Close</button>
      </div>
    `

    this.container.appendChild(menu)
    this.setupMenuEvents()
  }

  private setupMenuEvents(): void {
    const hostBtn = document.getElementById('host-room-btn')
    const joinBtn = document.getElementById('join-room-btn')
    const roomInput = document.getElementById('room-id-input') as HTMLInputElement
    const settingsBtn = document.getElementById('settings-btn')
    const closeBtn = document.getElementById('close-menu-btn')

    hostBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('host-room'))
      this.hideMenu()
    })

    joinBtn?.addEventListener('click', () => {
      const roomId = roomInput?.value.trim()
      if (roomId) {
        window.dispatchEvent(new CustomEvent('join-room', { detail: { roomId } }))
        this.hideMenu()
      }
    })

    settingsBtn?.addEventListener('click', () => {
      console.log('Settings clicked - not implemented yet')
    })

    closeBtn?.addEventListener('click', () => {
      this.hideMenu()
    })
  }

  private createNotificationSystem(): void {
    const notifications = document.createElement('div')
    notifications.id = 'notifications'
    notifications.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: auto;
      max-width: 350px;
    `

    this.container.appendChild(notifications)
  }

  private setupStateSubscription(): void {
    // Subscribe to state changes
    useAppStore.subscribe((state) => {
      this.updateUI(state)
    })
  }

  private updateUI(state: any): void {
    // Update menu visibility
    const menu = document.getElementById('main-menu')
    if (menu) {
      menu.style.display = state.ui.isMenuOpen ? 'block' : 'none'
    }

    // Update notifications
    this.updateNotifications(state.ui.notifications)
  }

  private updateNotifications(notifications: Array<{ id: string; message: string; type: string }>): void {
    const container = document.getElementById('notifications')
    if (!container) return

    // Clear existing notifications
    container.innerHTML = ''

    // Add current notifications
    notifications.forEach(notification => {
      const element = document.createElement('div')
      element.style.cssText = `
        background: ${this.getNotificationColor(notification.type)};
        color: white;
        padding: 12px 16px;
        border-radius: 5px;
        animation: slideIn 0.3s ease-out;
        cursor: pointer;
      `
      element.textContent = notification.message

      element.addEventListener('click', () => {
        useAppStore.getState().removeNotification(notification.id)
      })

      container.appendChild(element)

      // Auto-remove after 5 seconds
      setTimeout(() => {
        useAppStore.getState().removeNotification(notification.id)
      }, 5000)
    })
  }

  private getNotificationColor(type: string): string {
    switch (type) {
      case 'error': return '#e74c3c'
      case 'warning': return '#f39c12'
      default: return '#4ecdc4'
    }
  }

  showMenu(): void {
    useAppStore.getState().toggleMenu()
  }

  hideMenu(): void {
    const state = useAppStore.getState()
    if (state.ui.isMenuOpen) {
      state.toggleMenu()
    }
  }

  addNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    useAppStore.getState().addNotification(message, type)
  }

  destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }
}