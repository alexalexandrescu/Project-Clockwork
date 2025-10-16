/**
 * Tests for OutputFormatter
 */

import { describe, it, expect } from 'vitest';
import { OutputFormatter } from './OutputFormatter';

describe('OutputFormatter', () => {
  describe('Stat Bars', () => {
    it('should format a stat bar', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatStatBar('Health', 50, 100, 10);
      expect(result).toContain('Health:');
      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('50/100');
    });

    it('should handle full stat bar', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatStatBar('Mana', 100, 100, 10);
      expect(result).toContain('##########');
      expect(result).toContain('100/100');
    });

    it('should handle empty stat bar', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatStatBar('Stamina', 0, 100, 10);
      expect(result).toContain('----------');
      expect(result).toContain('0/100');
    });

    it('should use Unicode characters when enabled', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: true });
      const result = formatter.formatStatBar('Health', 50, 100, 10);
      expect(result).toMatch(/[█░]/);
    });
  });

  describe('Item Lists', () => {
    it('should format empty item list', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatItemList([]);
      expect(result).toBe('No items');
    });

    it('should format single item', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatItemList([{ name: 'Sword' }]);
      expect(result).toContain('Sword');
    });

    it('should format item with quantity', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatItemList([{ name: 'Potion', quantity: 5 }]);
      expect(result).toContain('Potion');
      expect(result).toContain('x5');
    });

    it('should format item with description', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatItemList([
        { name: 'Sword', description: 'A sharp blade' },
      ]);
      expect(result).toContain('Sword');
      expect(result).toContain('A sharp blade');
    });

    it('should show equipped indicator', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatItemList([
        { name: 'Sword', equipped: true },
      ]);
      expect(result).toContain('[E]');
    });

    it('should format multiple items', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatItemList([
        { name: 'Sword' },
        { name: 'Shield' },
        { name: 'Potion', quantity: 3 },
      ]);
      expect(result).toContain('Sword');
      expect(result).toContain('Shield');
      expect(result).toContain('Potion');
    });
  });

  describe('Dialogue', () => {
    it('should format dialogue', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.formatDialogue('Innkeeper', 'Welcome!');
      expect(result).toContain('Innkeeper');
      expect(result).toContain('Welcome!');
      expect(result).toContain('"');
    });
  });

  describe('Boxes', () => {
    it('should create a simple box', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: true });
      const result = formatter.createBox(['Hello', 'World']);
      expect(result).toContain('┌');
      expect(result).toContain('┐');
      expect(result).toContain('└');
      expect(result).toContain('┘');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should create a box with title', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: true });
      const result = formatter.createBox(['Content'], { title: 'Title' });
      expect(result).toContain('Title');
      expect(result).toContain('Content');
    });

    it('should support different box styles', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: true });

      const single = formatter.createBox(['Test'], { style: 'single' });
      expect(single).toContain('┌');

      const double = formatter.createBox(['Test'], { style: 'double' });
      expect(double).toContain('╔');

      const rounded = formatter.createBox(['Test'], { style: 'rounded' });
      expect(rounded).toContain('╭');
    });

    it('should respect padding', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: true });
      const result = formatter.createBox(['X'], { padding: 3 });
      const lines = result.split('\n');
      // Check that there's padding around the X
      expect(lines[1]).toMatch(/│\s{3}X\s+│/);
    });
  });

  describe('Tables', () => {
    it('should create a table', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: true });
      const result = formatter.createTable(
        ['Name', 'Value'],
        [
          ['Item 1', '100'],
          ['Item 2', '200'],
        ]
      );
      expect(result).toContain('Name');
      expect(result).toContain('Value');
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should align columns', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: true });
      const result = formatter.createTable(
        ['A', 'B'],
        [
          ['Short', 'X'],
          ['Very Long Text', 'Y'],
        ]
      );
      const lines = result.split('\n');
      // All lines should have the same length (accounting for box chars)
      const lengths = lines.map((l) => l.length);
      expect(new Set(lengths).size).toBe(1);
    });
  });

  describe('Styling', () => {
    it('should apply bold style', () => {
      const formatter = new OutputFormatter({ colors: true, unicode: false });
      const result = formatter.style('Text', { bold: true });
      expect(result).toContain('\x1b[1m');
      expect(result).toContain('\x1b[0m');
    });

    it('should apply color', () => {
      const formatter = new OutputFormatter({ colors: true, unicode: false });
      const result = formatter.style('Text', { color: 'red' });
      expect(result).toContain('\x1b[31m');
    });

    it('should not apply styles when colors disabled', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.style('Text', { bold: true, color: 'red' });
      expect(result).toBe('Text');
    });
  });

  describe('Dividers and Headers', () => {
    it('should create a divider', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.divider(10);
      expect(result).toHaveLength(10);
      expect(result).toMatch(/^-+$/);
    });

    it('should create a header', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.header('Title', 20);
      expect(result).toContain('Title');
      expect(result.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Text Wrapping', () => {
    it('should wrap long text', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const text = 'This is a very long line that should be wrapped at the specified width';
      const result = formatter.wrap(text, 20);
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(20);
      }
    });

    it('should not break short text', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.wrap('Short text', 50);
      expect(result).not.toContain('\n');
    });
  });

  describe('Progress', () => {
    it('should format progress', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.progress(5, 10);
      expect(result).toContain('5/10');
      expect(result).toContain('50%');
    });

    it('should format progress with label', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: false });
      const result = formatter.progress(3, 10, 'Loading');
      expect(result).toContain('Loading');
      expect(result).toContain('3/10');
      expect(result).toContain('30%');
    });
  });

  describe('Configuration', () => {
    it('should enable/disable colors', () => {
      const formatter = new OutputFormatter({ colors: true, unicode: false });
      let result = formatter.style('Text', { color: 'red' });
      expect(result).toContain('\x1b[31m');

      formatter.setColorsEnabled(false);
      result = formatter.style('Text', { color: 'red' });
      expect(result).not.toContain('\x1b[');
    });

    it('should enable/disable Unicode', () => {
      const formatter = new OutputFormatter({ colors: false, unicode: true });
      let result = formatter.formatStatBar('HP', 50, 100, 10);
      expect(result).toMatch(/[█░]/);

      formatter.setUnicodeEnabled(false);
      result = formatter.formatStatBar('HP', 50, 100, 10);
      expect(result).not.toMatch(/[█░]/);
    });
  });
});
