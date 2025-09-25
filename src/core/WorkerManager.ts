import { WorkerMessage, WorkerType } from '@/types'

interface WorkerInfo {
  worker: Worker
  isReady: boolean
  messageQueue: WorkerMessage[]
}

export class WorkerManager {
  private workers: Map<WorkerType, WorkerInfo> = new Map()
  private messageId = 0

  async initialize(): Promise<void> {
    const workerTypes: WorkerType[] = ['ai', 'database', 'network', 'processing']

    await Promise.all(
      workerTypes.map(type => this.createWorker(type))
    )

    console.log('👷 Worker manager initialized with', this.workers.size, 'workers')
  }

  private async createWorker(type: WorkerType): Promise<void> {
    try {
      const workerUrl = new URL(`../workers/${type}.worker.ts`, import.meta.url)
      const worker = new Worker(workerUrl, { type: 'module' })

      const workerInfo: WorkerInfo = {
        worker,
        isReady: false,
        messageQueue: []
      }

      worker.onmessage = (event) => {
        this.handleWorkerMessage(type, event.data)
      }

      worker.onerror = (error) => {
        console.error(`❌ Worker ${type} error:`, error)
      }

      this.workers.set(type, workerInfo)

      // Send initialization message
      this.sendMessage(type, 'init', {})

    } catch (error) {
      console.error(`❌ Failed to create ${type} worker:`, error)
    }
  }

  private handleWorkerMessage(workerType: WorkerType, message: WorkerMessage): void {
    const workerInfo = this.workers.get(workerType)
    if (!workerInfo) return

    if (message.type === 'ready') {
      workerInfo.isReady = true

      // Process queued messages
      while (workerInfo.messageQueue.length > 0) {
        const queuedMessage = workerInfo.messageQueue.shift()!
        workerInfo.worker.postMessage(queuedMessage)
      }

      console.log(`✅ ${workerType} worker ready`)
    } else {
      // Handle other message types
      this.handleWorkerResponse(workerType, message)
    }
  }

  private handleWorkerResponse(workerType: WorkerType, message: WorkerMessage): void {
    // Emit custom event for other systems to listen to
    window.dispatchEvent(
      new CustomEvent(`worker-${workerType}`, {
        detail: message
      })
    )
  }

  sendMessage<T = unknown>(
    workerType: WorkerType,
    type: string,
    payload: T
  ): string {
    const workerInfo = this.workers.get(workerType)
    if (!workerInfo) {
      console.error(`❌ Worker ${workerType} not found`)
      return ''
    }

    const message: WorkerMessage<T> = {
      id: (++this.messageId).toString(),
      type,
      payload,
      timestamp: Date.now()
    }

    if (workerInfo.isReady) {
      workerInfo.worker.postMessage(message)
    } else {
      workerInfo.messageQueue.push(message)
    }

    return message.id
  }

  terminate(workerType?: WorkerType): void {
    if (workerType) {
      const workerInfo = this.workers.get(workerType)
      if (workerInfo) {
        workerInfo.worker.terminate()
        this.workers.delete(workerType)
      }
    } else {
      // Terminate all workers
      for (const [, info] of this.workers) {
        info.worker.terminate()
      }
      this.workers.clear()
    }
  }
}