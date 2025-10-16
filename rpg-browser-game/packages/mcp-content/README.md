# MCP Content Server

A Model Context Protocol (MCP) server for managing game content including food items, NPCs, quests, buildings, and world data.

## Features

- **Content Management**: Add and modify game content through structured tools
- **Schema Validation**: Automatic validation of content structure
- **Pretty Formatting**: JSON files are automatically formatted with proper indentation
- **Safe Operations**: Duplicate ID detection and relationship validation

## Available Tools

### read_game_data
Read game data from content files.

**Parameters:**
- `file`: The content file to read (e.g., 'food', 'npcs', 'quests', 'buildings', 'world', 'items', 'types', 'templates')

### add_food_item
Add a new food item to the game.

**Parameters:**
- `item`: Food item object with required fields:
  - `id`: Unique identifier
  - `name`: Display name
  - `description`: Detailed description
  - `value`: Gold value (number)
  - `rarity`: "common" | "uncommon" | "rare" | "legendary"
  - `effects`: Object with stat effects (health, stamina, mana, buffs)
  - `stackable`: Boolean
  - `maxStack`: Number
  - `weight`: Number

### add_npc
Add a new NPC to the game.

**Parameters:**
- `npc`: NPC object with required fields:
  - `id`: Unique identifier
  - `name`: Display name
  - `type`: NPC type
  - `locationId`: Building/location ID
  - `personality`: Object with traits and mood
  - `appearance`: Description string
  - `dialogue`: Object with greeting, topics, farewell
  - `schedule`: Optional array of scheduled actions

### generate_quest
Add a new quest to the game.

**Parameters:**
- `quest`: Quest object with required fields:
  - `id`: Unique identifier
  - `name`: Display name
  - `description`: Detailed description
  - `type`: "tutorial" | "fetch" | "combat" | "exploration" | "party"
  - `difficulty`: "beginner" | "easy" | "medium" | "hard" | "expert"
  - `objectives`: Array of quest objectives
  - `rewards`: Object with gold, experience, items, reputation

### add_building
Add a new building to a city.

**Parameters:**
- `building`: Building object with required fields:
  - `id`: Unique identifier
  - `name`: Display name
  - `type`: Building type
  - `cityId`: Parent city ID
  - `description`: Detailed description
  - `services`: Array of services provided
  - `occupants`: Array of NPC IDs

### modify_realm
Modify or add a realm in the world data.

**Parameters:**
- `realm`: Realm object with required fields:
  - `id`: Unique identifier
  - `name`: Display name
  - `theme`: Theme string
  - `description`: Detailed description
  - `level`: Starter/mid-level/high-level
  - `recommendedLevel`: Level range string
  - `climate`: Climate description
  - `cities`: Array of city IDs
  - `lore`: Background story

### list_realms
List all realms in the game world.

Returns: Array of realm summaries with id, name, theme, level, and cities.

### list_cities
List all cities in the game world, optionally filtered by realm.

**Parameters:**
- `realmId`: Optional realm ID to filter cities

Returns: Array of city summaries with id, name, realmId, population, and building count.

### get_world_schema
Get the schema/structure of world data including examples.

Returns: Object describing the structure of realms, cities, and buildings.

## Usage

To run the server:

```bash
pnpm run start
```

The server runs on stdio and can be integrated with Claude Desktop or other MCP clients.

## Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "rpg-content": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "/path/to/packages/mcp-content/src/index.ts"]
    }
  }
}
```
