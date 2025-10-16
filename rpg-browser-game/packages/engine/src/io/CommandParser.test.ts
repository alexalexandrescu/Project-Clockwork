/**
 * Tests for CommandParser
 */

import { describe, it, expect } from 'vitest';
import { CommandParser } from './CommandParser';
import type { GameContext } from './LLMCommandParser';

describe('CommandParser', () => {
  const parser = new CommandParser();

  describe('Basic Commands', () => {
    it('should parse move command', () => {
      const result = parser.parse('move north');
      expect(result.command).toBe('move');
      expect(result.args).toEqual(['north']);
      expect(result.confidence).toBe(1.0);
    });

    it('should parse move with direction alias', () => {
      const result = parser.parse('go n');
      expect(result.command).toBe('move');
      expect(result.args).toEqual(['north']);
    });

    it('should parse look command', () => {
      const result = parser.parse('look');
      expect(result.command).toBe('look');
      expect(result.args).toEqual([]);
      expect(result.confidence).toBe(1.0);
    });

    it('should parse look with target', () => {
      const result = parser.parse('examine chest');
      expect(result.command).toBe('look');
      expect(result.args).toEqual(['chest']);
    });

    it('should parse talk command', () => {
      const result = parser.parse('talk guard');
      expect(result.command).toBe('talk');
      expect(result.args).toEqual(['guard']);
    });

    it('should parse take command', () => {
      const result = parser.parse('take sword');
      expect(result.command).toBe('take');
      expect(result.args).toEqual(['sword']);
    });

    it('should parse attack command', () => {
      const result = parser.parse('attack goblin');
      expect(result.command).toBe('attack');
      expect(result.args).toEqual(['goblin']);
    });

    it('should parse use command', () => {
      const result = parser.parse('use potion');
      expect(result.command).toBe('use');
      expect(result.args).toEqual(['potion']);
    });

    it('should parse use command with target', () => {
      const result = parser.parse('use key on door');
      expect(result.command).toBe('use');
      expect(result.args).toEqual(['key', 'door']);
    });

    it('should parse inventory command', () => {
      const result = parser.parse('inventory');
      expect(result.command).toBe('inventory');
      expect(result.args).toEqual([]);
    });

    it('should parse quests command', () => {
      const result = parser.parse('quests');
      expect(result.command).toBe('quests');
      expect(result.args).toEqual([]);
    });

    it('should parse party command', () => {
      const result = parser.parse('party');
      expect(result.command).toBe('party');
      expect(result.args).toEqual([]);
    });

    it('should parse save command', () => {
      const result = parser.parse('save');
      expect(result.command).toBe('save');
      expect(result.args).toEqual([]);
    });

    it('should parse load command', () => {
      const result = parser.parse('load');
      expect(result.command).toBe('load');
      expect(result.args).toEqual([]);
    });

    it('should parse help command', () => {
      const result = parser.parse('help');
      expect(result.command).toBe('help');
      expect(result.args).toEqual([]);
    });
  });

  describe('Aliases', () => {
    it('should handle go as move', () => {
      const result = parser.parse('go west');
      expect(result.command).toBe('move');
      expect(result.args).toEqual(['west']);
    });

    it('should handle speak as talk', () => {
      const result = parser.parse('speak innkeeper');
      expect(result.command).toBe('talk');
      expect(result.args).toEqual(['innkeeper']);
    });

    it('should handle get as take', () => {
      const result = parser.parse('get sword');
      expect(result.command).toBe('take');
      expect(result.args).toEqual(['sword']);
    });

    it('should handle fight as attack', () => {
      const result = parser.parse('fight dragon');
      expect(result.command).toBe('attack');
      expect(result.args).toEqual(['dragon']);
    });

    it('should handle inv as inventory', () => {
      const result = parser.parse('inv');
      expect(result.command).toBe('inventory');
    });

    it('should handle ? as help', () => {
      const result = parser.parse('?');
      expect(result.command).toBe('help');
    });
  });

  describe('Filler Words', () => {
    it('should remove filler words', () => {
      const result = parser.parse('talk to the innkeeper');
      expect(result.command).toBe('talk');
      expect(result.args).toEqual(['innkeeper']);
    });

    it('should remove multiple filler words', () => {
      const result = parser.parse('go to the north');
      expect(result.command).toBe('move');
      expect(result.args).toEqual(['north']);
    });
  });

  describe('Context Awareness', () => {
    const context: GameContext = {
      location: { realm: 'overworld', city: 'tavern' },
      nearbyNPCs: [
        { id: 'npc1', name: 'Innkeeper' },
        { id: 'npc2', name: 'Town Guard' },
      ],
      nearbyItems: [
        { id: 'item1', name: 'Rusty Sword' },
        { id: 'item2', name: 'Health Potion' },
      ],
      exits: ['north', 'east'],
    };

    it('should match NPC names from context', () => {
      const result = parser.parse('talk innkeeper', context);
      expect(result.command).toBe('talk');
      expect(result.args).toEqual(['Innkeeper']);
    });

    it('should match partial NPC names', () => {
      const result = parser.parse('talk guard', context);
      expect(result.command).toBe('talk');
      expect(result.args).toEqual(['Town Guard']);
    });

    it('should match item names from context', () => {
      const result = parser.parse('take sword', context);
      expect(result.command).toBe('take');
      expect(result.args).toEqual(['Rusty Sword']);
    });

    it('should match partial item names', () => {
      const result = parser.parse('take potion', context);
      expect(result.command).toBe('take');
      expect(result.args).toEqual(['Health Potion']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = parser.parse('');
      expect(result.command).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should handle whitespace only', () => {
      const result = parser.parse('   ');
      expect(result.command).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should handle unknown command', () => {
      const result = parser.parse('jump');
      expect(result.command).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should handle multi-word targets', () => {
      const result = parser.parse('attack ancient dragon');
      expect(result.command).toBe('attack');
      expect(result.args).toEqual(['ancient dragon']);
    });

    it('should be case insensitive', () => {
      const result = parser.parse('MOVE NORTH');
      expect(result.command).toBe('move');
      expect(result.args).toEqual(['north']);
    });
  });

  describe('Batch Processing', () => {
    it('should parse multiple commands', () => {
      const results = parser.parseBatch(['move north', 'look', 'take sword']);
      expect(results).toHaveLength(3);
      expect(results[0].command).toBe('move');
      expect(results[1].command).toBe('look');
      expect(results[2].command).toBe('take');
    });
  });

  describe('Helper Methods', () => {
    it('should return available commands', () => {
      const commands = parser.getAvailableCommands();
      expect(commands).toContain('move');
      expect(commands).toContain('look');
      expect(commands).toContain('talk');
    });

    it('should return command aliases', () => {
      const aliases = parser.getAliases('move');
      expect(aliases).toContain('go');
      expect(aliases).toContain('walk');
    });

    it('should return command help', () => {
      const help = parser.getCommandHelp('move');
      expect(help).toContain('Move');
      expect(help).toContain('Usage');
    });
  });
});
