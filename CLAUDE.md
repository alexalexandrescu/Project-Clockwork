# CLAUDE.md - Project Clockwork Development Guide

## Project Identity & Context

**Project Codename**: Clockwork  
**Public Description**: "Modern web application platform for real-time collaborative experiences"  
**Actual Project**: Browser-based isometric multiplayer puzzle RPG with AI-powered NPCs and cultural progression systems  
**Development Style**: Solo development with AI assistance, strict quality pipelines, comprehensive automation  
**Target Platform**: Modern web browsers (desktop, mobile, tablet) with offline-first architecture

## Documentation Structure

This CLAUDE.md provides **development-focused guidance**. Additional documentation exists for specific domains:

- **LORE.md** - Complete world building bible (Steamlands geography, race cultures, historical context)
- **MECHANICS.md** - Detailed game mechanics (puzzle types, progression formulas, cultural adaptation algorithms)  
- **CHARACTERS.md** - Character system details (nerd class abilities, stat calculations, equipment systems)
- **CONTENT.md** - Content creation guidelines (quest structures, dialogue examples, brand integration patterns)

**For Claude Code**: When implementing features that involve world lore, game mechanics, or content creation, ask to review the relevant documentation file for complete context and specifications.

## Core Architecture Philosophy

This is an **offline-first, P2P multiplayer game** that runs entirely in the browser with optional cloud synchronization. The architecture prioritizes:

1. **No central server dependency** - Game works completely offline after initial load
2. **Web Workers for heavy processing** - AI inference, database operations, and networking run in background
3. **IndexedDB for complex data** - Rich character progression, NPC relationships, cultural systems
4. **P2P WebRTC networking** - Direct player-to-player connections for multiplayer
5. **Progressive enhancement** - Core game works without internet, enhanced features when online

## Technology Stack Specifications

### Core Dependencies
```json
{
  "phaser": "^3.70.0",           // 2D game engine for isometric rendering
  "typescript": "^5.2.0",        // Strict TypeScript for type safety
  "zustand": "^4.4.0",           // Lightweight state management (vanilla, no React)
  "dexie": "^3.2.4",             // IndexedDB wrapper for complex game data
  "peerjs": "^1.5.0",            // WebRTC P2P networking simplified
  "@xenova/transformers": "^2.6.0", // Browser-based LLM for NPC AI
  "@workos-inc/authkit-js": "^0.4.0", // Optional authentication
  "lodash": "^4.17.21",          // Utilities (tree-shaken imports only)
  "uuid": "^9.0.0",              // Unique identifier generation
  "eventemitter3": "^5.0.0"      // Event system for workers
}
```

### Development Tools
```json
{
  "vite": "^4.5.0",              // Build tool with HMR and worker support
  "@biomejs/biome": "^1.4.0",    // Fast linting/formatting (replaces ESLint+Prettier)
  "vitest": "^0.34.0",           // Fast unit testing
  "@vitejs/plugin-typescript": "^2.1.0"
}
```

**Package Manager**: PNPM (fast, efficient, monorepo-ready)  
**Deployment**: Vercel (static hosting + edge functions for analytics)  
**Version Control**: GitHub with Actions for quality gates

## Detailed Project Structure

