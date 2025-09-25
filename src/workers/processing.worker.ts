import { WorkerMessage } from '@/types'

class ProcessingWorker {
  private taskQueue: Array<{ id: string; task: () => Promise<unknown> }> = []
  private isProcessing = false

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this))
  }

  private handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { id, type, payload } = event.data

    switch (type) {
      case 'init':
        this.initialize()
        break
      case 'process-calculations':
        this.processCalculations(id, payload as { calculations: { type: string; params: unknown }[] })
        break
      case 'optimize-path':
        this.optimizePath(id, payload as { start: { x: number; y: number }; end: { x: number; y: number }; obstacles: { x: number; y: number; radius: number }[] })
        break
      case 'compress-data':
        this.compressData(id, payload as { data: unknown; algorithm: string })
        break
      case 'generate-noise':
        this.generateNoise(id, payload as { width: number; height: number; scale: number })
        break
      default:
        console.warn('Unknown processing worker message type:', type)
    }
  }

  private initialize(): void {

    this.postMessage({
      id: 'init-response',
      type: 'ready',
      payload: { message: 'Processing worker initialized' },
      timestamp: Date.now()
    })

    this.startTaskProcessor()
  }

  private startTaskProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.taskQueue.length > 0) {
        this.processNextTask()
      }
    }, 10)
  }

  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) return

    this.isProcessing = true
    const { id, task } = this.taskQueue.shift()!

    try {
      const result = await task()
      this.postMessage({
        id,
        type: 'task-completed',
        payload: { success: true, result },
        timestamp: Date.now()
      })
    } catch (error) {
      this.postMessage({
        id,
        type: 'task-completed',
        payload: { success: false, error },
        timestamp: Date.now()
      })
    }

    this.isProcessing = false
  }

  private processCalculations(messageId: string, data: { calculations: Array<{ type: string; params: unknown }> }): void {
    this.taskQueue.push({
      id: messageId,
      task: async () => {
        const results = []

        for (const calc of data.calculations) {
          switch (calc.type) {
            case 'matrix-multiply':
              results.push(this.matrixMultiply(calc.params as any))
              break
            case 'distance':
              results.push(this.calculateDistance(calc.params as any))
              break
            case 'collision':
              results.push(this.checkCollision(calc.params as any))
              break
            default:
              results.push(null)
          }
        }

        return { type: 'calculations-result', results }
      }
    })
  }

  private optimizePath(messageId: string, data: { start: { x: number; y: number }; end: { x: number; y: number }; obstacles: Array<{ x: number; y: number; radius: number }> }): void {
    this.taskQueue.push({
      id: messageId,
      task: async () => {
        // Simple A* pathfinding simulation
        await this.delay(50) // Simulate processing time

        const path = [
          data.start,
          { x: (data.start.x + data.end.x) / 2, y: (data.start.y + data.end.y) / 2 },
          data.end
        ]

        return { type: 'path-optimized', path }
      }
    })
  }

  private compressData(messageId: string, data: { data: unknown; algorithm: string }): void {
    this.taskQueue.push({
      id: messageId,
      task: async () => {
        await this.delay(100) // Simulate compression time

        const original = JSON.stringify(data.data)
        const compressed = btoa(original) // Simple base64 "compression"

        return {
          type: 'data-compressed',
          originalSize: original.length,
          compressedSize: compressed.length,
          compressionRatio: compressed.length / original.length,
          data: compressed
        }
      }
    })
  }

  private generateNoise(messageId: string, data: { width: number; height: number; scale: number }): void {
    this.taskQueue.push({
      id: messageId,
      task: async () => {
        const noise = []

        for (let y = 0; y < data.height; y++) {
          const row = []
          for (let x = 0; x < data.width; x++) {
            // Simple noise generation
            row.push(Math.sin(x * data.scale) * Math.cos(y * data.scale))
          }
          noise.push(row)
        }

        return { type: 'noise-generated', noise, dimensions: { width: data.width, height: data.height } }
      }
    })
  }

  private matrixMultiply(params: { a: number[][]; b: number[][] }): number[][] {
    const { a, b } = params
    const result: number[][] = []

    for (let i = 0; i < a.length; i++) {
      result[i] = []
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0
        for (let k = 0; k < b.length; k++) {
          sum += a[i][k] * b[k][j]
        }
        result[i][j] = sum
      }
    }

    return result
  }

  private calculateDistance(params: { p1: { x: number; y: number }; p2: { x: number; y: number } }): number {
    const { p1, p2 } = params
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  private checkCollision(params: { rect1: { x: number; y: number; width: number; height: number }; rect2: { x: number; y: number; width: number; height: number } }): boolean {
    const { rect1, rect2 } = params

    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private postMessage(message: WorkerMessage): void {
    self.postMessage(message)
  }
}

// Initialize the worker
new ProcessingWorker()