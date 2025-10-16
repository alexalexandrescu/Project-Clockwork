import type { GameEvent, EventCallback } from '../types/index.ts';

interface Subscription {
  callback: EventCallback;
  priority: number;
  once: boolean;
}

/**
 * Event bus for pub/sub pattern
 * Enables decoupled communication between systems
 */
export class EventBus {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private eventHistory: GameEvent[] = [];
  private maxHistorySize: number = 1000;

  /**
   * Subscribe to an event type
   * @param eventType - Type of event to listen for
   * @param callback - Function to call when event is emitted
   * @param priority - Higher priority callbacks are called first (default: 0)
   */
  subscribe(eventType: string, callback: EventCallback, priority: number = 0): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscription: Subscription = {
      callback,
      priority,
      once: false,
    };

    const subs = this.subscriptions.get(eventType)!;
    subs.push(subscription);
    
    // Sort by priority (highest first)
    subs.sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => {
      const index = subs.indexOf(subscription);
      if (index > -1) {
        subs.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to an event once - automatically unsubscribes after first call
   */
  once(eventType: string, callback: EventCallback, priority: number = 0): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscription: Subscription = {
      callback,
      priority,
      once: true,
    };

    const subs = this.subscriptions.get(eventType)!;
    subs.push(subscription);
    subs.sort((a, b) => b.priority - a.priority);

    return () => {
      const index = subs.indexOf(subscription);
      if (index > -1) {
        subs.splice(index, 1);
      }
    };
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: string, callback: EventCallback): void {
    const subs = this.subscriptions.get(eventType);
    if (!subs) return;

    const index = subs.findIndex(sub => sub.callback === callback);
    if (index > -1) {
      subs.splice(index, 1);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(eventType: string, data: any = {}, source?: string): void {
    const event: GameEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      source,
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Call subscribers
    const subs = this.subscriptions.get(eventType);
    if (!subs || subs.length === 0) return;

    // Create a copy to avoid issues if callbacks modify subscriptions
    const subsToCall = [...subs];

    for (const sub of subsToCall) {
      try {
        sub.callback(event);
      } catch (error) {
        console.error(`Error in event callback for ${eventType}:`, error);
      }

      // Remove "once" subscriptions
      if (sub.once) {
        const index = subs.indexOf(sub);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    }
  }

  /**
   * Get recent event history
   */
  getHistory(eventType?: string, limit?: number): GameEvent[] {
    let history = this.eventHistory;
    
    if (eventType) {
      history = history.filter(e => e.type === eventType);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get subscription count for debugging
   */
  getSubscriptionCount(eventType?: string): number {
    if (eventType) {
      return this.subscriptions.get(eventType)?.length || 0;
    }
    
    let total = 0;
    for (const subs of this.subscriptions.values()) {
      total += subs.length;
    }
    return total;
  }
}
