/**
 * OutputFormatter - Text formatting utilities for game output
 *
 * Provides utilities for formatting stats, lists, dialogue, and ASCII art
 * for terminal/text-based game output.
 */

/**
 * Style options for text formatting
 */
export interface StyleOptions {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dim?: boolean;
}

/**
 * Box drawing characters
 */
export const BOX_CHARS = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    tLeft: '├',
    tRight: '┤',
    tTop: '┬',
    tBottom: '┴',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    cross: '╬',
    tLeft: '╠',
    tRight: '╣',
    tTop: '╦',
    tBottom: '╩',
  },
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    tLeft: '├',
    tRight: '┤',
    tTop: '┬',
    tBottom: '┴',
  },
};

/**
 * ANSI color codes
 */
export const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underscore: '\x1b[4m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

/**
 * OutputFormatter - Text formatting utilities
 *
 * @example
 * ```typescript
 * const formatter = new OutputFormatter();
 *
 * // Format a stat bar
 * console.log(formatter.formatStatBar('Health', 75, 100, 20));
 * // Health: [###############·····] 75/100
 *
 * // Create a box
 * console.log(formatter.createBox(['Welcome to', 'The Adventure!']));
 *
 * // Format items
 * console.log(formatter.formatItemList([
 *   { name: 'Sword', quantity: 1, description: 'A sharp blade' },
 *   { name: 'Potion', quantity: 5, description: 'Restores 50 HP' }
 * ]));
 * ```
 */
export class OutputFormatter {
  private useColors: boolean;
  private useUnicode: boolean;

  constructor(options?: { colors?: boolean; unicode?: boolean }) {
    this.useColors = options?.colors ?? true;
    this.useUnicode = options?.unicode ?? true;
  }

  /**
   * Format a stat bar (e.g., health, mana, stamina)
   *
   * @param label - Stat name
   * @param current - Current value
   * @param max - Maximum value
   * @param width - Bar width in characters (default: 20)
   * @param style - Optional color/style
   * @returns Formatted stat bar
   */
  public formatStatBar(
    label: string,
    current: number,
    max: number,
    width = 20,
    style?: { filled?: string; empty?: string }
  ): string {
    const percentage = Math.max(0, Math.min(1, current / max));
    const filledWidth = Math.round(percentage * width);
    const emptyWidth = width - filledWidth;

    const filledChar = this.useUnicode ? '█' : '#';
    const emptyChar = this.useUnicode ? '░' : '-';

    const filled = filledChar.repeat(filledWidth);
    const empty = emptyChar.repeat(emptyWidth);

    let bar = `[${filled}${empty}]`;

    // Apply colors if enabled
    if (this.useColors) {
      const color = this.getHealthColor(percentage);
      const styledFilled = this.style(filled, { color });
      bar = `[${styledFilled}${empty}]`;
    }

    return `${label}: ${bar} ${current}/${max}`;
  }

