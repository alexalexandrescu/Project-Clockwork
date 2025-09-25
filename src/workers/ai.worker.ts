import { WorkerMessage } from '@/types'

class AIWorker {

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this))
  }

  private handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { id, type, payload } = event.data

    switch (type) {
      case 'init':
        this.initialize()
        break
      case 'process-behavior':
        this.processBehavior(id, payload)
        break
      case 'analyze-pattern':
        this.analyzePattern(id, payload)
        break
      default:
        console.warn('Unknown AI worker message type:', type)
    }
  }

  private initialize(): void {
    this.postMessage({
      id: 'init-response',
      type: 'ready',
      payload: { message: 'AI worker initialized' },
      timestamp: Date.now()
    })
  }

  private processBehavior(messageId: string, data: unknown): void {
    // Simulate AI behavior processing
    setTimeout(() => {
      this.postMessage({
        id: messageId,
        type: 'behavior-result',
        payload: {
          result: 'behavior-processed',
          data: data
        },
        timestamp: Date.now()
      })
    }, 100)
  }

  private analyzePattern(messageId: string, data: unknown): void {
    // Simulate pattern analysis
    setTimeout(() => {
      this.postMessage({
        id: messageId,
        type: 'pattern-result',
        payload: {
          patterns: ['movement', 'interaction'],
          confidence: 0.85,
          data: data
        },
        timestamp: Date.now()
      })
    }, 200)
  }

  private postMessage(message: WorkerMessage): void {
    self.postMessage(message)
  }
}

// Initialize the worker
new AIWorker()