import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages quests and objectives
 */
export class QuestSystem extends System {
  private activeQuests: Map<string, any> = new Map();

  initialize(): void {
    this.eventBus.subscribe('item:obtained', (event) => this.checkItemObjectives(event.data));
    this.eventBus.subscribe('entity:killed', (event) => this.checkKillObjectives(event.data));
    this.eventBus.subscribe('player:entered_location', (event) => this.checkLocationObjectives(event.data));
  }

  update(context: SystemUpdateContext): void {
    // Check quest timeouts, etc.
  }

  /**
   * Start a quest
   */
  startQuest(playerId: string, questId: string): boolean {
    const quest = this.entityManager.query({ type: 'quest', where: e => e.id === questId })[0];
    if (!quest) return false;

    this.activeQuests.set(`${playerId}-${questId}`, {
      questId,
      playerId,
      startedAt: Date.now(),
      progress: {},
    });

    this.eventBus.emit('quest:started', { playerId, questId });
    return true;
  }

  /**
   * Complete a quest
   */
  completeQuest(playerId: string, questId: string): boolean {
    const key = `${playerId}-${questId}`;
    const questState = this.activeQuests.get(key);
    if (!questState) return false;

    // Grant rewards
    const quest = this.entityManager.query({ type: 'quest', where: e => e.id === questId })[0];
    if (quest?.components.quest?.rewards) {
      const rewards = quest.components.quest.rewards;
      const player = this.entityManager.get(playerId);
      if (player?.components.inventory) {
        if (rewards.gold) player.components.inventory.gold += rewards.gold;
        if (rewards.items) {
          rewards.items.forEach((itemId: string) => {
            player.components.inventory.items.push(itemId);
          });
        }
      }
    }

    this.activeQuests.delete(key);
    this.eventBus.emit('quest:completed', { playerId, questId });
    return true;
  }

  private checkItemObjectives(data: any): void {
    // Check if obtained item completes quest objectives
  }

  private checkKillObjectives(data: any): void {
    // Check if killing entity completes quest objectives
  }

  private checkLocationObjectives(data: any): void {
    // Check if visiting location completes quest objectives
  }
}
