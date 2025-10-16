/**
 * LLMCommandParser - Natural language to structured game commands
 *
 * Uses the BrowserLLM to parse natural language input into structured
 * game commands with context awareness.
 */

import { BrowserLLM } from './BrowserLLM';
import type { Entity, PositionComponent, IdentityComponent } from '../types';

/**
 * Supported game commands
 */
export type GameCommand =
  | 'move'
  | 'look'
  | 'talk'
  | 'take'
  | 'attack'
  | 'use'
  | 'inventory'
  | 'quests'
  | 'party'
  | 'save'
  | 'load'
  | 'help'
  | 'unknown';

/**
 * Parsed command result
 */
export interface ParsedCommand {
  /** The primary command */
  command: GameCommand;
  /** Command arguments */
  args: string[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Human-readable interpretation */
  interpretation: string;
}

/**
 * Game context for command parsing
 */
export interface GameContext {
  /** Player's current location */
  location?: PositionComponent;
  /** Nearby NPCs */
  nearbyNPCs?: Array<{ id: string; name: string }>;
  /** Nearby items */
  nearbyItems?: Array<{ id: string; name: string }>;
  /** Available exits/directions */
  exits?: string[];
  /** Current quest objectives */
  activeQuests?: string[];
  /** Party members */
  partyMembers?: string[];
}

/**
 * LLMCommandParser - Parse natural language to game commands
 *
 * @example
 * ```typescript
 * const parser = new LLMCommandParser();
 * const context = {
 *   location: { realm: 'overworld', city: 'tavern' },
 *   nearbyNPCs: [{ id: 'npc1', name: 'Innkeeper' }],
 *   exits: ['north', 'east']
 * };
 *
 * const result = await parser.parse("Talk to the innkeeper", context);
 * // { command: 'talk', args: ['Innkeeper'], confidence: 0.95, ... }
 * ```
 */
export class LLMCommandParser {
  private llm: BrowserLLM;
  private systemPrompt: string;

  constructor() {
    this.llm = BrowserLLM.getInstance();
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Parse natural language input into a structured command
   *
   * @param input - User's natural language input
   * @param context - Current game context
   * @returns Parsed command with confidence score
   */
  public async parse(
    input: string,
    context?: GameContext
  ): Promise<ParsedCommand> {
    if (!this.llm.isLoaded()) {
      throw new Error(
        'LLM is not loaded. Initialize BrowserLLM before parsing.'
      );
    }

    try {
      const prompt = this.buildPrompt(input, context);
      const response = await this.llm.generate(prompt, {
        temperature: 0.3, // Lower temperature for more consistent parsing
        maxTokens: 256,
      });

      return this.parseResponse(response, input);
    } catch (error) {
      console.error('[LLMCommandParser] Parse failed:', error);
      // Fallback to unknown command
      return {
        command: 'unknown',
        args: [input],
        confidence: 0,
        interpretation: `Could not parse: "${input}"`,
      };
    }
  }

  /**
   * Build the system prompt for command parsing
   */
  private buildSystemPrompt(): string {
    return `You are a command parser for a text-based RPG game. Parse user input into structured commands.

Available commands:
- move <direction|location>: Move to a location (directions: north, south, east, west, up, down)
- look [target]: Examine surroundings or a specific target
- talk <npc>: Talk to an NPC
- take <item>: Pick up an item
- attack <target>: Attack an entity
- use <item> [on target]: Use an item
- inventory: Show inventory
- quests: Show active quests
- party: Show party status
- save: Save the game
- load: Load a saved game
- help: Show help

Respond ONLY with a JSON object in this exact format:
{
  "command": "commandName",
  "args": ["arg1", "arg2"],
  "confidence": 0.95,
  "interpretation": "Human readable interpretation"
}

Rules:
- confidence must be between 0 and 1
- Use lowercase for command names
- Extract entity names from context when possible
- If unsure, use "unknown" command with confidence < 0.5`;
  }

  /**
   * Build the prompt with context
   */
  private buildPrompt(input: string, context?: GameContext): string {
    let prompt = this.systemPrompt + '\n\n';

    if (context) {
      prompt += 'Current context:\n';

      if (context.location) {
        prompt += `- Location: ${context.location.city || 'unknown'} in ${context.location.realm || 'unknown'}`;
        if (context.location.building) {
          prompt += `, ${context.location.building}`;
        }
        if (context.location.room) {
          prompt += `, ${context.location.room}`;
        }
        prompt += '\n';
      }

      if (context.nearbyNPCs && context.nearbyNPCs.length > 0) {
        prompt += `- Nearby NPCs: ${context.nearbyNPCs.map((n) => n.name).join(', ')}\n`;
      }

      if (context.nearbyItems && context.nearbyItems.length > 0) {
        prompt += `- Nearby items: ${context.nearbyItems.map((i) => i.name).join(', ')}\n`;
      }

      if (context.exits && context.exits.length > 0) {
        prompt += `- Available exits: ${context.exits.join(', ')}\n`;
      }

      if (context.partyMembers && context.partyMembers.length > 0) {
        prompt += `- Party members: ${context.partyMembers.join(', ')}\n`;
      }

      if (context.activeQuests && context.activeQuests.length > 0) {
        prompt += `- Active quests: ${context.activeQuests.length}\n`;
      }

      prompt += '\n';
    }

    prompt += `User input: "${input}"\n\nParse this input:`;

    return prompt;
  }

  /**
   * Parse the LLM response into a ParsedCommand
   */
  private parseResponse(response: string, originalInput: string): ParsedCommand {
    try {
      // Extract JSON from response (handle cases where LLM adds explanation)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.command || !Array.isArray(parsed.args)) {
        throw new Error('Invalid response format');
      }

      // Normalize command
      const command = this.normalizeCommand(parsed.command);

      // Ensure confidence is valid
      const confidence = Math.max(
        0,
        Math.min(1, typeof parsed.confidence === 'number' ? parsed.confidence : 0.5)
      );

      return {
        command,
        args: parsed.args.map((arg: any) => String(arg)),
        confidence,
        interpretation:
          parsed.interpretation || `Execute: ${command} ${parsed.args.join(' ')}`,
      };
    } catch (error) {
      console.error('[LLMCommandParser] Failed to parse LLM response:', error);
      // Fallback
      return {
        command: 'unknown',
        args: [originalInput],
        confidence: 0,
        interpretation: `Could not parse: "${originalInput}"`,
      };
    }
  }

  /**
   * Normalize command to known types
   */
  private normalizeCommand(command: string): GameCommand {
    const normalized = command.toLowerCase().trim();
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

    if (validCommands.includes(normalized as GameCommand)) {
      return normalized as GameCommand;
    }

    return 'unknown';
  }

  /**
   * Parse multiple inputs in batch
   *
   * @param inputs - Array of user inputs
   * @param context - Shared game context
   * @returns Array of parsed commands
   */
  public async parseBatch(
    inputs: string[],
    context?: GameContext
  ): Promise<ParsedCommand[]> {
    return Promise.all(inputs.map((input) => this.parse(input, context)));
  }

  /**
   * Check if LLM is ready
   */
  public isReady(): boolean {
    return this.llm.isLoaded();
  }
}
