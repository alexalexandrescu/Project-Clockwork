/**
 * CommandParser - Fallback text-based command parser
 *
 * Simple regex-based parser for when LLM is not available or for
 * deterministic command parsing.
 */

import type { GameContext, ParsedCommand, GameCommand } from './LLMCommandParser';

/**
 * Command aliases mapping
 */
const COMMAND_ALIASES: Record<string, GameCommand> = {
  go: 'move',
  walk: 'move',
  run: 'move',
  travel: 'move',

  examine: 'look',
  inspect: 'look',
  check: 'look',
  read: 'look',

  speak: 'talk',
  chat: 'talk',
  greet: 'talk',
  ask: 'talk',

  get: 'take',
  grab: 'take',
  pickup: 'take',
  pick: 'take',

  fight: 'attack',
  hit: 'attack',
  strike: 'attack',
  kill: 'attack',

  equip: 'use',
  consume: 'use',
  drink: 'use',
  eat: 'use',

  inv: 'inventory',
  items: 'inventory',
  bag: 'inventory',

  quest: 'quests',
  objectives: 'quests',
  missions: 'quests',

  group: 'party',
  team: 'party',
  allies: 'party',

  '?': 'help',
  h: 'help',
};

/**
 * Direction aliases
 */
const DIRECTION_ALIASES: Record<string, string> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  ne: 'northeast',
  nw: 'northwest',
  se: 'southeast',
  sw: 'southwest',
  u: 'up',
  d: 'down',
};

/**
 * CommandParser - Simple regex-based parser
 *
 * @example
 * ```typescript
 * const parser = new CommandParser();
 * const result = parser.parse("go north");
 * // { command: 'move', args: ['north'], confidence: 1.0, ... }
 *
 * const result2 = parser.parse("talk to innkeeper");
 * // { command: 'talk', args: ['innkeeper'], confidence: 0.9, ... }
 * ```
 */
export class CommandParser {
  /**
   * Parse text input into a structured command
   *
   * @param input - User's text input
   * @param context - Optional game context for enhanced parsing
   * @returns Parsed command
   */
  public parse(input: string, context?: GameContext): ParsedCommand {
    // Normalize input
    const normalized = input.trim().toLowerCase();

    if (!normalized) {
      return {
        command: 'unknown',
        args: [],
        confidence: 0,
        interpretation: 'Empty command',
      };
    }

    // Split into tokens
    const tokens = this.tokenize(normalized);

    if (tokens.length === 0) {
      return {
        command: 'unknown',
        args: [],
        confidence: 0,
        interpretation: 'No valid tokens',
      };
    }

    // Extract command and arguments
    const firstToken = tokens[0];
    let command = this.resolveCommand(firstToken);
    let args = tokens.slice(1);
    let confidence = 1.0;

    // Remove common filler words
    args = this.removeFillerWords(args);

    // Handle special cases
    if (command === 'move') {
      // Resolve direction aliases
      if (args.length > 0) {
        const direction = DIRECTION_ALIASES[args[0]] || args[0];
        args = [direction];
        confidence = 1.0;
      } else {
        confidence = 0.3; // Move without direction
      }
    } else if (command === 'look') {
      // Look can be without arguments (look around)
      confidence = args.length > 0 ? 0.95 : 1.0;
    } else if (command === 'talk') {
      // Try to match NPCs from context
      if (context?.nearbyNPCs && args.length > 0) {
        const targetName = args.join(' ');
        const matchedNPC = this.findBestMatch(
          targetName,
          context.nearbyNPCs.map((npc) => npc.name)
        );
        if (matchedNPC) {
          args = [matchedNPC];
          confidence = 0.95;
        }
      }
    } else if (command === 'take') {
      // Try to match items from context
      if (context?.nearbyItems && args.length > 0) {
        const targetName = args.join(' ');
        const matchedItem = this.findBestMatch(
          targetName,
          context.nearbyItems.map((item) => item.name)
        );
        if (matchedItem) {
          args = [matchedItem];
          confidence = 0.95;
        }
      }
    } else if (command === 'attack') {
      // Combine multi-word target names
      if (args.length > 1) {
        args = [args.join(' ')];
        confidence = 0.85;
      }
    } else if (command === 'use') {
      // Parse "use X on Y" pattern
      const onIndex = args.indexOf('on');
      if (onIndex > 0) {
        const item = args.slice(0, onIndex).join(' ');
        const target = args.slice(onIndex + 1).join(' ');
        args = target ? [item, target] : [item];
        confidence = 0.9;
      } else if (args.length > 1) {
        args = [args.join(' ')];
        confidence = 0.85;
      }
    } else if (['inventory', 'quests', 'party', 'save', 'load', 'help'].includes(command)) {
      // These commands typically don't need arguments
      confidence = args.length === 0 ? 1.0 : 0.8;
    }

    // Check if command was recognized
    if (command === 'unknown') {
      confidence = 0;
    }

    return {
      command,
      args,
      confidence,
      interpretation: this.buildInterpretation(command, args),
    };
  }