```
project-clockwork/
├── src/
│   ├── core/                    # Foundational systems
│   │   ├── stores/             # Zustand state stores
│   │   │   ├── gameStore.ts    # Main game state (characters, world, UI)
│   │   │   ├── npcStore.ts     # NPC relationships and AI state
│   │   │   └── culturalStore.ts # Cultural adaptation tracking
│   │   ├── types/              # TypeScript interfaces and types
│   │   │   ├── character.ts    # Character sheets, progression, equipment
│   │   │   ├── npc.ts          # NPC personalities, relationships, AI
│   │   │   ├── cultural.ts     # Cultural adaptation, item introduction
│   │   │   ├── multiplayer.ts  # P2P networking, sync, conflicts
│   │   │   └── game.ts         # Game state, puzzles, quests
│   │   ├── constants/          # Game configuration and constants
│   │   └── utils/              # Pure utility functions
│   │
│   ├── workers/                 # Web Workers for background processing
│   │   ├── ai-worker.ts        # LLM inference, personality generation
│   │   ├── db-worker.ts        # IndexedDB operations, migrations
│   │   ├── network-worker.ts   # WebRTC management, state sync
│   │   └── cultural-worker.ts  # Cultural system calculations
│   │
│   ├── game/                    # Phaser 3 game implementation
│   │   ├── scenes/             # Phaser scenes
│   │   │   ├── MenuScene.ts    # Main menu and character selection
│   │   │   ├── GameScene.ts    # Core gameplay scene
│   │   │   └── UIScene.ts      # Overlay UI elements
│   │   ├── entities/           # Game entities and sprites
│   │   │   ├── Player.ts       # Player character entity
│   │   │   ├── NPC.ts          # NPC entities with AI integration
│   │   │   └── Puzzle.ts       # Interactive puzzle objects
│   │   └── managers/           # Phaser-specific managers
│   │       ├── InputManager.ts # Multi-input handling (kbd/gamepad/touch)
│   │       └── CameraManager.ts # Isometric camera controls
│   │
│   ├── systems/                 # Core game logic systems
│   │   ├── character/          # Character progression and management
│   │   │   ├── CharacterManager.ts    # CRUD operations, persistence
│   │   │   ├── ProgressionSystem.ts   # XP, leveling, stat calculations
│   │   │   └── EquipmentSystem.ts     # Item management, stat bonuses
│   │   ├── npc/                # NPC AI and relationship systems
│   │   │   ├── NPCManager.ts           # NPC lifecycle, scheduling
│   │   │   ├── RelationshipManager.ts # Trust, conversation history
│   │   │   ├── PersonalitySystem.ts   # AI personality generation
│   │   │   └── DialogueSystem.ts      # Dynamic dialogue with LLM
│   │   ├── cultural/           # Cultural adaptation mechanics
│   │   │   ├── CulturalManager.ts      # Item introduction tracking
│   │   │   ├── AdaptationSystem.ts    # Race-specific adaptation logic
│   │   │   └── CommunitySystem.ts     # Community-wide cultural changes
│   │   ├── auth/               # Authentication and cloud sync
│   │   │   ├── AuthManager.ts          # WorkOS integration
│   │   │   ├── SyncManager.ts          # Cloud/local data synchronization
│   │   │   └── ConflictResolver.ts     # Data conflict resolution
│   │   └── multiplayer/        # P2P networking and coordination
│   │       ├── NetworkManager.ts      # WebRTC connection management
│   │       ├── StateSync.ts           # Game state synchronization
│   │       └── HostMigration.ts       # Host migration handling
│   │
│   ├── ui/                     # Game UI components (non-Phaser)
│   │   ├── menus/              # Menu systems
│   │   ├── dialogs/            # Modal dialogs and popups
│   │   └── hud/                # Heads-up display elements
│   │
│   └── assets/                 # Game assets and data
│       ├── sprites/            # Character and environment sprites
│       ├── audio/              # Music and sound effects
│       └── data/               # JSON configuration files
│
├── public/                     # Static assets served directly
├── docs/                       # Project documentation
├── scripts/                    # Build and development scripts
├── tests/                      # Test files (unit, integration)
│
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
├── biome.json                 # Biome linting/formatting rules
├── vercel.json                # Vercel deployment configuration
├── CLAUDE.md                  # This file (development guide)
├── LORE.md                    # World building, races, cultural systems
├── MECHANICS.md               # Detailed game mechanics and systems
├── CHARACTERS.md              # Character classes, progression, abilities
└── CONTENT.md                 # Quests, dialogues, brand integration
```

## Game Design Context

### Core Concept: Isekai Nerds in Steampunk Fantasy
Players are modern "nerds" (programmers, gamers, anime fans, etc.) who get transported to a steampunk fantasy world. The twist: they can introduce Earth concepts to NPCs who learn and adapt these concepts to their world.

