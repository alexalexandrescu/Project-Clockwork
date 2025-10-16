/**
 * Example usage of the IO module
 *
 * This file demonstrates how to use the BrowserLLM, parsers, and formatters
 * in a complete game scenario.
 */

import {
  BrowserLLM,
  LLMCommandParser,
  CommandParser,
  OutputFormatter,
  type GameContext,
  type ParsedCommand,
} from './index';

/**
 * Initialize the LLM system
 */
export async function initializeLLM(
  onProgress?: (text: string, percent: number) => void
): Promise<boolean> {
  try {
    const llm = BrowserLLM.getInstance();

    console.log('Initializing AI model...');
    await llm.initialize((progress) => {
      if (onProgress) {
        onProgress(progress.text, Math.round(progress.progress * 100));
      }
      console.log(`[${Math.round(progress.progress * 100)}%] ${progress.text}`);
    });

    console.log('AI model ready!');
    return true;
  } catch (error) {
    console.warn('Failed to initialize AI model, using fallback parser:', error);
    return false;
  }
}

/**
 * Command processor that tries LLM first, then falls back to regex parser
 */
export class HybridCommandProcessor {
  private llmParser: LLMCommandParser;
  private fallbackParser: CommandParser;
  private useLLM: boolean;

  constructor(useLLM = true) {
    this.llmParser = new LLMCommandParser();
    this.fallbackParser = new CommandParser();
    this.useLLM = useLLM;
  }

  /**
   * Process user input with context
   */
  async process(input: string, context?: GameContext): Promise<ParsedCommand> {
    // Try LLM parser first if enabled and ready
    if (this.useLLM && this.llmParser.isReady()) {
      try {
        const result = await this.llmParser.parse(input, context);

        // If confidence is low, try fallback
        if (result.confidence < 0.5) {
          console.log(
            `Low confidence (${result.confidence}), trying fallback parser...`
          );
          const fallbackResult = this.fallbackParser.parse(input, context);

          // Use fallback if it has higher confidence
          if (fallbackResult.confidence > result.confidence) {
            return fallbackResult;
          }
        }

        return result;
      } catch (error) {
        console.warn('LLM parsing failed, using fallback:', error);
        return this.fallbackParser.parse(input, context);
      }
    }

    // Use fallback parser
    return this.fallbackParser.parse(input, context);
  }

  /**
   * Get command help
   */
  getHelp(command?: string): string {
    if (command) {
      return this.fallbackParser.getCommandHelp(command as any);
    }

    const commands = this.fallbackParser.getAvailableCommands();
    return `Available commands: ${commands.join(', ')}`;
  }
}

/**
 * Game output manager
 */
export class GameOutputManager {
  private formatter: OutputFormatter;

  constructor(options?: { colors?: boolean; unicode?: boolean }) {
    this.formatter = new OutputFormatter(options);
  }

  /**
   * Display player stats
   */
  displayStats(stats: {
    health: number;
    maxHealth: number;
    mana?: number;
    maxMana?: number;
    stamina?: number;
    maxStamina?: number;
  }): string {
    const lines: string[] = [];

    lines.push(this.formatter.header('CHARACTER STATUS', 50));
    lines.push(
      this.formatter.formatStatBar('Health', stats.health, stats.maxHealth, 20)
    );

    if (stats.mana !== undefined && stats.maxMana !== undefined) {
      lines.push(
        this.formatter.formatStatBar('Mana', stats.mana, stats.maxMana, 20)
      );
    }

    if (stats.stamina !== undefined && stats.maxStamina !== undefined) {
      lines.push(
        this.formatter.formatStatBar('Stamina', stats.stamina, stats.maxStamina, 20)
      );
    }

    lines.push(this.formatter.divider(50));

    return lines.join('\n');
  }

  /**
   * Display inventory
   */
  displayInventory(
    items: Array<{
      name: string;
      quantity?: number;
      description?: string;
      equipped?: boolean;
    }>,
    gold: number
  ): string {
    const lines: string[] = [];

    lines.push(this.formatter.header('INVENTORY', 50));
    lines.push(this.formatter.style(`Gold: ${gold}`, { color: 'yellow', bold: true }));
    lines.push('');
    lines.push(this.formatter.formatItemList(items));
    lines.push(this.formatter.divider(50));

    return lines.join('\n');
  }

