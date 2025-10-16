import React, { useState, useEffect, useCallback } from 'react';
import type { GameEvent } from '@rpg/engine';
import { cn } from '../utils/cn';
import { useGameStore } from '../store/gameStore';
import Box from './tui/Box';
import Input from './tui/Input';
import StatusBar from './tui/StatusBar';
import ChatWindow, { ChatMessage, MessageType } from './ChatWindow';
import InventoryPanel from './InventoryPanel';
import QuestPanel from './QuestPanel';
import PartyPanel from './PartyPanel';

/**
 * Props for the Game component
 */
export interface GameProps {
  /** Callback when a command is submitted */
  onCommandSubmit?: (command: string) => void;
  /** Game event bus subscription (optional) */
  eventBus?: {
    on: (eventType: string, callback: (event: GameEvent) => void) => void;
    off: (eventType: string, callback: (event: GameEvent) => void) => void;
  };
}

/**
 * Main game layout component
 *
 * Provides the complete game UI with:
 * - Header with title and status bar
 * - Main chat area
 * - Toggleable side panels (Inventory, Quests, Party)
 * - Command input footer
 * - Keyboard shortcuts (F1-F3 for panels)
 *
 * @example
 * ```tsx
 * <Game
 *   onCommandSubmit={(cmd) => handleCommand(cmd)}
 *   eventBus={gameWorld.eventBus}
 * />
 * ```
 */