### Character Classes (Nerd Archetypes)
- **Code Wizard**: Programming skills → magical algorithms and debugging spells
- **Anime Protagonist**: Otaku knowledge → combat styles and social understanding  
- **Manga Artist**: Creative skills → world visualization and aesthetic solutions
- **Game Designer**: Systems thinking → complex puzzle solving and optimization
- **Hardware Hacker**: Engineering skills → steampunk machinery operation
- **Data Scientist**: Pattern recognition → analysis and prediction abilities

### Fantasy Races with Steampunk Twist
- **Steam Elves**: Precision-obsessed engineers, beautiful steampunk technology
- **Gear Dwarves**: Pragmatic inventors, "does it work?" mentality
- **Clockwork Fairies**: Tiny mechanical beings, hyper-energetic information brokers
- **Crystal Dragons**: Living supercomputers, collect data instead of gold
- **Verdant Halflings**: Bio-steampunk specialists, grow their technology
- **Ember Orcs**: Steam-powered strength enhancement, honorable industrial workers
- **Mime Demons**: Reality manipulators, silent communication specialists

### Cultural System Mechanics
The core innovation: NPCs learn Earth concepts from players and adapt them:
- **Beer** → Steam Elves perfect the brewing with precision fermentation
- **Sunglasses** → Dwarves turn them into workshop safety gear
- **K-Pop** → Clockwork Fairies create swarm choreography
- Each race adapts concepts differently based on their culture and values

## Technical Implementation Guidelines

### State Management with Zustand
```typescript
// Example store structure
interface GameState {
  // Core game state
  currentState: 'menu' | 'solo' | 'multiplayer' | 'paused';
  currentCharacter: CharacterSheet | null;
  currentLocation: string;
  timeOfDay: number;
  
  // Multiplayer state
  connectedPlayers: Map<string, RemotePlayer>;
  isHost: boolean;
  
  // UI state
  activeDialogue: DialogueState | null;
  notifications: Notification[];
  
  // Actions
  transitionTo: (newState: GameStateType) => Promise<void>;
  addNotification: (notification: Notification) => void;
  // ... more actions
}
```

### Web Worker Communication Pattern
```typescript
// Worker message types
type WorkerMessage = 
  | { type: 'AI_GENERATE_DIALOGUE'; npcId: string; context: DialogueContext }
  | { type: 'DB_SAVE_CHARACTER'; character: CharacterSheet }
  | { type: 'NETWORK_SYNC_STATE'; stateUpdate: GameStateUpdate }
  | { type: 'CULTURAL_UPDATE_ADAPTATION'; itemId: string; raceId: string };

// Always use structured, typed messages between main thread and workers
```

### IndexedDB Schema with Dexie
```typescript
class GameDatabase extends Dexie {
  characters!: Table<CharacterSheet>;
  npcRelationships!: Table<NPCRelationship>;
  culturalAdaptations!: Table<CulturalAdaptation>;
  
  constructor() {
    super('ProjectClockwork');
    
    // Version 1 schema
    this.version(1).stores({
      characters: 'id, name, lastPlayed, stats.level',
      npcRelationships: 'id, playerId, npcId, trustLevel',
      culturalAdaptations: 'id, race, originalItem, adoptionLevel'
    });
  }
}
```

### NPC AI Integration Pattern
```typescript
// NPCs have individual personalities stored per player
interface NPCRelationship {
  playerId: string;
  npcId: string;
  trustLevel: number;        // 0-100
  conversationHistory: ConversationEntry[];
  culturalTeaching: {
    itemsIntroduced: string[];
    adaptationSuccess: string[];
    relationshipMilestones: string[];
  };
  personalityContext: string; // LLM context for this specific relationship
}
```

## Asset Generation & Development Resources

Claude can generate comprehensive placeholder assets for development and testing. This eliminates the need for external art resources during the development phase.

### Visual Assets (SVG-based)
- **Character sprites** - Simple geometric representations of nerd classes
- **NPC sprites** - Distinctive fantasy race representations with color coding
- **Environment tiles** - Isometric tiles for buildings, ground, objects
- **UI elements** - Buttons, panels, icons, health bars, inventory slots
- **Item sprites** - Earth items and their steampunk adaptations
- **Brand assets** - Logos and signage for fictional brand integration

