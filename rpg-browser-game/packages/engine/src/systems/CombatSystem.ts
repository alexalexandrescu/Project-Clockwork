import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages combat
 */
export class CombatSystem extends System {
  update(context: SystemUpdateContext): void {}

  attack(attackerId: string, targetId: string): boolean {
    const attacker = this.entityManager.get(attackerId);
    const target = this.entityManager.get(targetId);
    
    if (!attacker || !target) return false;
    
    const damage = (attacker.components.combat?.attackPower || 10) - 
                   (target.components.combat?.defense || 0);
    const finalDamage = Math.max(1, damage);
    
    if (target.components.stats) {
      target.components.stats.health -= finalDamage;
      this.entityManager.update(targetId, target);
      
      this.eventBus.emit('combat:hit', {
        attackerId,
        targetId,
        damage: finalDamage,
      });
      
      if (target.components.stats.health <= 0) {
        this.eventBus.emit('entity:killed', {
          victimId: targetId,
          killerId: attackerId,
        });
      }
    }
    
    return true;
  }
}
