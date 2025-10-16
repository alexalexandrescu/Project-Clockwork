/**
 * IO Module - Input/Output utilities for the game engine
 *
 * This module provides:
 * - BrowserLLM: WebLLM wrapper for in-browser AI
 * - LLMCommandParser: Natural language command parsing
 * - CommandParser: Fallback regex-based parsing
 * - OutputFormatter: Text formatting utilities
 */

export { BrowserLLM } from './BrowserLLM';
export type { LoadProgress, StreamChunkCallback } from './BrowserLLM';

export { LLMCommandParser } from './LLMCommandParser';
export type { GameCommand, ParsedCommand, GameContext } from './LLMCommandParser';

export { CommandParser } from './CommandParser';

export { OutputFormatter, BOX_CHARS, COLORS } from './OutputFormatter';
export type { StyleOptions } from './OutputFormatter';