const Game: React.FC<GameProps> = ({ onCommandSubmit, eventBus }) => {
  const player = useGameStore((state) => state.player);
  const gameTime = useGameStore((state) => state.gameTime);
  const showInventory = useGameStore((state) => state.showInventory);
  const showQuests = useGameStore((state) => state.showQuests);
  const showParty = useGameStore((state) => state.showParty);
  const toggleInventory = useGameStore((state) => state.toggleInventory);
  const toggleQuests = useGameStore((state) => state.toggleQuests);
  const toggleParty = useGameStore((state) => state.toggleParty);

  const [command, setCommand] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /**
   * Handle command submission
   */
  const handleSubmit = useCallback(() => {
    if (command.trim()) {
      // Add user message to chat
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        type: 'user',
        content: command,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Call the callback
      if (onCommandSubmit) {
        onCommandSubmit(command);
      }

      // Clear input
      setCommand('');
    }
  }, [command, onCommandSubmit]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Toggle Inventory
      if (e.key === 'F1') {
        e.preventDefault();
        toggleInventory();
      }
      // F2 - Toggle Quests
      else if (e.key === 'F2') {
        e.preventDefault();
        toggleQuests();
      }
      // F3 - Toggle Party
      else if (e.key === 'F3') {
        e.preventDefault();
        toggleParty();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInventory, toggleQuests, toggleParty]);

  /**
   * Subscribe to game events
   */
  useEffect(() => {
    if (!eventBus) return;

    const handleGameEvent = (event: GameEvent) => {
      // Map game events to chat messages
      let messageType: MessageType = 'system';
      let content = '';
      let speaker: string | undefined;

      switch (event.type) {
        case 'npc.speak':
          messageType = 'npc';
          speaker = event.data.npc?.name || 'NPC';
          content = event.data.message || '';
          break;

        case 'player.action':
          messageType = 'interpretation';
          content = event.data.interpretation || event.data.action || '';
          break;

        case 'combat.start':
        case 'combat.end':
        case 'quest.complete':
        case 'quest.start':
          messageType = 'event';
          content = event.data.message || `Event: ${event.type}`;
          break;

        case 'system.message':
          messageType = 'system';
          content = event.data.message || '';
          break;

        default:
          // Ignore unknown events
          return;
      }

      if (content) {
        const chatMessage: ChatMessage = {
          id: `msg-${event.timestamp}-${event.type}`,
          type: messageType,
          speaker,
          content,
          timestamp: event.timestamp,
        };

        setMessages((prev) => [...prev, chatMessage]);
      }
    };

    // Subscribe to relevant event types
    const eventTypes = [
      'npc.speak',
      'player.action',
      'combat.start',
      'combat.end',
      'quest.complete',
      'quest.start',
      'system.message',
    ];

    eventTypes.forEach((type) => {
      eventBus.on(type, handleGameEvent);
    });

    // Cleanup
    return () => {
      eventTypes.forEach((type) => {
        eventBus.off(type, handleGameEvent);
      });
    };
  }, [eventBus]);

  /**
   * Add welcome message on mount
   */
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'msg-welcome',
      type: 'system',
      content: 'Welcome to Terminal Quest! Type commands to interact with the world.',
      timestamp: Date.now(),
    };

    setMessages([welcomeMessage]);
  }, []);

  /**
   * Format game time for display
   */
  const formatGameTime = (time: number): string => {
    const hours = Math.floor(time % 24);
    const days = Math.floor(time / 24);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `Day ${days + 1}, ${displayHours}:00 ${period}`;
  };

  /**
   * Get status bar stats
   */
  const getStats = () => {
    if (!player) {
      return [{ label: 'Status', value: 0, color: 'text-terminal-fg-dim' }];
    }

    return [
      { label: 'HP', value: player.health, max: player.maxHealth },
      { label: 'MP', value: player.mana, max: player.maxMana },
      { label: 'Level', value: player.level },
      { label: 'Gold', value: player.gold, color: 'text-terminal-yellow-bright' },
      { label: 'Time', value: formatGameTime(gameTime), color: 'text-terminal-cyan' } as any,
    ];
  };

  // Count active panels
  const activePanels = [showInventory, showQuests, showParty].filter(Boolean).length;

  return (
    <div className="flex flex-col h-screen bg-terminal-bg text-terminal-fg font-mono">
      {/* Header */}
      <header className="shrink-0 border-b-2 border-terminal-fg">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-terminal-green-bright">
              TERMINAL QUEST
            </h1>
            <div className="text-sm text-terminal-fg-dim">
              {player?.name || 'Guest'}
            </div>
          </div>
          <StatusBar stats={getStats()} />
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex min-h-0">
        {/* Chat window */}
        <div className={cn(
          'flex-1 p-4 min-w-0',
          activePanels > 0 && 'border-r border-terminal-fg'
        )}>
          <ChatWindow messages={messages} className="h-full" />
        </div>

        {/* Side panels */}
        {activePanels > 0 && (
          <aside className={cn(
            'shrink-0 p-4 flex gap-4',
            activePanels === 1 && 'w-80',
            activePanels === 2 && 'w-[40rem]',
            activePanels === 3 && 'w-[60rem]'
          )}>
            {showInventory && (
              <div className="flex-1 min-w-0">
                <InventoryPanel className="h-full" />
              </div>
            )}
            {showQuests && (
              <div className="flex-1 min-w-0">
                <QuestPanel className="h-full" />
              </div>
            )}
            {showParty && (
              <div className="flex-1 min-w-0">
                <PartyPanel className="h-full" />
              </div>
            )}
          </aside>
        )}
      </main>

      {/* Footer with input */}
      <footer className="shrink-0 border-t-2 border-terminal-fg">
        <div className="p-4">
          <Input
            value={command}
            onChange={setCommand}
            onSubmit={handleSubmit}
            placeholder="Enter command... (F1: Inventory, F2: Quests, F3: Party)"
            disabled={!player}
          />

          {/* Help text */}
          <div className="mt-2 text-xs text-terminal-fg-dim flex items-center justify-between">
            <span>Type 'help' for available commands</span>
            <span>
              F1: {showInventory ? '✓' : '○'} Inventory |
              F2: {showQuests ? '✓' : '○'} Quests |
              F3: {showParty ? '✓' : '○'} Party
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Game;
