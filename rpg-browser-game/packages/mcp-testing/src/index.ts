#!/usr/bin/env node

/**
 * MCP Testing Server
 *
 * Provides tools for AI-driven testing of the game engine through
 * the Model Context Protocol.
 */

// Polyfill browser APIs for Node.js environment
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (callback: any) => {
    return setTimeout(() => callback(Date.now()), 16) as any;
  };
}

if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = (id: any) => {
    clearTimeout(id);
  };
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { GameWorld } from "@rpg/engine";
import { CommandParser } from "@rpg/engine";

/**
 * Game session for testing
 */
interface GameSession {
  id: string;
  world: GameWorld;
  parser: CommandParser;
  createdAt: number;
  lastActivity: number;
  events: any[];
}

// Active game sessions
const sessions = new Map<string, GameSession>();

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean up old sessions
 */
function cleanupOldSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      session.world.shutdown().catch(console.error);
      sessions.delete(id);
      console.error(`Cleaned up session: ${id}`);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldSessions, 5 * 60 * 1000);

/**
 * Create a new game session
 */
async function createSession(): Promise<GameSession> {
  const id = generateSessionId();
  const world = new GameWorld({ headless: true });
  const parser = new CommandParser();

  // Initialize the game world
  await world.initialize();

  const session: GameSession = {
    id,
    world,
    parser,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    events: [],
  };

  sessions.set(id, session);
  console.error(`Created session: ${id}`);

  return session;
}

/**
 * Get session by ID
 */
function getSession(sessionId: string): GameSession | null {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
    return session;
  }
  return null;
}

/**
 * Execute a command in a session
 */
async function executeCommand(
  sessionId: string,
  commandText: string
): Promise<{
  success: boolean;
  output: string;
  gameState: any;
  events: any[];
  parsedCommand?: any;
}> {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Parse the command
  const parsedCommand = session.parser.parse(commandText);

  // Subscribe to events
  const commandEvents: any[] = [];
  const unsubscribe = session.world.eventBus.subscribe("*", (event) => {
    commandEvents.push(event);
  });

  try {
    // Execute the command through the game world
    const result = await session.world.executeCommand({
      command: parsedCommand.command,
      args: parsedCommand.args,
    });

    // Store events in session
    session.events.push(...commandEvents);

    // Get current game state
    const gameState = {
      stats: session.world.getStats(),
      entities: session.world.entityManager.getStats(),
      systems: session.world.systemManager.getStats(),
    };

    unsubscribe();

    return {
      success: result.success,
      output: result.message,
      gameState,
      events: commandEvents,
      parsedCommand: {
        command: parsedCommand.command,
        args: parsedCommand.args,
        confidence: parsedCommand.confidence,
        interpretation: parsedCommand.interpretation,
      },
    };
  } catch (error) {
    unsubscribe();
    throw error;
  }
}

/**
 * Get current game state for a session
 */
function getGameState(sessionId: string): any {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  return {
    sessionId: session.id,
    stats: session.world.getStats(),
    entities: {
      total: session.world.entityManager.getAll().length,
      byType: session.world.entityManager.getStats(),
    },
    systems: session.world.systemManager.getStats(),
    recentEvents: session.events.slice(-20), // Last 20 events
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
  };
}

/**
 * End a game session
 */
async function endSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  await session.world.shutdown();
  sessions.delete(sessionId);
  console.error(`Ended session: ${sessionId}`);
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "start_game_session",
    description:
      "Start a new headless game session for testing. Returns a session ID to use with other commands.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "send_command",
    description:
      "Send a command to a game session and get the results. Commands are parsed and executed in the game world.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID from start_game_session",
        },
        command: {
          type: "string",
          description:
            "The command to execute (e.g., 'go north', 'look around', 'talk to innkeeper')",
        },
      },
      required: ["sessionId", "command"],
    },
  },
  {
    name: "get_game_state",
    description:
      "Get the current state of a game session including stats, entities, systems, and recent events.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID from start_game_session",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "end_session",
    description:
      "End a game session and clean up resources. Session will automatically expire after 30 minutes of inactivity.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID to end",
        },
      },
      required: ["sessionId"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "rpg-testing-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "start_game_session": {
        const session = await createSession();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  sessionId: session.id,
                  message: "Game session started successfully",
                  createdAt: session.createdAt,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "send_command": {
        const sessionId = (args as any).sessionId;
        const command = (args as any).command;

        if (!sessionId || !command) {
          return {
            content: [
              {
                type: "text",
                text: "Missing required parameters: sessionId and command",
              },
            ],
            isError: true,
          };
        }

        const result = await executeCommand(sessionId, command);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: result.success,
                  parsedCommand: result.parsedCommand,
                  output: result.output,
                  gameState: result.gameState,
                  events: result.events,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_game_state": {
        const sessionId = (args as any).sessionId;

        if (!sessionId) {
          return {
            content: [
              {
                type: "text",
                text: "Missing required parameter: sessionId",
              },
            ],
            isError: true,
          };
        }

        const state = getGameState(sessionId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(state, null, 2),
            },
          ],
        };
      }

      case "end_session": {
        const sessionId = (args as any).sessionId;

        if (!sessionId) {
          return {
            content: [
              {
                type: "text",
                text: "Missing required parameter: sessionId",
              },
            ],
            isError: true,
          };
        }

        await endSession(sessionId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  sessionId,
                  message: "Session ended successfully",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down...");
  for (const [id, session] of sessions.entries()) {
    await session.world.shutdown();
    console.error(`Shut down session: ${id}`);
  }
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RPG Testing MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
