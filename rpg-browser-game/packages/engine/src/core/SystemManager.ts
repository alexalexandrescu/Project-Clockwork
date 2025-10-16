import type { System } from '../systems/System.ts';
import type { SystemPhase, SystemUpdateContext } from '../types/index.ts';

interface SystemRegistration {
  system: System;
  phase: SystemPhase;
  lastUpdate: number;
  updateCount: number;
  totalTime: number;
}

/**
 * Manages all game systems and orchestrates their updates
 */
export class SystemManager {
  private systems: Map<string, SystemRegistration> = new Map();
  private phases: SystemPhase[] = ['preUpdate', 'earlyUpdate', 'update', 'lateUpdate', 'postUpdate'];
  private tickCount: number = 0;

  /**
   * Register a system in a specific update phase
   */
  register(system: System, phase: SystemPhase = 'update'): void {
    const name = system.getName();
    
    if (this.systems.has(name)) {
      console.warn(`System ${name} is already registered. Replacing...`);
    }

    this.systems.set(name, {
      system,
      phase,
      lastUpdate: 0,
      updateCount: 0,
      totalTime: 0,
    });

    // Initialize the system
    system.initialize();

    console.log(`Registered system: ${name} in ${phase} phase`);
  }

  /**
   * Unregister a system
   */
  unregister(systemName: string): boolean {
    const registration = this.systems.get(systemName);
    if (!registration) return false;

    registration.system.cleanup();
    return this.systems.delete(systemName);
  }

  /**
   * Get a system by name
   */
  getSystem<T extends System>(systemName: string): T | undefined {
    return this.systems.get(systemName)?.system as T | undefined;
  }

  /**
   * Update all systems in their respective phases
   */
  update(context: SystemUpdateContext): void {
    this.tickCount++;

    for (const phase of this.phases) {
      this.updatePhase(phase, context);
    }
  }

  /**
   * Update all systems in a specific phase
   */
  private updatePhase(phase: SystemPhase, context: SystemUpdateContext): void {
    const systemsInPhase = Array.from(this.systems.values())
      .filter(reg => reg.phase === phase && reg.system.isEnabled());

    for (const registration of systemsInPhase) {
      const syst = registration.system;
      const frequency = syst.getUpdateFrequency();

      // Check if it's time to update based on frequency
      if (this.tickCount % frequency !== 0) {
        continue;
      }

      const startTime = performance.now();

      try {
        syst.update(context);
        registration.updateCount++;
      } catch (error) {
        console.error(`Error updating system:`, error);
      }

      const endTime = performance.now();
      registration.totalTime += endTime - startTime;
      registration.lastUpdate = this.tickCount;
    }
  }

  /**
   * Enable a system
   */
  enable(systemName: string): boolean {
    const registration = this.systems.get(systemName);
    if (!registration) return false;

    registration.system.enable();
    return true;
  }

  /**
   * Disable a system
   */
  disable(systemName: string): boolean {
    const registration = this.systems.get(systemName);
    if (!registration) return false;

    registration.system.disable();
    return true;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const stats = Array.from(this.systems.entries()).map(([name, reg]) => ({
      name,
      phase: reg.phase,
      enabled: reg.system.isEnabled(),
      updateCount: reg.updateCount,
      totalTime: reg.totalTime,
      avgTime: reg.updateCount > 0 ? reg.totalTime / reg.updateCount : 0,
      lastUpdate: reg.lastUpdate,
      frequency: reg.system.getUpdateFrequency(),
    }));

    return {
      totalSystems: this.systems.size,
      tickCount: this.tickCount,
      systems: stats,
    };
  }

  /**
   * Clear all systems
   */
  clear(): void {
    for (const registration of this.systems.values()) {
      registration.system.cleanup();
    }
    this.systems.clear();
    this.tickCount = 0;
  }

  /**
   * Get all registered system names
   */
  getSystemNames(): string[] {
    return Array.from(this.systems.keys());
  }
}