### Data Assets (JSON configuration)
- **Character definitions** - Stats, abilities, progression tables
- **NPC personality templates** - Dialogue patterns, cultural preferences, relationship data
- **Item databases** - Equipment stats, cultural items, brand products
- **Quest configurations** - Puzzle mechanics, objective trees, reward structures
- **World data** - Location descriptions, race relationships, community states

### Asset Generation Commands
```bash
# Core game sprites for immediate development
claude code "Generate complete sprite set for development testing - all 6 character classes, 7 fantasy races, basic UI elements, and essential items. Use consistent SVG format suitable for Phaser 3 loading."

# World data for starting area
claude code "Create comprehensive JSON configuration for 'Steamtown' starting area - 20 NPCs with unique personalities, shop inventories, cultural adaptation states, and available quests."

# Brand integration assets
claude code "Generate fictional brand assets for MVP testing - logos, shop signage, branded items, and NPC dialogue referencing brands. Include steampunk adaptations of Earth brands."
```

### Asset Development Strategy
1. **Phase 1**: Minimum viable assets for core mechanic testing
2. **Phase 2**: Complete asset library for full system integration  
3. **Phase 3**: Polished placeholders ready for professional art replacement

### Technical Specifications
- **Sprite format**: SVG (scalable, small file size, Phaser 3 compatible)
- **Data format**: JSON with TypeScript interfaces for type safety
- **Naming convention**: kebab-case with descriptive prefixes
- **Asset organization**: Structured folders matching game system architecture
- **Documentation**: Each asset includes usage specifications and replacement guidelines

**Important**: All Claude-generated assets are designed as professional placeholders that can be systematically replaced with final art while maintaining the same technical specifications and game functionality.

## Development Workflow & Best Practices

### Code Style & Patterns
- **Use strict TypeScript** - Enable all strict mode flags, no `any` types
- **Functional patterns preferred** - Pure functions, immutable data, avoid classes when possible  
- **Tree-shaking friendly imports** - `import { specific } from 'library'` not `import * as lib`
- **Web Worker isolation** - Heavy processing (AI, DB, networking) must run in workers
- **Error boundaries** - Graceful degradation when systems fail

### Performance Priorities
1. **60fps gameplay** - Main thread stays responsive for Phaser rendering
2. **Offline-first** - Game works without network after initial load  
3. **Progressive loading** - Load AI models and content in background
4. **Memory management** - Clean up Phaser objects, worker resources
5. **Bundle size** - Code splitting for optional features (AI models, etc.)

### Data Persistence Strategy
- **Local-first** - All critical data stored in IndexedDB
- **Optional cloud sync** - Only for users who create accounts
- **Conflict resolution** - Handle sync conflicts gracefully (usually merge/highest value wins)
- **Migration system** - Handle schema changes across game versions
- **Export/import** - Players can backup characters manually

### Multiplayer Architecture
- **P2P WebRTC** - Direct player connections, no central server
- **Host migration** - Seamless transition when host leaves
- **State synchronization** - Regular sync of world state, conflict resolution
- **Graceful degradation** - Fallback to solo play if networking fails

## AI & Content Generation

### NPC Personality System
Each NPC has:
- **Base personality traits** - Defined in JSON configuration
- **Per-player relationship memory** - Stored in IndexedDB per character
- **Cultural learning state** - What Earth concepts they've learned
- **Dynamic dialogue generation** - Uses browser LLM with personality context
- **Fallback dialogue trees** - Static responses when AI unavailable

### Browser LLM Integration
```typescript
// AI Worker handles all LLM operations
interface AIRequest {
  type: 'generate_dialogue';
  npcPersonality: NPCPersonality;
  relationshipContext: NPCRelationship;  
  conversationContext: string;
  maxTokens: number;
}

// Fallback system when LLM fails
interface DialogueBackup {
  template: string;
  personalityVariants: Record<string, string>;
  relationshipVariants: Record<string, string>;
}
```

