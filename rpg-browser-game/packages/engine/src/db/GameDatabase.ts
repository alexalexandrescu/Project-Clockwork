import Dexie, { type EntityTable } from 'dexie';

/**
 * Entity stored in the database
 */
export interface DBEntity {
  id: string;
  type: string;
  components: Record<string, any>;
  updatedAt: number;
}

/**
 * Chat message in history
 */
export interface ChatMessage {
  id?: number;
  timestamp: number;
  type: 'user' | 'system' | 'npc' | 'event' | 'interpretation';
  speaker?: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Saved game state
 */
export interface SavedGame {
  id: string;
  timestamp: number;
  name: string;
  playerData: any;
  worldState: any;
}

/**
 * Quest state
 */
export interface QuestState {
  id: string;
  status: 'available' | 'active' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  objectives: Record<string, any>;
  progress: Record<string, number>;
}

/**
 * Relationship between entities
 */
export interface Relationship {
  id: string;
  entity1Id: string;
  entity2Id: string;
  type: 'reputation' | 'friendship' | 'rivalry' | 'romance' | 'family';
  value: number;
  history: Array<{
    timestamp: number;
    event: string;
    change: number;
  }>;
  updatedAt: number;
}

/**
 * Main game database using Dexie (IndexedDB wrapper)
 */
export class GameDatabase extends Dexie {
  entities!: EntityTable<DBEntity, 'id'>;
  chatHistory!: EntityTable<ChatMessage, 'id'>;
  saves!: EntityTable<SavedGame, 'id'>;
  quests!: EntityTable<QuestState, 'id'>;
  relationships!: EntityTable<Relationship, 'id'>;

  constructor() {
    super('EldoriaGameDB');
    
    this.version(1).stores({
      entities: 'id, type, [type+components.position.realm], [type+components.position.city], updatedAt',
      chatHistory: '++id, timestamp, type, speaker',
      saves: 'id, timestamp, name',
      quests: 'id, status, startedAt',
      relationships: 'id, [entity1Id+entity2Id], entity1Id, entity2Id, type, updatedAt'
    });
  }

  /**
   * Get all entities of a specific type
   */
  async getEntitiesByType(type: string): Promise<DBEntity[]> {
    return this.entities.where('type').equals(type).toArray();
  }

  /**
   * Get entities in a specific realm
   */
  async getEntitiesInRealm(type: string, realm: string): Promise<DBEntity[]> {
    return this.entities
      .where('[type+components.position.realm]')
      .equals([type, realm])
      .toArray();
  }

  /**
   * Get entities in a specific city
   */
  async getEntitiesInCity(type: string, city: string): Promise<DBEntity[]> {
    return this.entities
      .where('[type+components.position.city]')
      .equals([type, city])
      .toArray();
  }

  /**
   * Get recent chat messages
   */
  async getRecentChat(limit: number = 100): Promise<ChatMessage[]> {
    return this.chatHistory
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Add a chat message
   */
  async addChatMessage(message: Omit<ChatMessage, 'id'>): Promise<number> {
    return this.chatHistory.add({
      ...message,
      timestamp: message.timestamp || Date.now(),
    });
  }

  /**
   * Get relationship between two entities
   */
  async getRelationship(entity1Id: string, entity2Id: string): Promise<Relationship | undefined> {
    // Check both directions
    const rel1 = await this.relationships
      .where('[entity1Id+entity2Id]')
      .equals([entity1Id, entity2Id])
      .first();
    
    if (rel1) return rel1;
    
    const rel2 = await this.relationships
      .where('[entity1Id+entity2Id]')
      .equals([entity2Id, entity1Id])
      .first();
    
    return rel2;
  }

  /**
   * Update relationship between two entities
   */
  async updateRelationship(
    entity1Id: string,
    entity2Id: string,
    changes: Partial<Relationship>
  ): Promise<void> {
    const existing = await this.getRelationship(entity1Id, entity2Id);
    
    if (existing) {
      await this.relationships.update(existing.id, {
        ...changes,
        updatedAt: Date.now(),
      });
    } else {
      // Create new relationship
      const id = `${entity1Id}-${entity2Id}`;
      await this.relationships.add({
        id,
        entity1Id,
        entity2Id,
        type: changes.type || 'reputation',
        value: changes.value || 0,
        history: changes.history || [],
        updatedAt: Date.now(),
      });
    }
  }

  /**
   * Search entities by component values
   */
  async searchEntities(query: {
    type?: string;
    componentField?: string;
    componentValue?: any;
  }): Promise<DBEntity[]> {
    let collection = this.entities.toCollection();
    
    if (query.type) {
      collection = this.entities.where('type').equals(query.type);
    }
    
    const results = await collection.toArray();
    
    // Filter by component field if specified
    if (query.componentField && query.componentValue !== undefined) {
      const [component, ...fieldPath] = query.componentField.split('.');
      return results.filter(entity => {
        let value = entity.components[component];
        for (const field of fieldPath) {
          value = value?.[field];
        }
        return value === query.componentValue;
      });
    }
    
    return results;
  }

  /**
   * Bulk insert/update entities
   */
  async bulkPutEntities(entities: DBEntity[]): Promise<void> {
    await this.entities.bulkPut(entities);
  }

  /**
   * Clear all chat history
   */
  async clearChatHistory(): Promise<void> {
    await this.chatHistory.clear();
  }

  /**
   * Get active quests
   */
  async getActiveQuests(): Promise<QuestState[]> {
    return this.quests.where('status').equals('active').toArray();
  }

  /**
   * Get all saves
   */
  async getAllSaves(): Promise<SavedGame[]> {
    return this.saves.orderBy('timestamp').reverse().toArray();
  }
}

// Export singleton instance
export const db = new GameDatabase();
