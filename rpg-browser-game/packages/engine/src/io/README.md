# IO Module - Input/Output System

This module provides comprehensive input parsing and output formatting for the RPG browser game.

## Components

### 1. BrowserLLM

WebLLM wrapper for running Phi-3 Mini models in the browser.

```typescript
import { BrowserLLM } from '@rpg/engine/io';

// Initialize the model
const llm = BrowserLLM.getInstance();
await llm.initialize((progress) => {
  console.log(`Loading: ${progress.text} (${Math.round(progress.progress * 100)}%)`);
});

// Generate text
const response = await llm.generate("Describe a magical sword");

// Generate streaming
await llm.generateStreaming(
  "Tell me a story",
  (chunk, isDone) => {
    if (!isDone) {
      process.stdout.write(chunk);
    }
  }
);
```

### 2. LLMCommandParser

Natural language command parser using the LLM.

```typescript
import { LLMCommandParser } from '@rpg/engine/io';

const parser = new LLMCommandParser();
const context = {
  location: { realm: 'overworld', city: 'tavern' },
  nearbyNPCs: [
    { id: 'npc1', name: 'Innkeeper' },
    { id: 'npc2', name: 'Merchant' }
  ],
  nearbyItems: [
    { id: 'item1', name: 'Sword' }
  ],
  exits: ['north', 'east']
};

// Parse natural language input
const result = await parser.parse("I want to talk to the innkeeper", context);
console.log(result);
// {
//   command: 'talk',
//   args: ['Innkeeper'],
//   confidence: 0.95,
//   interpretation: 'Talk to Innkeeper'
// }
```

### 3. CommandParser

Fallback regex-based parser for deterministic parsing.

```typescript
import { CommandParser } from '@rpg/engine/io';

const parser = new CommandParser();

// Parse commands
const result1 = parser.parse("go north");
// { command: 'move', args: ['north'], confidence: 1.0, ... }

const result2 = parser.parse("talk to innkeeper", context);
// { command: 'talk', args: ['innkeeper'], confidence: 0.9, ... }

// Get available commands
console.log(parser.getAvailableCommands());
// ['move', 'look', 'talk', 'take', 'attack', 'use', ...]

// Get command help
console.log(parser.getCommandHelp('move'));
// 'Move to a location. Usage: move <direction> ...'
```

### 4. OutputFormatter

Text formatting utilities for game output.

```typescript
import { OutputFormatter } from '@rpg/engine/io';

const formatter = new OutputFormatter({ colors: true, unicode: true });

// Format stat bars
console.log(formatter.formatStatBar('Health', 75, 100, 20));
// Health: [███████████████░░░░░] 75/100

console.log(formatter.formatStatBar('Mana', 30, 100, 20));
// Mana: [██████░░░░░░░░░░░░░░] 30/100

// Format item lists
console.log(formatter.formatItemList([
  { name: 'Iron Sword', quantity: 1, description: 'A sturdy blade', equipped: true },
  { name: 'Health Potion', quantity: 5, description: 'Restores 50 HP' }
]));

// Format dialogue
console.log(formatter.formatDialogue('Innkeeper', 'Welcome to my tavern!'));
// Innkeeper: "Welcome to my tavern!"

// Create boxes
console.log(formatter.createBox(
  [
    'You have entered the tavern.',
    'The room is warm and inviting.',
    'You see an innkeeper behind the bar.'
  ],
  { title: 'Tavern', style: 'rounded', padding: 1 }
));
// ╭─────────── Tavern ───────────╮
// │ You have entered the tavern. │
// │ The room is warm and inviting│
// │ You see an innkeeper behind...│
// ╰──────────────────────────────╯

// Create tables
console.log(formatter.createTable(
  ['Item', 'Quantity', 'Value'],
  [
    ['Sword', '1', '100g'],
    ['Potion', '5', '25g'],
    ['Shield', '1', '75g']
  ]
));

// Headers and dividers
console.log(formatter.header('INVENTORY', 60));
console.log(formatter.divider(60));

// Text wrapping
console.log(formatter.wrap(
  'This is a very long description that needs to be wrapped to fit within a reasonable width.',
  40
));
```

## Usage Pattern

Typical integration pattern for command processing:

```typescript
import {
  BrowserLLM,
  LLMCommandParser,
  CommandParser,
  OutputFormatter
} from '@rpg/engine/io';

// Initialize LLM (optional, can use fallback parser only)
const llm = BrowserLLM.getInstance();
const llmReady = await llm.initialize().catch(() => false);

// Create parsers
const llmParser = new LLMCommandParser();
const fallbackParser = new CommandParser();
const formatter = new OutputFormatter();

// Process user input
async function processInput(input: string, gameContext: GameContext) {
  let result;

  // Try LLM parser if available
  if (llmReady && llmParser.isReady()) {
    try {
      result = await llmParser.parse(input, gameContext);

      // Fallback to regex parser if confidence is low
      if (result.confidence < 0.5) {
        result = fallbackParser.parse(input, gameContext);
      }
    } catch (error) {
      result = fallbackParser.parse(input, gameContext);
    }
  } else {
    // Use fallback parser
    result = fallbackParser.parse(input, gameContext);
  }

  return result;
}

// Format output
function displayGameState(player: Entity, location: string) {
  const stats = player.components.stats as StatsComponent;

  console.log(formatter.header('CHARACTER STATUS'));
  console.log(formatter.formatStatBar('Health', stats.health, stats.maxHealth));
  console.log(formatter.formatStatBar('Mana', stats.mana || 0, stats.maxMana || 100));
  console.log(formatter.divider());
  console.log(`Location: ${location}`);
}
```

## Supported Commands

- `move <direction>` - Move in a direction (north, south, east, west, up, down)
- `look [target]` - Examine surroundings or specific target
- `talk <npc>` - Initiate conversation with NPC
- `take <item>` - Pick up an item
- `attack <target>` - Attack an entity
- `use <item> [on target]` - Use an item, optionally on a target
- `inventory` - Display inventory
- `quests` - Show active quests
- `party` - Show party status
- `save` - Save game
- `load` - Load saved game
- `help` - Display help

## Command Aliases

The CommandParser supports many aliases:
- Movement: `go`, `walk`, `run`, `travel` → `move`
- Examination: `examine`, `inspect`, `check` → `look`
- Conversation: `speak`, `chat`, `greet`, `ask` → `talk`
- Taking: `get`, `grab`, `pickup` → `take`
- Combat: `fight`, `hit`, `strike` → `attack`

## Requirements

- **BrowserLLM**: Requires `@mlc-ai/web-llm` package and WebGPU support (Chrome 113+, Edge 113+)
- **Other modules**: No external dependencies

## Notes

- BrowserLLM uses the Phi-3 Mini 4K model (~2GB download on first use)
- Model is cached in browser storage after first download
- LLMCommandParser falls back gracefully if LLM is unavailable
- OutputFormatter works in both terminal and browser console
- All parsers return the same `ParsedCommand` interface for consistency
