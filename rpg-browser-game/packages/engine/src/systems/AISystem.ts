import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages NPC AI behavior
 */
export class AISystem extends System {
  update(context: SystemUpdateContext): void {
    const npcs = this.entityManager.query({ type: 'npc', hasComponent: ['ai'] });
    
    for (const npc of npcs) {
      const ai = npc.components.ai;
      
      switch (ai.state) {
        case 'idle':
          // Look for targets or patrol
          break;
        case 'pursuing':
          // Chase target
          break;
        case 'attacking':
          // Attack target
          break;
        case 'fleeing':
          // Run away
          break;
      }
    }
  }
}
