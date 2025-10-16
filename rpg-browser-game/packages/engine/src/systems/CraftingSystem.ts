import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages item crafting
 */
export class CraftingSystem extends System {
  update(context: SystemUpdateContext): void {}

  craftItem(crafterId: string, recipeId: string): boolean {
    const crafter = this.entityManager.get(crafterId);
    const recipe = this.entityManager.query({ 
      type: 'item', 
      hasComponent: ['craftable'],
      where: e => e.id === recipeId 
    })[0];
    
    if (!crafter || !recipe) return false;
    
    // Check materials
    const materials = recipe.components.craftable.recipe;
    for (const mat of materials) {
      if (!crafter.components.inventory.items.includes(mat.itemId)) {
        this.eventBus.emit('crafting:missing_materials', { crafterId, recipeId });
        return false;
      }
    }
    
    // Remove materials
    for (const mat of materials) {
      const idx = crafter.components.inventory.items.indexOf(mat.itemId);
      if (idx > -1) crafter.components.inventory.items.splice(idx, 1);
    }
    
    // Add crafted item
    crafter.components.inventory.items.push(recipeId);
    
    this.eventBus.emit('crafting:item_crafted', { crafterId, itemId: recipeId });
    return true;
  }
}
