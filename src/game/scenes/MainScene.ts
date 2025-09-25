import Phaser from 'phaser'
import { Player } from '@/game/entities/Player'
import { useAppStore } from '@/core/StateManager'

export class MainScene extends Phaser.Scene {
  private player!: Player
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key }
  private camera!: Phaser.Cameras.Scene2D.Camera
  private worldSize = { width: 2000, height: 2000 }

  constructor() {
    super({ key: 'MainScene' })
  }

  create(): void {
    this.setupWorld()
    this.setupPlayer()
    this.setupControls()
    this.setupCamera()
    this.setupUI()

    console.log('🎮 Main scene created')
  }

  private setupWorld(): void {
    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldSize.width, this.worldSize.height)

    // Create a simple grid background
    const graphics = this.add.graphics()
    graphics.lineStyle(1, 0x333333, 0.5)

    const gridSize = 50
    for (let x = 0; x <= this.worldSize.width; x += gridSize) {
      graphics.moveTo(x, 0)
      graphics.lineTo(x, this.worldSize.height)
    }

    for (let y = 0; y <= this.worldSize.height; y += gridSize) {
      graphics.moveTo(0, y)
      graphics.lineTo(this.worldSize.width, y)
    }

    graphics.strokePath()

    // Add some visual landmarks
    const center = this.add.circle(this.worldSize.width / 2, this.worldSize.height / 2, 20, 0xff6b6b)
    center.setStrokeStyle(2, 0xffffff)

    const corners = [
      { x: 100, y: 100 },
      { x: this.worldSize.width - 100, y: 100 },
      { x: 100, y: this.worldSize.height - 100 },
      { x: this.worldSize.width - 100, y: this.worldSize.height - 100 }
    ]

    corners.forEach((corner, index) => {
      const marker = this.add.circle(corner.x, corner.y, 15, 0x4ecdc4)
      marker.setStrokeStyle(2, 0xffffff)
      this.add.text(corner.x, corner.y - 30, `Corner ${index + 1}`, {
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5)
    })
  }

  private setupPlayer(): void {
    const startX = this.worldSize.width / 2
    const startY = this.worldSize.height / 2

    this.player = new Player(this, startX, startY)
  }

  private setupControls(): void {
    // Arrow keys
    this.cursors = this.input.keyboard!.createCursorKeys()

    // WASD keys
    this.wasdKeys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }

    // ESC key for menu
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      useAppStore.getState().toggleMenu()
    })
  }

  private setupCamera(): void {
    this.camera = this.cameras.main
    this.camera.startFollow(this.player.sprite)
    this.camera.setBounds(0, 0, this.worldSize.width, this.worldSize.height)
    this.camera.setZoom(1)

    // Smooth camera follow
    this.camera.setLerp(0.1, 0.1)
  }

  private setupUI(): void {
    // Fixed UI elements that don't move with the camera
    const uiContainer = this.add.container(0, 0)
    uiContainer.setScrollFactor(0)

    // Debug info
    const debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0)

    // Update debug info every frame
    this.events.on('postupdate', () => {
      debugText.setText([
        `Position: ${Math.round(this.player.sprite.x)}, ${Math.round(this.player.sprite.y)}`,
        `Camera: ${Math.round(this.camera.scrollX)}, ${Math.round(this.camera.scrollY)}`,
        `FPS: ${Math.round(this.game.loop.actualFps)}`
      ])
    })
  }

  update(): void {
    this.player.update()
    this.handleInput()
  }

  private handleInput(): void {
    const speed = 200

    let velocityX = 0
    let velocityY = 0

    // Check arrow keys and WASD
    if (this.cursors.left.isDown || this.wasdKeys.a.isDown) {
      velocityX = -speed
    } else if (this.cursors.right.isDown || this.wasdKeys.d.isDown) {
      velocityX = speed
    }

    if (this.cursors.up.isDown || this.wasdKeys.w.isDown) {
      velocityY = -speed
    } else if (this.cursors.down.isDown || this.wasdKeys.s.isDown) {
      velocityY = speed
    }

    this.player.setVelocity(velocityX, velocityY)

    // Update state manager with player position
    if (velocityX !== 0 || velocityY !== 0) {
      useAppStore.getState().updatePlayerPosition('local-player', this.player.sprite.x, this.player.sprite.y)
    }
  }
}