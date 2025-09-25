import Phaser from 'phaser'
import { GameConfig } from '@/types'
import { MainScene } from '@/game/scenes/MainScene'
import { LoadingScene } from '@/game/scenes/LoadingScene'

export class GameCore {
  private game: Phaser.Game | null = null
  private config: GameConfig

  constructor(config: GameConfig) {
    this.config = config
  }

  async start(): Promise<void> {
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: this.config.width,
      height: this.config.height,
      parent: this.config.containerId,
      backgroundColor: '#1a1a1a',
      scene: [LoadingScene, MainScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: this.config.debug || false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        antialias: true,
        pixelArt: false
      }
    }

    this.game = new Phaser.Game(phaserConfig)

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.game) {
        this.game.scale.resize(window.innerWidth, window.innerHeight)
      }
    })

    console.log('🎮 Game core started')
  }

  destroy(): void {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
  }

  getGame(): Phaser.Game | null {
    return this.game
  }
}