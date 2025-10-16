import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages NPC daily schedules
 */
export class NPCScheduleSystem extends System {
  initialize(): void {
    this.eventBus.subscribe('time:hour_changed', (event) => this.updateSchedules(event.data.hour));
  }

  update(context: SystemUpdateContext): void {}

  private updateSchedules(hour: number): void {
    const npcs = this.entityManager.query({ type: 'npc', hasComponent: ['schedule'] });
    
    for (const npc of npcs) {
      const schedule = npc.components.schedule;
      const activity = schedule.activities.find((a: any) => a.hour === hour);
      
      if (activity) {
        schedule.currentActivity = activity.action;
        
        if (activity.location) {
          this.eventBus.emit('movement:requested', {
            entityId: npc.id,
            destination: activity.location,
          });
        }
        
        this.eventBus.emit('npc:activity_changed', {
          npcId: npc.id,
          activity: activity.action,
        });
      }
    }
  }
}