  /**
   * Tokenize input string
   */
  private tokenize(input: string): string[] {
    // Split on whitespace and filter empty strings
    return input
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  }

  /**
   * Resolve command from token (handle aliases)
   */
  private resolveCommand(token: string): GameCommand {
    // Check if it's a direct command
    const validCommands: GameCommand[] = [
      'move',
      'look',
      'talk',
      'take',
      'attack',
      'use',
      'inventory',
      'quests',
      'party',
      'save',
      'load',
      'help',
    ];

    if (validCommands.includes(token as GameCommand)) {
      return token as GameCommand;
    }

    // Check aliases
    if (token in COMMAND_ALIASES) {
      return COMMAND_ALIASES[token];
    }

    return 'unknown';
  }

  /**
   * Remove common filler words from arguments
   */
  private removeFillerWords(args: string[]): string[] {
    const fillers = new Set(['the', 'a', 'an', 'to', 'at', 'in', 'with']);
    return args.filter((arg) => !fillers.has(arg));
  }

  /**
   * Find best match from a list of candidates
   */
  private findBestMatch(
    target: string,
    candidates: string[]
  ): string | null {
    target = target.toLowerCase();

    // Exact match
    for (const candidate of candidates) {
      if (candidate.toLowerCase() === target) {
        return candidate;
      }
    }

    // Contains match
    for (const candidate of candidates) {
      if (candidate.toLowerCase().includes(target)) {
        return candidate;
      }
    }

    // Partial match (target contains part of candidate)
    for (const candidate of candidates) {
      const candidateLower = candidate.toLowerCase();
      if (target.includes(candidateLower)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Build human-readable interpretation
   */
  private buildInterpretation(command: GameCommand, args: string[]): string {
    if (command === 'unknown') {
      return 'Unknown command';
    }

    const interpretations: Record<GameCommand, string> = {
      move: args.length > 0 ? `Move ${args[0]}` : 'Move (direction not specified)',
      look: args.length > 0 ? `Examine ${args.join(' ')}` : 'Look around',
      talk: args.length > 0 ? `Talk to ${args.join(' ')}` : 'Talk (target not specified)',
      take: args.length > 0 ? `Take ${args.join(' ')}` : 'Take (item not specified)',
      attack: args.length > 0 ? `Attack ${args.join(' ')}` : 'Attack (target not specified)',
      use: args.length > 1 ? `Use ${args[0]} on ${args[1]}` : args.length > 0 ? `Use ${args[0]}` : 'Use (item not specified)',
      inventory: 'Show inventory',
      quests: 'Show quests',
      party: 'Show party',
      save: 'Save game',
      load: 'Load game',
      help: 'Show help',
      unknown: 'Unknown command',
    };

    return interpretations[command] || `${command} ${args.join(' ')}`;
  }

  /**
   * Parse multiple inputs in batch
   *
   * @param inputs - Array of user inputs
   * @param context - Shared game context
   * @returns Array of parsed commands
   */
  public parseBatch(
    inputs: string[],
    context?: GameContext
  ): ParsedCommand[] {
    return inputs.map((input) => this.parse(input, context));
  }

  /**
   * Get list of available commands
   */
  public getAvailableCommands(): string[] {
    return [
      'move',
      'look',
      'talk',
      'take',
      'attack',
      'use',
      'inventory',
      'quests',
      'party',
      'save',
      'load',
      'help',
    ];
  }

  /**
   * Get command aliases
   */
  public getAliases(command: GameCommand): string[] {
    return Object.entries(COMMAND_ALIASES)
      .filter(([_, cmd]) => cmd === command)
      .map(([alias]) => alias);
  }

  /**
   * Get help text for a command
   */
  public getCommandHelp(command: GameCommand): string {
    const helpText: Record<GameCommand, string> = {
      move: 'Move to a location. Usage: move <direction> (north, south, east, west, up, down)',
      look: 'Examine your surroundings or a specific target. Usage: look [target]',
      talk: 'Talk to an NPC. Usage: talk <npc name>',
      take: 'Pick up an item. Usage: take <item name>',
      attack: 'Attack a target. Usage: attack <target name>',
      use: 'Use an item. Usage: use <item> [on <target>]',
      inventory: 'Show your inventory. Usage: inventory',
      quests: 'Show active quests. Usage: quests',
      party: 'Show party members and status. Usage: party',
      save: 'Save the game. Usage: save',
      load: 'Load a saved game. Usage: load',
      help: 'Show help information. Usage: help [command]',
      unknown: 'Unknown command',
    };

    return helpText[command] || 'No help available';
  }
}
