import React, { useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { Entity } from '@rpg/engine';
import { cn } from '../utils/cn';
import Box from './tui/Box';
import Button from './tui/Button';
import { useGameStore } from '../store/gameStore';

/**
 * Props for the InventoryPanel component
 */
export interface InventoryPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Item display interface
 */
interface ItemDisplay {
  id: string;
  name: string;
  type: string;
  weight: number;
  value: number;
  equipped: boolean;
  stackable: boolean;
  quantity: number;
}

/**
 * Inventory UI component with virtual scrolling
 *
 * Displays the player's inventory with item actions (use, drop, equip)
 * and weight/capacity tracking. Uses virtual scrolling for performance
 * with large inventories.
 *
 * @example
 * ```tsx
 * <InventoryPanel />
 * ```
 */
const InventoryPanel: React.FC<InventoryPanelProps> = ({ className }) => {
  const player = useGameStore((state) => state.player);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Get inventory items from player
  const items: ItemDisplay[] = player?.inventory?.map((item: any, index: number) => ({
    id: item.id || `item-${index}`,
    name: item.name || 'Unknown Item',
    type: item.type || 'misc',
    weight: item.weight || 0,
    value: item.value || 0,
    equipped: item.equipped || false,
    stackable: item.stackable || false,
    quantity: item.quantity || 1,
  })) || [];

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const capacity = player?.equipment?.backpack?.capacity || 50;
  const weightPercent = Math.round((totalWeight / capacity) * 100);

  // Get selected item
  const selectedItem = items.find((item) => item.id === selectedItemId);

  /**
   * Handle item action
   */
  const handleAction = (action: 'use' | 'drop' | 'equip', itemId: string) => {
    // TODO: Implement item actions through game engine
    console.log(`Action ${action} on item ${itemId}`);
  };

  /**
   * Render a single item row
   */
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    const isSelected = item.id === selectedItemId;

    return (
      <div
        style={style}
        className={cn(
          'px-2 py-1 cursor-pointer font-mono text-sm',
          'hover:bg-terminal-bg',
          'transition-colors',
          isSelected && 'bg-terminal-bg border-l-2 border-terminal-green'
        )}
        onClick={() => setSelectedItemId(item.id)}
      >
        <div className="flex items-center gap-2">
          {/* Equipment indicator */}
          <span className="shrink-0 w-4">
            {item.equipped && (
              <span className="text-terminal-green-bright">E</span>
            )}
          </span>

          {/* Item name */}
          <span className={cn(
            'flex-1 truncate',
            item.equipped ? 'text-terminal-green-bright' : 'text-terminal-fg-bright'
          )}>
            {item.name}
            {item.stackable && item.quantity > 1 && (
              <span className="text-terminal-fg-dim ml-1">x{item.quantity}</span>
            )}
          </span>

          {/* Weight */}
          <span className="text-terminal-fg-dim text-xs shrink-0">
            {(item.weight * item.quantity).toFixed(1)}kg
          </span>
        </div>
      </div>
    );
  };

  return (
    <Box
      title="Inventory"
      variant="single"
      footer={`Weight: ${totalWeight.toFixed(1)}/${capacity}kg (${weightPercent}%)`}
      className={cn('h-full flex flex-col', className)}
    >
      <div className="flex-1 -mx-4 -mt-4 mb-4 min-h-0">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-terminal-fg-dim italic">
            Inventory is empty
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={items.length}
                itemSize={32}
                width={width}
                overscanCount={3}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        )}
      </div>

      {/* Item actions */}
      {selectedItem && (
        <div className="space-y-2 pt-2 border-t border-terminal-fg">
          <div className="text-sm">
            <div className="text-terminal-fg-bright font-bold">{selectedItem.name}</div>
            <div className="text-terminal-fg text-xs mt-1">
              Type: {selectedItem.type} | Value: {selectedItem.value}g
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleAction('use', selectedItem.id)}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Use
            </Button>

            {!selectedItem.equipped && (
              <Button
                onClick={() => handleAction('equip', selectedItem.id)}
                variant="default"
                size="sm"
                className="flex-1"
              >
                Equip
              </Button>
            )}

            <Button
              onClick={() => handleAction('drop', selectedItem.id)}
              variant="default"
              size="sm"
              className="flex-1"
            >
              Drop
            </Button>
          </div>
        </div>
      )}

      {/* Weight warning */}
      {weightPercent > 90 && (
        <div className="mt-2 text-terminal-yellow text-xs italic">
          * You are heavily encumbered!
        </div>
      )}
    </Box>
  );
};

export default InventoryPanel;
