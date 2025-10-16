import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages NPC dialogues
 */
export class DialogueSystem extends System {
  update(context: SystemUpdateContext): void {}

  startConversation(playerId: string, npcId: string): string {
    const npc = this.entityManager.get(npcId);
    if (!npc?.components.dialogue) return 'The NPC has nothing to say.';
    
    this.eventBus.emit('dialogue:started', { playerId, npcId });
    return npc.components.dialogue.greeting || 'Hello.';
  }

  getResponse(npcId: string, topic: string): string {
    const npc = this.entityManager.get(npcId);
    if (!npc?.components.dialogue) return 'I don\'t understand.';
    
    const conversation = npc.components.dialogue.conversations?.[topic];
    if (conversation) {
      this.eventBus.emit('dialogue:response', { npcId, topic });
      return conversation.response;
    }
    
    return 'I don\'t know about that.';
  }

  endConversation(playerId: string, npcId: string): string {
    const npc = this.entityManager.get(npcId);
    this.eventBus.emit('dialogue:ended', { playerId, npcId });
    return npc?.components.dialogue?.farewell || 'Goodbye.';
  }
}
