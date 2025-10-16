import { System } from './System.ts';
import { db } from '../db/GameDatabase.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages relationships between entities
 */
export class RelationshipSystem extends System {
  update(context: SystemUpdateContext): void {}

  async modifyReputation(entity1Id: string, entity2Id: string, change: number): Promise<void> {
    const rel = await db.getRelationship(entity1Id, entity2Id);
    const newValue = (rel?.value || 0) + change;
    
    await db.updateRelationship(entity1Id, entity2Id, {
      value: newValue,
      history: [
        ...(rel?.history || []),
        { timestamp: Date.now(), event: 'reputation_change', change },
      ],
    });
    
    this.eventBus.emit('relationship:changed', {
      entity1Id,
      entity2Id,
      oldValue: rel?.value || 0,
      newValue,
    });
  }

  async getReputation(entity1Id: string, entity2Id: string): Promise<number> {
    const rel = await db.getRelationship(entity1Id, entity2Id);
    return rel?.value || 0;
  }
}
