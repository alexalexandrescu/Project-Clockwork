import type { SystemUpdateContext } from '../types/index.ts';

type GameLoopCallback = (context: SystemUpdateContext) => void;

/**
 * Fixed timestep game loop using RequestAnimationFrame
 * Ensures consistent physics/logic updates regardless of framerate
 */
export class GameLoop {
  private callback: GameLoopCallback;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  // Fixed timestep settings
  private readonly targetFPS: number = 60;
  private readonly fixedDeltaTime: number;
  private readonly maxAccumulator: number;

  // Loop state
  private lastTime: number = 0;
  private accumulator: number = 0;
  private totalTime: number = 0;
  private tickCount: number = 0;

  // Performance tracking
  private frameCount: number = 0;
  private fpsLastUpdate: number = 0;
  private currentFPS: number = 0;

  constructor(callback: GameLoopCallback, targetFPS: number = 60) {
    this.callback = callback;
    this.targetFPS = targetFPS;
    this.fixedDeltaTime = 1000 / targetFPS; // ms per frame
    this.maxAccumulator = this.fixedDeltaTime * 10; // Prevent spiral of death
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('GameLoop is already running');
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.totalTime = 0;
    this.tickCount = 0;
    this.frameCount = 0;
    this.fpsLastUpdate = this.lastTime;

    console.log('GameLoop started');
    this.loop(this.lastTime);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('GameLoop stopped');
  }

  /**
   * Main loop function (called by RAF)
   */
  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame((time) => this.loop(time));

    // Calculate delta time
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Add to accumulator (clamped to prevent spiral of death)
    this.accumulator += Math.min(deltaTime, this.maxAccumulator);

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDeltaTime) {
      const context: SystemUpdateContext = {
        deltaTime: this.fixedDeltaTime,
        totalTime: this.totalTime,
        tickCount: this.tickCount,
      };

      try {
        this.callback(context);
      } catch (error) {
        console.error('Error in game loop callback:', error);
      }

      this.accumulator -= this.fixedDeltaTime;
      this.totalTime += this.fixedDeltaTime;
      this.tickCount++;
    }

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsLastUpdate >= 1000) {
      this.currentFPS = Math.round(
        (this.frameCount * 1000) / (currentTime - this.fpsLastUpdate)
      );
      this.frameCount = 0;
      this.fpsLastUpdate = currentTime;
    }
  }

  /**
   * Check if loop is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.currentFPS;
  }

  /**
   * Get total ticks
   */
  getTickCount(): number {
    return this.tickCount;
  }

  /**
   * Get total time (in ms)
   */
  getTotalTime(): number {
    return this.totalTime;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      targetFPS: this.targetFPS,
      currentFPS: this.currentFPS,
      tickCount: this.tickCount,
      totalTime: this.totalTime,
      accumulator: this.accumulator,
    };
  }
}