  /**
   * Display location
   */
  displayLocation(
    name: string,
    description: string,
    npcs: string[],
    items: string[],
    exits: string[]
  ): string {
    const lines: string[] = [];

    lines.push(
      this.formatter.createBox([name, '', ...this.formatter.wrap(description, 46).split('\n')], {
        style: 'rounded',
        padding: 1,
        width: 50,
      })
    );

    if (npcs.length > 0) {
      lines.push('');
      lines.push('NPCs:');
      for (const npc of npcs) {
        lines.push(`  • ${npc}`);
      }
    }

    if (items.length > 0) {
      lines.push('');
      lines.push('Items:');
      for (const item of items) {
        lines.push(`  • ${item}`);
      }
    }

    if (exits.length > 0) {
      lines.push('');
      lines.push(`Exits: ${exits.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Display dialogue
   */
  displayDialogue(speaker: string, text: string): string {
    return this.formatter.createBox([this.formatter.formatDialogue(speaker, text)], {
      style: 'single',
      padding: 1,
    });
  }

  /**
   * Display quest info
   */
  displayQuests(
    quests: Array<{
      name: string;
      description: string;
      objectives: Array<{ text: string; complete: boolean }>;
    }>
  ): string {
    const lines: string[] = [];

    lines.push(this.formatter.header('ACTIVE QUESTS', 50));

    for (const quest of quests) {
      lines.push('');
      lines.push(this.formatter.style(quest.name, { bold: true, color: 'cyan' }));
      lines.push(this.formatter.wrap(quest.description, 50));
      lines.push('');
      lines.push('Objectives:');

      for (const objective of quest.objectives) {
        const status = objective.complete ? '✓' : '○';
        const style = objective.complete ? { color: 'green' } : undefined;
        const text = this.formatter.style(`${status} ${objective.text}`, style);
        lines.push(`  ${text}`);
      }

      lines.push(this.formatter.divider(50));
    }

    return lines.join('\n');
  }

  /**
   * Display combat
   */
  displayCombat(
    playerName: string,
    playerHP: number,
    playerMaxHP: number,
    enemyName: string,
    enemyHP: number,
    enemyMaxHP: number,
    message: string
  ): string {
    const lines: string[] = [];

    lines.push(this.formatter.header('COMBAT', 50));
    lines.push('');
    lines.push(this.formatter.style(playerName, { color: 'green', bold: true }));
    lines.push(this.formatter.formatStatBar('HP', playerHP, playerMaxHP, 30));
    lines.push('');
    lines.push('vs');
    lines.push('');
    lines.push(this.formatter.style(enemyName, { color: 'red', bold: true }));
    lines.push(this.formatter.formatStatBar('HP', enemyHP, enemyMaxHP, 30));
    lines.push('');
    lines.push(this.formatter.divider(50));
    lines.push(this.formatter.wrap(message, 50));
    lines.push(this.formatter.divider(50));

    return lines.join('\n');
  }
}

/**
 * Example game loop
 */
export async function exampleGameLoop() {
  console.log('Starting RPG Browser Game...\n');

  // Initialize systems
  const llmAvailable = await initializeLLM();
  const processor = new HybridCommandProcessor(llmAvailable);
  const output = new GameOutputManager({ colors: true, unicode: true });

  // Game state
  const gameContext: GameContext = {
    location: {
      realm: 'overworld',
      city: 'stonehold',
      building: 'tavern',
      room: 'main hall',
    },
    nearbyNPCs: [
      { id: 'npc1', name: 'Innkeeper' },
      { id: 'npc2', name: 'Merchant' },
      { id: 'npc3', name: 'Town Guard' },
    ],
    nearbyItems: [{ id: 'item1', name: 'Rusty Sword' }],
    exits: ['north', 'east', 'stairs'],
    partyMembers: ['Hero'],
  };

  // Display initial location
  console.log(
    output.displayLocation(
      'The Rusty Tankard Tavern',
      'A cozy tavern filled with the smell of ale and roasted meat. The wooden beams creak overhead and a fire crackles in the hearth.',
      gameContext.nearbyNPCs.map((npc) => npc.name),
      gameContext.nearbyItems.map((item) => item.name),
      gameContext.exits
    )
  );

  // Example commands
  const testCommands = [
    'look around',
    'talk to the innkeeper',
    'take the rusty sword',
    'go north',
    'show my inventory',
  ];

  console.log('\n' + output.formatter.header('TESTING COMMANDS', 50));

  for (const command of testCommands) {
    console.log('\n' + output.formatter.divider(50, '='));
    console.log(`Player: "${command}"`);
    console.log('');

    const result = await processor.process(command, gameContext);

    console.log('Parsed Command:');
    console.log(`  Command: ${result.command}`);
    console.log(`  Args: ${result.args.join(', ')}`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`  Interpretation: ${result.interpretation}`);
  }

  // Display player stats
  console.log('\n');
  console.log(
    output.displayStats({
      health: 75,
      maxHealth: 100,
      mana: 50,
      maxMana: 80,
      stamina: 60,
      maxStamina: 100,
    })
  );

  // Display inventory
  console.log('\n');
  console.log(
    output.displayInventory(
      [
        {
          name: 'Iron Sword',
          quantity: 1,
          description: 'A well-crafted blade',
          equipped: true,
        },
        { name: 'Health Potion', quantity: 5, description: 'Restores 50 HP' },
        { name: 'Bread', quantity: 3, description: 'Simple provisions' },
      ],
      150
    )
  );
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleGameLoop().catch(console.error);
}
