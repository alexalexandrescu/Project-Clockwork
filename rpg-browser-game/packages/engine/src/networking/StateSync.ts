/**
 * Synchronizes game state between peers
 * Host-authoritative model
 */
export class StateSync {
  private lastSyncTime: number = 0;
  private syncInterval: number = 100; // ms

  /**
   * Check if should sync
   */
  shouldSync(): boolean {
    const now = Date.now();
    if (now - this.lastSyncTime >= this.syncInterval) {
      this.lastSyncTime = now;
      return true;
    }
    return false;
  }

  /**
   * Create state delta for network transmission
   */
  createDelta(entities: any[]): any {
    return {
      timestamp: Date.now(),
      entities: entities.map(e => ({
        id: e.id,
        type: e.type,
        components: e.components,
      })),
    };
  }

  /**
   * Apply received delta to local state
   */
  applyDelta(delta: any, entityManager: any): void {
    for (const entityData of delta.entities) {
      const existing = entityManager.get(entityData.id);
      if (existing) {
        entityManager.update(entityData.id, {
          components: entityData.components,
        });
      } else {
        entityManager.add(entityData);
      }
    }
  }

  /**
   * Set sync interval
   */
  setSyncInterval(ms: number): void {
    this.syncInterval = ms;
  }
}