### Cultural System Implementation
- **Item introduction tracking** - What Earth items each player has shown to which NPCs
- **Race-specific adaptation** - Different races adapt same items differently
- **Community spread** - Popular adaptations spread between NPCs
- **Player reputation** - NPCs share opinions about players' cultural contributions

## Quality & Deployment Pipeline

### Code Quality (GitHub Actions)
```yaml
# Automated quality checks on every push/PR
- Biome linting and formatting
- TypeScript strict type checking
- Vitest unit tests
- Bundle size analysis
- Security scanning (Snyk)
- Accessibility testing (Lighthouse)
```

### Deployment (Vercel)
- **Automatic deployments** - Main branch → production, PRs → preview
- **Static hosting** - No server costs, global CDN
- **Edge functions** - Optional analytics endpoints
- **Performance optimization** - Image optimization, compression, caching

### Development Commands
```bash
# Essential development workflow
pnpm dev              # Start development server with HMR
pnpm build            # Production build with worker compilation
pnpm check            # Run all quality checks (Biome + TypeScript)
pnpm check:fix        # Fix auto-fixable issues
pnpm test             # Run unit tests
pnpm analyze          # Bundle size analysis
```

## Business Model & Content Strategy

### Free-to-Play with In-World Advertising
- **No paywalls or microtransactions** - Completely free game
- **Fictional brands for MVP** - Test advertising integration without real partnerships
- **Environmental integration** - Billboards, shops, branded items that feel natural
- **Cultural brand adaptation** - Earth brands adapted to steampunk fantasy setting

### Example Fictional Brands
- **Crystalsoft** - "Communication crystals and data storage" (Microsoft parody)
- **Starsteam Coffee** - "Premium steambean roasting" (Starbucks parody)  
- **Nyke Adventure Gear** - "Just steam it!" (Nike parody)
- **MacDwarf's** - "Quick gear-grease meals" (McDonald's parody)

## Critical Implementation Notes

### Authentication Strategy
- **Anonymous by default** - No login required, full functionality
- **Optional WorkOS accounts** - For cross-device sync only
- **Local device ID** - Persistent anonymous identification
- **Graceful account creation** - Convert anonymous → registered seamlessly

### Offline Capabilities
- **Core game** - Fully functional without internet
- **AI inference** - Browser-based LLM, no API calls
- **P2P networking** - Direct browser connections
- **Optional features** - Analytics, cloud sync only when online

### Performance Critical Areas
- **Phaser game loop** - Must maintain 60fps
- **AI worker** - LLM inference can't block main thread
- **Database operations** - Complex queries in worker
- **State synchronization** - Efficient multiplayer updates

### Data Migration Strategy
```typescript
// Robust migration system for game updates
interface Migration {
  version: number;
  description: string;
  migrate: (oldData: any) => Promise<any>;
  rollback?: (newData: any) => Promise<any>;
  validate?: (data: any) => boolean;
}
```

## Common Implementation Patterns

### Error Handling
```typescript
// Always graceful degradation
try {
  const aiResponse = await aiWorker.generateDialogue(context);
  return aiResponse;
} catch (error) {
  console.warn('AI generation failed, using fallback:', error);
  return fallbackDialogue.getResponse(context);
}
```

### Worker Communication
```typescript
// Typed message passing between main thread and workers
const sendToWorker = <T>(worker: Worker, message: WorkerMessage): Promise<T> => {
  return new Promise((resolve, reject) => {
    const messageId = uuid();
    // ... structured request/response pattern
  });
};
```

### State Updates
```typescript
// Always use Zustand patterns for state updates
const updateCharacterStats = (characterId: string, statUpdates: Partial<CharacterStats>) => {
  gameStore.setState((state) => ({
    characters: state.characters.map(char => 
      char.id === characterId 
        ? { ...char, stats: { ...char.stats, ...statUpdates }}
        : char
    )
  }));
};
```

This guide serves as the comprehensive reference for all development decisions, architectural patterns, and implementation strategies for Project Clockwork. Always prioritize the offline-first, performance-oriented, type-safe approach outlined here.