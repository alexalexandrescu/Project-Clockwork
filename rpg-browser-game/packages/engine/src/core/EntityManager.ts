import type { Entity, EntityQuery } from '../types/index.ts';

/**
 * Manages all entities in the game world
 * Provides fast queries via indices
 */
export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  
  // Indices for fast queries
  private byType: Map<string, Set<string>> = new Map();
  private byRealm: Map<string, Set<string>> = new Map();
  private byCity: Map<string, Set<string>> = new Map();
  private byComponent: Map<string, Set<string>> = new Map();

  /**
   * Add an entity to the manager
   */
  add(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.updateIndices(entity);
  }

  /**
   * Get entity by ID
   */
  get(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Remove entity by ID
   */
  remove(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    this.removeFromIndices(entity);
    return this.entities.delete(id);
  }

  /**
   * Update entity (re-indexes automatically)
   */
  update(id: string, updates: Partial<Entity>): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    // Remove old indices
    this.removeFromIndices(entity);

    // Apply updates
    Object.assign(entity, updates);

    // Rebuild indices
    this.updateIndices(entity);

    return true;
  }

  /**
   * Query entities
   */
  query(query: EntityQuery): Entity[] {
    let results: Set<string> | undefined;

    // Start with most selective filter
    if (query.city) {
      results = this.byCity.get(query.city);
    } else if (query.realm) {
      results = this.byRealm.get(query.realm);
    } else if (query.type) {
      results = this.byType.get(query.type);
    } else if (query.hasComponent && query.hasComponent.length > 0) {
      results = this.byComponent.get(query.hasComponent[0]);
    }

    // If no initial filter, use all entities
    if (!results) {
      results = new Set(this.entities.keys());
    }

    // Apply additional filters
    let entities = Array.from(results).map(id => this.entities.get(id)!).filter(Boolean);

    if (query.type) {
      entities = entities.filter(e => e.type === query.type);
    }

    if (query.realm) {
      entities = entities.filter(e => e.components.position?.realm === query.realm);
    }

    if (query.city) {
      entities = entities.filter(e => e.components.position?.city === query.city);
    }

    if (query.hasComponent) {
      entities = entities.filter(e => 
        query.hasComponent!.every(comp => comp in e.components)
      );
    }

    if (query.where) {
      entities = entities.filter(query.where);
    }

    return entities;
  }

  /**
   * Get all entities (use sparingly)
   */
  getAll(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities by type (fast)
   */
  getByType(type: string): Entity[] {
    const ids = this.byType.get(type);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean);
  }

  /**
   * Get entities by component (fast)
   */
  getByComponent(componentName: string): Entity[] {
    const ids = this.byComponent.get(componentName);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean);
  }

  /**
   * Count entities
   */
  count(query?: EntityQuery): number {
    if (!query) return this.entities.size;
    return this.query(query).length;
  }

  /**
   * Update multiple entities
   */
  updateMany(ids: string[], updates: Partial<Entity>): number {
    let updated = 0;
    for (const id of ids) {
      if (this.update(id, updates)) {
        updated++;
      }
    }
    return updated;
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
    this.byType.clear();
    this.byRealm.clear();
    this.byCity.clear();
    this.byComponent.clear();
  }

  /**
   * Get statistics for debugging
   */
  getStats() {
    return {
      totalEntities: this.entities.size,
      types: Array.from(this.byType.entries()).map(([type, ids]) => ({
        type,
        count: ids.size,
      })),
      realms: this.byRealm.size,
      cities: this.byCity.size,
      indexedComponents: this.byComponent.size,
    };
  }

  // Private helper methods

  private updateIndices(entity: Entity): void {
    // Index by type
    if (!this.byType.has(entity.type)) {
      this.byType.set(entity.type, new Set());
    }
    this.byType.get(entity.type)!.add(entity.id);

    // Index by realm
    if (entity.components.position?.realm) {
      const realm = entity.components.position.realm;
      if (!this.byRealm.has(realm)) {
        this.byRealm.set(realm, new Set());
      }
      this.byRealm.get(realm)!.add(entity.id);
    }

    // Index by city
    if (entity.components.position?.city) {
      const city = entity.components.position.city;
      if (!this.byCity.has(city)) {
        this.byCity.set(city, new Set());
      }
      this.byCity.get(city)!.add(entity.id);
    }

    // Index by components
    for (const componentName of Object.keys(entity.components)) {
      if (!this.byComponent.has(componentName)) {
        this.byComponent.set(componentName, new Set());
      }
      this.byComponent.get(componentName)!.add(entity.id);
    }
  }

  private removeFromIndices(entity: Entity): void {
    // Remove from type index
    this.byType.get(entity.type)?.delete(entity.id);

    // Remove from realm index
    if (entity.components.position?.realm) {
      this.byRealm.get(entity.components.position.realm)?.delete(entity.id);
    }

    // Remove from city index
    if (entity.components.position?.city) {
      this.byCity.get(entity.components.position.city)?.delete(entity.id);
    }

    // Remove from component indices
    for (const componentName of Object.keys(entity.components)) {
      this.byComponent.get(componentName)?.delete(entity.id);
    }
  }
}
