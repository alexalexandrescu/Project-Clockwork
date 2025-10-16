import type { EntityManager } from '../core/EntityManager.ts';
import type { EventBus } from '../core/EventBus.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Base class for all game systems
 * Systems contain game logic and operate on entities with specific components
 */
export abstract class System {
  protected entityManager: EntityManager;
  protected eventBus: EventBus;
  protected enabled: boolean = true;
  protected updateFrequency: number = 1; // Update every N ticks

  constructor(entityManager: EntityManager, eventBus: EventBus) {
    this.entityManager = entityManager;
    this.eventBus = eventBus;
  }

  /**
   * Initialize the system (called once after construction)
   */
  initialize(): void {
    // Override in subclasses
  }

  /**
   * Update the system (called every tick if frequency allows)
   */
  abstract update(context: SystemUpdateContext): void;

  /**
   * Cleanup the system (called before destruction)
   */
  cleanup(): void {
    // Override in subclasses
  }

  /**
   * Enable the system
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable the system (stops updates)
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if system is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set update frequency (1 = every tick, 2 = every other tick, etc.)
   */
  setUpdateFrequency(frequency: number): void {
    this.updateFrequency = Math.max(1, Math.floor(frequency));
  }

  /**
   * Get update frequency
   */
  getUpdateFrequency(): number {
    return this.updateFrequency;
  }

  /**
   * Get system name (for debugging)
   */
  getName(): string {
    return this.constructor.name;
  }
}
