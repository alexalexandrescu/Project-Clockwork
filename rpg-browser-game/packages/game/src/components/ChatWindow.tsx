import React, { useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { cn } from '../utils/cn';
import Box from './tui/Box';

/**
 * Message types for the chat window
 */
export type MessageType = 'user' | 'system' | 'npc' | 'event' | 'interpretation';

/**
 * Chat message interface
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Type of message for styling */
  type: MessageType;
  /** Speaker name (optional, for NPC messages) */
  speaker?: string;
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: number;
}

/**
 * Props for the ChatWindow component
 */
export interface ChatWindowProps {
  /** Array of chat messages to display */
  messages: ChatMessage[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get styling classes for different message types
 */
const getMessageStyles = (type: MessageType): string => {
  switch (type) {
    case 'user':
      return 'text-terminal-green-bright';
    case 'system':
      return 'text-terminal-yellow';
    case 'npc':
      return 'text-terminal-blue-bright';
    case 'event':
      return 'text-terminal-magenta';
    case 'interpretation':
      return 'text-terminal-cyan italic';
    default:
      return 'text-terminal-fg';
  }
};

/**
 * Get prefix for different message types
 */
const getMessagePrefix = (type: MessageType, speaker?: string): string => {
  switch (type) {
    case 'user':
      return '>';
    case 'system':
      return '[SYSTEM]';
    case 'npc':
      return speaker ? `[${speaker}]` : '[NPC]';
    case 'event':
      return '*';
    case 'interpretation':
      return '~';
    default:
      return '';
  }
};

/**
 * Virtual scrolled chat window component
 *
 * Displays game messages with virtual scrolling for performance.
 * Automatically scrolls to the bottom when new messages arrive.
 *
 * @example
 * ```tsx
 * <ChatWindow
 *   messages={[
 *     { id: '1', type: 'system', content: 'Welcome!', timestamp: Date.now() },
 *     { id: '2', type: 'npc', speaker: 'Guard', content: 'Halt!', timestamp: Date.now() }
 *   ]}
 * />
 * ```
 */
const ChatWindow: React.FC<ChatWindowProps> = ({ messages, className }) => {
  const listRef = useRef<List>(null);
  const prevMessageCountRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  /**
   * Render a single message row
   */
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    const styleClasses = getMessageStyles(message.type);
    const prefix = getMessagePrefix(message.type, message.speaker);

    // Format timestamp
    const time = new Date(message.timestamp);
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    return (
      <div style={style} className="px-4 py-1 font-mono text-sm">
        <div className="flex gap-2">
          {/* Timestamp */}
          <span className="text-terminal-fg-dim shrink-0">[{timeStr}]</span>

          {/* Message content */}
          <div className={cn('flex-1', styleClasses)}>
            {prefix && (
              <span className="font-bold mr-2">
                {prefix}
              </span>
            )}
            <span>{message.content}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Box title="Chat" variant="single" className={cn('h-full', className)}>
      <div className="h-full -mx-4 -my-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-terminal-fg-dim italic">
            No messages yet...
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={listRef}
                height={height}
                itemCount={messages.length}
                itemSize={32}
                width={width}
                overscanCount={5}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        )}
      </div>
    </Box>
  );
};

export default ChatWindow;
