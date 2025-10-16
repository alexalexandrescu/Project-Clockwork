import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages dynamic economy
 */
export class EconomySystem extends System {
  update(context: SystemUpdateContext): void {}

  buyItem(buyerId: string, sellerId: string, itemId: string): boolean {
    const buyer = this.entityManager.get(buyerId);
    const seller = this.entityManager.get(sellerId);
    const item = this.entityManager.get(itemId);
    
    if (!buyer || !seller || !item) return false;
    
    const price = item.components.item?.value || 0;
    const priceModifier = seller.components.business?.priceModifier || 1.0;
    const finalPrice = Math.floor(price * priceModifier);
    
    if (buyer.components.inventory.gold < finalPrice) {
      this.eventBus.emit('economy:insufficient_funds', { buyerId, price: finalPrice });
      return false;
    }
    
    buyer.components.inventory.gold -= finalPrice;
    seller.components.inventory.gold += finalPrice;
    
    seller.components.business?.inventory?.splice(
      seller.components.business.inventory.indexOf(itemId), 1
    );
    buyer.components.inventory.items.push(itemId);
    
    this.eventBus.emit('economy:transaction', {
      buyerId,
      sellerId,
      itemId,
      price: finalPrice,
    });
    
    return true;
  }
}
