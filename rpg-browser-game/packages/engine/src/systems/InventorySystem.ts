import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages entity inventories and item operations
 */
export class InventorySystem extends System {
  update(context: SystemUpdateContext): void {
    // Process inventory operations
  }

  /**
   * Add item to entity inventory
   */
  addItem(entityId: string, itemId: string): boolean {
    const entity = this.entityManager.get(entityId);
    if (!entity?.components.inventory) return false;

    const inventory = entity.components.inventory;
    if (inventory.items.length >= inventory.capacity) {
      this.eventBus.emit('inventory:full', { entityId });
      return false;
    }

    inventory.items.push(itemId);
    this.entityManager.update(entityId, { components: { ...entity.components, inventory } });
    this.eventBus.emit('inventory:item_added', { entityId, itemId });
    return true;
  }

  /**
   * Remove item from inventory
   */
  removeItem(entityId: string, itemId: string): boolean {
    const entity = this.entityManager.get(entityId);
    if (!entity?.components.inventory) return false;

    const inventory = entity.components.inventory;
    const index = inventory.items.indexOf(itemId);
    if (index === -1) return false;

    inventory.items.splice(index, 1);
    this.entityManager.update(entityId, { components: { ...entity.components, inventory } });
    this.eventBus.emit('inventory:item_removed', { entityId, itemId });
    return true;
  }

  /**
   * Use/consume an item
   */
  useItem(entityId: string, itemId: string): boolean {
    const item = this.entityManager.get(itemId);
    if (!item) return false;

    // Handle item effects
    if (item.components.effects?.onConsume) {
      const entity = this.entityManager.get(entityId);
      if (entity?.components.stats) {
        const effects = item.components.effects.onConsume;
        const stats = { ...entity.components.stats };
        if (effects.health) stats.health = Math.min(stats.maxHealth, stats.health + effects.health);
        if (effects.mana && stats.mana !== undefined) {
          stats.mana = Math.min(stats.maxMana || 100, stats.mana + effects.mana);
        }
        this.entityManager.update(entityId, { components: { ...entity.components, stats } });
      }
    }

    this.eventBus.emit('inventory:item_used', { entityId, itemId });
    
    // Remove consumables
    if (item.components.item?.itemType === 'consumable') {
      this.removeItem(entityId, itemId);
    }

    return true;
  }
}
