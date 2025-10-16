# Eldoria - Browser-Based Text RPG

A complete text-based RPG that runs entirely in the browser with natural language AI, multiplayer support, and dynamic content creation.

## 🎮 Features

- **Natural Language Commands** - Parse player input using WebLLM (Phi-3 Mini on WebGPU)
- **Event-Driven ECS Architecture** - Clean, modular game engine
- **P2P Multiplayer** - 2-4 players via WebRTC
- **Party Quests & Guilds** - Cooperative gameplay
- **Dynamic World** - NPCs with schedules, relationships, and economy
- **Persistent Storage** - Save/load using IndexedDB (Dexie.js)
- **Virtual Scrolling** - Handle 100k+ messages smoothly
- **MCP Servers** - Dynamic content creation via AI agents

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open browser to http://localhost:3000
```

## 📦 Monorepo Structure

```
packages/
├── engine/          # Core game engine (ECS, systems, logic)
├── game/            # React UI and browser code
├── data/            # Game content (JSON files)
├── mcp-content/     # MCP server for content creation
└── mcp-testing/     # MCP server for AI testing
```

## 🎯 Game Systems (13 Total)

TimeSystem • MovementSystem • InventorySystem • QuestSystem • NPCScheduleSystem • DialogueSystem • CombatSystem • RelationshipSystem • EconomySystem • CraftingSystem • PartySystem • GuildSystem • AISystem

## 🎮 Example Gameplay

```
> look around

=== THE RUSTY FLAGON (Tavern) ===
A cozy tavern with crackling fireplace...

NPCs: Marta the Innkeeper, Old Tom
Items: Iron Sword, Health Potion
Exits: North (Town Square), East (Kitchen)

> talk to Marta about quests

Marta: "I've got rats in the cellar..."
[Quest available: Rats in the Cellar]
```

## 📖 Documentation

See packages/*/README.md for detailed documentation.

## 🎨 Tech Stack

React 18 • TypeScript • Vite • Tailwind CSS • Dexie.js • Zustand • WebLLM • WebRTC • MCP SDK

---

**Ready to play?** Run `pnpm dev` and explore Eldoria! 🎮✨
