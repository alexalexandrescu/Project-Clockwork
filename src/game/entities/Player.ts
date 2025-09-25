import Phaser from 'phaser'

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite
  private scene: Phaser.Scene
  private id: string

  constructor(scene: Phaser.Scene, x: number, y: number, id: string = 'local-player') {
    this.scene = scene
    this.id = id

    // Create player sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player')
    this.sprite.setDisplaySize(32, 32)
    this.sprite.setTint(0x4ecdc4)

    // Set physics properties
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setDrag(500, 500)
    this.sprite.setMaxVelocity(300, 300)

    // Create visual representation
    this.createVisuals()
  }

  private createVisuals(): void {
    // Create a more detailed player visual
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(0x4ecdc4)
    graphics.fillCircle(0, 0, 16)
    graphics.lineStyle(2, 0xffffff)
    graphics.strokeCircle(0, 0, 16)

    // Add direction indicator
    graphics.fillStyle(0xffffff)
    graphics.fillCircle(0, -8, 3)

    // Attach to sprite
    graphics.x = this.sprite.x
    graphics.y = this.sprite.y

    // Make graphics follow the sprite
    this.scene.events.on('postupdate', () => {
      graphics.x = this.sprite.x
      graphics.y = this.sprite.y
    })
  }

  update(): void {
    // Update player logic here
    // This could include animation updates, state changes, etc.
  }

  setVelocity(x: number, y: number): void {
    this.sprite.setVelocity(x, y)
  }

  getPosition(): { x: number; y: number } {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    }
  }

  getId(): string {
    return this.id
  }

  destroy(): void {
    this.sprite.destroy()
  }
}