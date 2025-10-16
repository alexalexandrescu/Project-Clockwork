# MCP Testing Server

A Model Context Protocol (MCP) server for AI-driven testing of the game engine. Provides headless game sessions that can be controlled through structured commands.

## Features

- **Headless Game Sessions**: Create isolated game instances for testing
- **Command Execution**: Parse and execute game commands
- **State Inspection**: Get detailed game state information
- **Event Tracking**: Track all events that occur during gameplay
- **Session Management**: Automatic cleanup of inactive sessions

## Available Tools

### start_game_session
Start a new headless game session for testing.

**Returns:**
- `sessionId`: Unique session identifier to use with other commands
- `message`: Confirmation message
- `createdAt`: Timestamp of session creation

### send_command
Send a command to a game session and get the results.

**Parameters:**
- `sessionId`: The session ID from start_game_session
- `command`: The command to execute (e.g., 'go north', 'look around', 'talk to innkeeper')

**Returns:**
- `success`: Boolean indicating if command executed successfully
- `parsedCommand`: How the command was interpreted
  - `command`: Parsed command type
  - `args`: Command arguments
  - `confidence`: Parser confidence (0-1)
  - `interpretation`: Human-readable interpretation
- `output`: Command execution output message
- `gameState`: Current state snapshot
  - `stats`: Game statistics
  - `entities`: Entity counts and information
  - `systems`: Active systems status
- `events`: Array of events triggered by the command

### get_game_state
Get the current state of a game session.

**Parameters:**
- `sessionId`: The session ID from start_game_session

**Returns:**
- `sessionId`: Session identifier
- `stats`: Game statistics including FPS, tick count, etc.
- `entities`: Entity information and counts by type
- `systems`: System manager statistics
- `recentEvents`: Last 20 events that occurred
- `createdAt`: Session creation timestamp
- `lastActivity`: Last activity timestamp

### end_session
End a game session and clean up resources.

**Parameters:**
- `sessionId`: The session ID to end

**Returns:**
- `sessionId`: Confirmed session ID
- `message`: Confirmation message

**Note:** Sessions automatically expire after 30 minutes of inactivity.

## Supported Commands

The command parser understands various natural language inputs:

### Movement
- `go north`, `move south`, `walk east`, `run west`
- Shortcuts: `n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`, `u`, `d`

### Inspection
- `look`, `look around`, `examine item`, `inspect npc`, `check building`

### Interaction
- `talk to innkeeper`, `speak with guard`, `chat with merchant`

### Items
- `take item`, `get sword`, `pickup potion`, `pick gold`

### Combat
- `attack goblin`, `fight enemy`, `hit target`

### Inventory
- `inventory`, `inv`, `items`, `bag`

### Quests
- `quests`, `quest`, `objectives`, `missions`

### Party
- `party`, `group`, `team`, `allies`

### System
- `save`, `load`, `help`

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
    "rpg-testing": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "/path/to/packages/mcp-testing/src/index.ts"]
    }
  }
}
```

## Example Session

```typescript
// 1. Start a session
const { sessionId } = await start_game_session();

// 2. Execute commands
await send_command(sessionId, "look around");
await send_command(sessionId, "go north");
await send_command(sessionId, "talk to innkeeper");

// 3. Check game state
const state = await get_game_state(sessionId);

// 4. End session
await end_session(sessionId);
```

## Technical Details

### Browser API Polyfills
The server automatically polyfills browser APIs needed by the game engine:
- `requestAnimationFrame` → `setTimeout`
- `cancelAnimationFrame` → `clearTimeout`

### Session Lifecycle
- Sessions are created on-demand
- Automatic cleanup after 30 minutes of inactivity
- Graceful shutdown on SIGINT

### Game World
Each session runs a fully independent `GameWorld` instance in headless mode:
- No rendering/graphics
- Full entity and system support
- Event bus for tracking all game events
- Database-backed persistence
