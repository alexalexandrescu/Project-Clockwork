import Phaser from 'phaser'

export class LoadingScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text
  private progressBar!: Phaser.GameObjects.Graphics
  private progressBox!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'LoadingScene' })
  }

  preload(): void {
    this.createLoadingUI()
    this.loadAssets()
    this.setupLoadEvents()
  }

  private createLoadingUI(): void {
    const { width, height } = this.scale

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Progress bar background
    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222222)
    this.progressBox.fillRect(width / 2 - 160, height / 2, 320, 50)

    // Progress bar
    this.progressBar = this.add.graphics()
  }

  private loadAssets(): void {
    // Create placeholder assets (1x1 pixel images)
    this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
    this.load.image('ground', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')

    // Load any other assets here
    // this.load.image('background', '/assets/sprites/background.png')
    // this.load.spritesheet('character', '/assets/sprites/character.png', { frameWidth: 32, frameHeight: 32 })
  }

  private setupLoadEvents(): void {
    this.load.on('progress', (value: number) => {
      const { width, height } = this.scale

      this.progressBar.clear()
      this.progressBar.fillStyle(0x00ff00)
      this.progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30)

      this.loadingText.setText(`Loading... ${Math.round(value * 100)}%`)
    })

    this.load.on('complete', () => {
      this.loadingText.setText('Complete!')
      this.time.delayedCall(500, () => {
        this.scene.start('MainScene')
      })
    })
  }
}