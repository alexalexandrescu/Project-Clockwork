# IO Module Quick Start

## Installation

First, add the WebLLM dependency to your package.json:

```bash
pnpm add @mlc-ai/web-llm
```

## Basic Usage

### 1. Command Parsing (Simple)

Use the `CommandParser` for instant, deterministic parsing:

```typescript
import { CommandParser } from '@rpg/engine/io';

const parser = new CommandParser();
const result = parser.parse("go north");
console.log(result);
// { command: 'move', args: ['north'], confidence: 1.0, interpretation: 'Move north' }
```

### 2. Command Parsing (AI-Powered)

Use `LLMCommandParser` for natural language understanding:

```typescript
import { BrowserLLM, LLMCommandParser } from '@rpg/engine/io';

// Initialize LLM (one-time setup)
const llm = BrowserLLM.getInstance();
await llm.initialize((progress) => {
  console.log(`Loading: ${Math.round(progress.progress * 100)}%`);
});

// Parse natural language
const parser = new LLMCommandParser();
const result = await parser.parse(
  "I'd like to speak with the innkeeper please",
  {
    nearbyNPCs: [{ id: '1', name: 'Innkeeper' }]
  }
);
// { command: 'talk', args: ['Innkeeper'], confidence: 0.95, ... }
```

### 3. Hybrid Approach (Recommended)

Use the hybrid processor from the example:

```typescript
import { HybridCommandProcessor } from '@rpg/engine/io/example';

const processor = new HybridCommandProcessor(true);
const result = await processor.process("go north", gameContext);
// Tries LLM first, falls back to regex if needed
```

### 4. Output Formatting

```typescript
import { OutputFormatter } from '@rpg/engine/io';

const formatter = new OutputFormatter({ colors: true, unicode: true });

// Health bar
console.log(formatter.formatStatBar('Health', 75, 100, 20));
// Health: [███████████████░░░░░] 75/100

// Inventory
console.log(formatter.formatItemList([
  { name: 'Sword', equipped: true },
  { name: 'Potion', quantity: 5 }
]));
//   • Sword [E]
//   • Potion (x5)

// Box
console.log(formatter.createBox(
  ['Welcome to the game!'],
  { title: 'Message', style: 'rounded' }
));
// ╭──────── Message ─────────╮
// │ Welcome to the game!     │
// ╰──────────────────────────╯
```

## Complete Example

```typescript
import {
  BrowserLLM,
  CommandParser,
  LLMCommandParser,
  OutputFormatter,
  type GameContext,
} from '@rpg/engine/io';

async function setupGame() {
  // Setup output
  const output = new OutputFormatter({ colors: true, unicode: true });

  // Setup parsing
  const fallback = new CommandParser();
  let llmParser: LLMCommandParser | null = null;

  // Try to initialize LLM
  try {
    const llm = BrowserLLM.getInstance();
    await llm.initialize((p) => {
      console.log(`Loading AI: ${Math.round(p.progress * 100)}%`);
    });
    llmParser = new LLMCommandParser();
    console.log('AI enabled!');
  } catch {
    console.log('Using simple parser');
  }

  // Game context
  const context: GameContext = {
    location: { realm: 'overworld', city: 'tavern' },
    nearbyNPCs: [{ id: '1', name: 'Innkeeper' }],
    exits: ['north', 'east'],
  };

  // Process command
  async function handleCommand(input: string) {
    let result;

    // Try LLM first
    if (llmParser?.isReady()) {
      result = await llmParser.parse(input, context);
      if (result.confidence < 0.5) {
        result = fallback.parse(input, context);
      }
    } else {
      result = fallback.parse(input, context);
    }

    console.log(output.formatDialogue('System', result.interpretation));
    return result;
  }

  // Example usage
  const cmd = await handleCommand("I want to talk to the innkeeper");
  if (cmd.command === 'talk') {
    console.log(output.formatDialogue('Innkeeper', 'Welcome, traveler!'));
  }
}

setupGame();
```

## Tips

1. **Initialize LLM once**: Do it during game startup with a loading screen
2. **Use context**: Always pass game context to parsers for better results
3. **Fallback strategy**: Always have a fallback parser for when LLM fails
4. **Cache results**: LLM parsing is slower, consider caching common commands
5. **Progressive enhancement**: Game should work without LLM, but better with it

## Command Reference

| Command | Args | Example |
|---------|------|---------|
| move | direction | `move north`, `go east` |
| look | [target] | `look`, `examine chest` |
| talk | npc | `talk innkeeper` |
| take | item | `take sword`, `get potion` |
| attack | target | `attack goblin` |
| use | item [on target] | `use potion`, `use key on door` |
| inventory | - | `inventory`, `inv` |
| quests | - | `quests` |
| party | - | `party` |
| save | - | `save` |
| load | - | `load` |
| help | - | `help`, `?` |

## Browser Requirements

- **For LLM**: Chrome 113+ or Edge 113+ (WebGPU support)
- **For parsers only**: Any modern browser
- **Memory**: ~2GB for model download and runtime

## Performance

- **CommandParser**: < 1ms (instant)
- **LLMCommandParser**: 100-500ms (first run), faster with caching
- **Model loading**: 10-30 seconds (one-time, cached after)
- **Model size**: ~2GB (downloaded once, cached)

## Error Handling

```typescript
// Always wrap LLM operations
try {
  await llm.initialize();
} catch (error) {
  console.warn('LLM unavailable:', error);
  // Fallback to CommandParser
}

// Check if ready
if (llmParser.isReady()) {
  // Use LLM
} else {
  // Use fallback
}
```
