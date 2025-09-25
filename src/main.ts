import { GameCore } from '@/core/GameCore'
import { WorkerManager } from '@/core/WorkerManager'
import { NetworkManager } from '@/systems/NetworkManager'
import '@/assets/styles/global.css'

class Application {
  private gameCore!: GameCore
  private workerManager!: WorkerManager
  private networkManager!: NetworkManager

  constructor() {
    this.initializeCore()
  }

  private async initializeCore(): Promise<void> {
    try {
      // Initialize core systems
      this.workerManager = new WorkerManager()
      this.networkManager = new NetworkManager()

      // Initialize game core
      this.gameCore = new GameCore({
        containerId: 'game-container',
        width: window.innerWidth,
        height: window.innerHeight,
      })

      // Start all systems
      await this.startSystems()

      // Hide loading screen
      this.hideLoadingScreen()

      console.log('🎮 Project Clockwork initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Project Clockwork:', error)
      this.showError(error as Error)
    }
  }

  private async startSystems(): Promise<void> {
    await Promise.all([
      this.workerManager.initialize(),
      this.networkManager.initialize(),
      this.gameCore.start()
    ])
  }

  private hideLoadingScreen(): void {
    const loading = document.getElementById('loading')
    if (loading) {
      loading.style.opacity = '0'
      loading.style.transition = 'opacity 0.5s ease-out'
      setTimeout(() => loading.remove(), 500)
    }
  }

  private showError(error: Error): void {
    const loading = document.getElementById('loading')
    if (loading) {
      loading.innerHTML = `
        <div style="color: #ff6b6b;">
          <h3>⚠️ Initialization Failed</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Retry
          </button>
        </div>
      `
    }
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Application()
})

// Handle window resize
window.addEventListener('resize', () => {
  // Game core will handle resize internally
  console.log('Window resized:', window.innerWidth, 'x', window.innerHeight)
})

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept()
}