  /**
   * Format a list of items
   *
   * @param items - Array of items to format
   * @returns Formatted item list
   */
  public formatItemList(
    items: Array<{
      name: string;
      quantity?: number;
      description?: string;
      equipped?: boolean;
    }>
  ): string {
    if (items.length === 0) {
      return 'No items';
    }

    const lines: string[] = [];

    for (const item of items) {
      let line = '  ';

      // Add bullet point
      line += this.useUnicode ? '• ' : '- ';

      // Add item name
      line += this.style(item.name, { bold: true });

      // Add quantity if > 1
      if (item.quantity && item.quantity > 1) {
        line += this.style(` (x${item.quantity})`, { dim: true });
      }

      // Add equipped indicator
      if (item.equipped) {
        line += this.style(' [E]', { color: 'green' });
      }

      lines.push(line);

      // Add description on next line if provided
      if (item.description) {
        lines.push(`    ${this.style(item.description, { dim: true, italic: true })}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format dialogue text
   *
   * @param speaker - Name of the speaker
   * @param text - Dialogue text
   * @param style - Optional style for speaker name
   * @returns Formatted dialogue
   */
  public formatDialogue(
    speaker: string,
    text: string,
    style?: { speakerColor?: string }
  ): string {
    const styledSpeaker = this.style(speaker, {
      bold: true,
      color: style?.speakerColor || 'cyan',
    });

    return `${styledSpeaker}: "${text}"`;
  }

  /**
   * Create a text box with border
   *
   * @param content - Lines of content
   * @param options - Box options
   * @returns Formatted box
   */
  public createBox(
    content: string[],
    options?: {
      title?: string;
      style?: 'single' | 'double' | 'rounded';
      padding?: number;
      width?: number;
    }
  ): string {
    const style = options?.style || 'single';
    const padding = options?.padding ?? 1;
    const chars = BOX_CHARS[style];

    // Calculate width
    const contentWidth =
      options?.width ||
      Math.max(
        ...content.map((line) => this.stripAnsi(line).length),
        options?.title ? options.title.length : 0
      );
    const innerWidth = contentWidth + padding * 2;

    const lines: string[] = [];

    // Top border
    if (options?.title) {
      const titlePadding = Math.max(0, innerWidth - options.title.length - 2);
      const leftPad = Math.floor(titlePadding / 2);
      const rightPad = titlePadding - leftPad;
      lines.push(
        chars.topLeft +
          chars.horizontal.repeat(leftPad) +
          ` ${options.title} ` +
          chars.horizontal.repeat(rightPad) +
          chars.topRight
      );
    } else {
      lines.push(
        chars.topLeft + chars.horizontal.repeat(innerWidth) + chars.topRight
      );
    }

    // Content
    for (const line of content) {
      const stripped = this.stripAnsi(line);
      const paddingNeeded = innerWidth - stripped.length;
      const leftPad = ' '.repeat(padding);
      const rightPad = ' '.repeat(paddingNeeded - padding);
      lines.push(chars.vertical + leftPad + line + rightPad + chars.vertical);
    }

    // Bottom border
    lines.push(
      chars.bottomLeft + chars.horizontal.repeat(innerWidth) + chars.bottomRight
    );

    return lines.join('\n');
  }

  /**
   * Create a table
   *
   * @param headers - Table headers
   * @param rows - Table rows
   * @returns Formatted table
   */
  public createTable(headers: string[], rows: string[][]): string {
    const chars = BOX_CHARS.single;

    // Calculate column widths
    const colWidths = headers.map((header, i) => {
      const maxContentWidth = Math.max(
        ...rows.map((row) => (row[i] ? this.stripAnsi(row[i]).length : 0))
      );
      return Math.max(header.length, maxContentWidth);
    });

    const lines: string[] = [];

    // Top border
    lines.push(
      chars.topLeft +
        colWidths.map((w) => chars.horizontal.repeat(w + 2)).join(chars.tTop) +
        chars.topRight
    );

    // Headers
    const headerRow = headers
      .map((header, i) => ` ${this.style(header, { bold: true }).padEnd(colWidths[i] + 1)}`)
      .join(chars.vertical);
    lines.push(chars.vertical + headerRow + chars.vertical);

    // Header separator
    lines.push(
      chars.tLeft +
        colWidths.map((w) => chars.horizontal.repeat(w + 2)).join(chars.cross) +
        chars.tRight
    );

    // Rows
    for (const row of rows) {
      const formattedRow = row
        .map((cell, i) => {
          const stripped = this.stripAnsi(cell || '');
          const padding = colWidths[i] - stripped.length;
          return ` ${cell}${' '.repeat(padding)} `;
        })
        .join(chars.vertical);
      lines.push(chars.vertical + formattedRow + chars.vertical);
    }

    // Bottom border
    lines.push(
      chars.bottomLeft +
        colWidths.map((w) => chars.horizontal.repeat(w + 2)).join(chars.tBottom) +
        chars.bottomRight
    );

    return lines.join('\n');
  }

  /**
   * Apply style to text
   *
   * @param text - Text to style
   * @param options - Style options
   * @returns Styled text
   */
  public style(text: string, options?: StyleOptions): string {
    if (!this.useColors || !options) {
      return text;
    }

    let styled = '';

    if (options.bold) styled += COLORS.bright;
    if (options.dim) styled += COLORS.dim;
    if (options.italic) styled += COLORS.italic;
    if (options.underline) styled += COLORS.underscore;
    if (options.color && options.color in COLORS) {
      styled += COLORS[options.color as keyof typeof COLORS];
    }

    return styled + text + COLORS.reset;
  }

  /**
   * Strip ANSI codes from text
   */
  private stripAnsi(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }

  /**
   * Get color based on health percentage
   */
  private getHealthColor(percentage: number): string {
    if (percentage > 0.6) return 'green';
    if (percentage > 0.3) return 'yellow';
    return 'red';
  }

  /**
   * Format a divider line
   *
   * @param width - Divider width
   * @param char - Character to use
   * @returns Divider string
   */
  public divider(width = 60, char?: string): string {
    const dividerChar = char || (this.useUnicode ? '─' : '-');
    return dividerChar.repeat(width);
  }

  /**
   * Format a header with title
   *
   * @param title - Header title
   * @param width - Header width
   * @returns Formatted header
   */
  public header(title: string, width = 60): string {
    const titleLength = this.stripAnsi(title).length;
    const padding = Math.max(0, width - titleLength - 4);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;

    const divChar = this.useUnicode ? '═' : '=';
    const styledTitle = this.style(title, { bold: true });

    return (
      divChar.repeat(leftPad) +
      ` ${styledTitle} ` +
      divChar.repeat(rightPad)
    );
  }

  /**
   * Wrap text to specified width
   *
   * @param text - Text to wrap
   * @param width - Maximum line width
   * @returns Wrapped text
   */
  public wrap(text: string, width = 60): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (this.stripAnsi(testLine).length <= width) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

  /**
   * Format a progress indicator
   *
   * @param current - Current progress
   * @param total - Total items
   * @param label - Progress label
   * @returns Formatted progress
   */
  public progress(current: number, total: number, label?: string): string {
    const percentage = Math.round((current / total) * 100);
    const prefix = label ? `${label}: ` : '';
    return `${prefix}${current}/${total} (${percentage}%)`;
  }

  /**
   * Enable or disable colors
   */
  public setColorsEnabled(enabled: boolean): void {
    this.useColors = enabled;
  }

  /**
   * Enable or disable Unicode characters
   */
  public setUnicodeEnabled(enabled: boolean): void {
    this.useUnicode = enabled;
  }
}
