#!/usr/bin/env node

/**
 * MCP Content Server
 *
 * Provides tools for managing game content (food items, NPCs, quests, buildings, etc.)
 * through the Model Context Protocol.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to content directory
const CONTENT_DIR = join(__dirname, "../../data/content");

/**
 * Read JSON file from content directory
 */
async function readContentFile(filename: string): Promise<any> {
  const filepath = join(CONTENT_DIR, filename);
  try {
    const content = await fs.readFile(filepath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read ${filename}: ${error}`);
  }
}

/**
 * Write JSON file to content directory with pretty formatting
 */
async function writeContentFile(filename: string, data: any): Promise<void> {
  const filepath = join(CONTENT_DIR, filename);
  try {
    const content = JSON.stringify(data, null, 2) + "\n";
    await fs.writeFile(filepath, content, "utf-8");
  } catch (error) {
    throw new Error(`Failed to write ${filename}: ${error}`);
  }
}

/**
 * Validate food item structure
 */
function validateFoodItem(item: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.id || typeof item.id !== "string") {
    errors.push("Missing or invalid id");
  }
  if (!item.name || typeof item.name !== "string") {
    errors.push("Missing or invalid name");
  }
  if (!item.description || typeof item.description !== "string") {
    errors.push("Missing or invalid description");
  }
  if (typeof item.value !== "number" || item.value < 0) {
    errors.push("Missing or invalid value");
  }
  if (!["common", "uncommon", "rare", "legendary"].includes(item.rarity)) {
    errors.push("Invalid rarity (must be: common, uncommon, rare, legendary)");
  }
  if (!item.effects || typeof item.effects !== "object") {
    errors.push("Missing or invalid effects");
  }
  if (typeof item.stackable !== "boolean") {
    errors.push("Missing or invalid stackable");
  }
  if (typeof item.maxStack !== "number" || item.maxStack < 1) {
    errors.push("Missing or invalid maxStack");
  }
  if (typeof item.weight !== "number" || item.weight < 0) {
    errors.push("Missing or invalid weight");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate NPC structure
 */
function validateNPC(npc: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!npc.id || typeof npc.id !== "string") {
    errors.push("Missing or invalid id");
  }
  if (!npc.name || typeof npc.name !== "string") {
    errors.push("Missing or invalid name");
  }
  if (!npc.type || typeof npc.type !== "string") {
    errors.push("Missing or invalid type");
  }
  if (!npc.locationId || typeof npc.locationId !== "string") {
    errors.push("Missing or invalid locationId");
  }
  if (!npc.personality || typeof npc.personality !== "object") {
    errors.push("Missing or invalid personality");
  }
  if (!npc.appearance || typeof npc.appearance !== "string") {
    errors.push("Missing or invalid appearance");
  }
  if (!npc.dialogue || typeof npc.dialogue !== "object") {
    errors.push("Missing or invalid dialogue");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate quest structure
 */
function validateQuest(quest: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!quest.id || typeof quest.id !== "string") {
    errors.push("Missing or invalid id");
  }
  if (!quest.name || typeof quest.name !== "string") {
    errors.push("Missing or invalid name");
  }
  if (!quest.description || typeof quest.description !== "string") {
    errors.push("Missing or invalid description");
  }
  if (!["tutorial", "fetch", "combat", "exploration", "party"].includes(quest.type)) {
    errors.push("Invalid quest type");
  }
  if (!["beginner", "easy", "medium", "hard", "expert"].includes(quest.difficulty)) {
    errors.push("Invalid difficulty");
  }
  if (!Array.isArray(quest.objectives) || quest.objectives.length === 0) {
    errors.push("Missing or invalid objectives array");
  }
  if (!quest.rewards || typeof quest.rewards !== "object") {
    errors.push("Missing or invalid rewards");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate building structure
 */
function validateBuilding(building: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!building.id || typeof building.id !== "string") {
    errors.push("Missing or invalid id");
  }
  if (!building.name || typeof building.name !== "string") {
    errors.push("Missing or invalid name");
  }
  if (!building.type || typeof building.type !== "string") {
    errors.push("Missing or invalid type");
  }
  if (!building.cityId || typeof building.cityId !== "string") {
    errors.push("Missing or invalid cityId");
  }
  if (!building.description || typeof building.description !== "string") {
    errors.push("Missing or invalid description");
  }
  if (!Array.isArray(building.services) || building.services.length === 0) {
    errors.push("Missing or invalid services array");
  }

  return { valid: errors.length === 0, errors };
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "read_game_data",
    description: "Read game data from a content file (food, npcs, quests, buildings, world, items, types, templates)",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "The content file to read (e.g., 'food', 'npcs', 'quests', 'buildings', 'world', 'items', 'types', 'templates')",
        },
      },
      required: ["file"],
    },
  },
  {
    name: "add_food_item",
    description: "Add a new food item to the game",
    inputSchema: {
      type: "object",
      properties: {
        item: {
          type: "object",
          description: "Food item object with id, name, description, value, rarity, effects, stackable, maxStack, weight",
        },
      },
      required: ["item"],
    },
  },
  {
    name: "add_npc",
    description: "Add a new NPC to the game",
    inputSchema: {
      type: "object",
      properties: {
        npc: {
          type: "object",
          description: "NPC object with id, name, type, locationId, personality, appearance, dialogue, schedule, etc.",
        },
      },
      required: ["npc"],
    },
  },
  {
    name: "generate_quest",
    description: "Add a new quest to the game",
    inputSchema: {
      type: "object",
      properties: {
        quest: {
          type: "object",
          description: "Quest object with id, name, description, type, difficulty, objectives, rewards, dialogue",
        },
      },
      required: ["quest"],
    },
  },
  {
    name: "add_building",
    description: "Add a new building to a city",
    inputSchema: {
      type: "object",
      properties: {
        building: {
          type: "object",
          description: "Building object with id, name, type, cityId, description, services, occupants",
        },
      },
      required: ["building"],
    },
  },
  {
    name: "modify_realm",
    description: "Modify or add a realm in the world data",
    inputSchema: {
      type: "object",
      properties: {
        realm: {
          type: "object",
          description: "Realm object with id, name, theme, description, level, recommendedLevel, climate, cities, lore",
        },
      },
      required: ["realm"],
    },
  },
  {
    name: "list_realms",
    description: "List all realms in the game world",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_cities",
    description: "List all cities in the game world or filter by realm",
    inputSchema: {
      type: "object",
      properties: {
        realmId: {
          type: "string",
          description: "Optional realm ID to filter cities by",
        },
      },
    },
  },
  {
    name: "get_world_schema",
    description: "Get the schema/structure of world data including examples",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "rpg-content-server",
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
      case "read_game_data": {
        const file = (args as any).file;
        const filename = file.endsWith(".json") ? file : `${file}.json`;
        const data = await readContentFile(filename);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "add_food_item": {
        const item = (args as any).item;
        const validation = validateFoodItem(item);

        if (!validation.valid) {
          return {
            content: [
              {
                type: "text",
                text: `Validation failed:\n${validation.errors.join("\n")}`,
              },
            ],
            isError: true,
          };
        }

        const data = await readContentFile("food.json");

        // Check for duplicate ID
        if (data.foods.some((f: any) => f.id === item.id)) {
          return {
            content: [
              {
                type: "text",
                text: `Food item with id "${item.id}" already exists`,
              },
            ],
            isError: true,
          };
        }

        data.foods.push(item);
        await writeContentFile("food.json", data);

        return {
          content: [
            {
              type: "text",
              text: `Successfully added food item: ${item.name} (${item.id})`,
            },
          ],
        };
      }

      case "add_npc": {
        const npc = (args as any).npc;
        const validation = validateNPC(npc);

        if (!validation.valid) {
          return {
            content: [
              {
                type: "text",
                text: `Validation failed:\n${validation.errors.join("\n")}`,
              },
            ],
            isError: true,
          };
        }

        const data = await readContentFile("npcs.json");

        // Check for duplicate ID
        if (data.npcs.some((n: any) => n.id === npc.id)) {
          return {
            content: [
              {
                type: "text",
                text: `NPC with id "${npc.id}" already exists`,
              },
            ],
            isError: true,
          };
        }

        data.npcs.push(npc);
        await writeContentFile("npcs.json", data);

        return {
          content: [
            {
              type: "text",
              text: `Successfully added NPC: ${npc.name} (${npc.id})`,
            },
          ],
        };
      }

      case "generate_quest": {
        const quest = (args as any).quest;
        const validation = validateQuest(quest);

        if (!validation.valid) {
          return {
            content: [
              {
                type: "text",
                text: `Validation failed:\n${validation.errors.join("\n")}`,
              },
            ],
            isError: true,
          };
        }

        const data = await readContentFile("quests.json");

        // Check for duplicate ID
        if (data.quests.some((q: any) => q.id === quest.id)) {
          return {
            content: [
              {
                type: "text",
                text: `Quest with id "${quest.id}" already exists`,
              },
            ],
            isError: true,
          };
        }

        data.quests.push(quest);
        await writeContentFile("quests.json", data);

        return {
          content: [
            {
              type: "text",
              text: `Successfully added quest: ${quest.name} (${quest.id})`,
            },
          ],
        };
      }

      case "add_building": {
        const building = (args as any).building;
        const validation = validateBuilding(building);

        if (!validation.valid) {
          return {
            content: [
              {
                type: "text",
                text: `Validation failed:\n${validation.errors.join("\n")}`,
              },
            ],
            isError: true,
          };
        }

        const data = await readContentFile("world.json");

        // Check for duplicate ID
        if (data.buildings.some((b: any) => b.id === building.id)) {
          return {
            content: [
              {
                type: "text",
                text: `Building with id "${building.id}" already exists`,
              },
            ],
            isError: true,
          };
        }

        // Verify cityId exists
        const cityExists = data.cities.some((c: any) => c.id === building.cityId);
        if (!cityExists) {
          return {
            content: [
              {
                type: "text",
                text: `City with id "${building.cityId}" does not exist`,
              },
            ],
            isError: true,
          };
        }

        data.buildings.push(building);

        // Add building to city's buildings array
        const city = data.cities.find((c: any) => c.id === building.cityId);
        if (city && city.buildings) {
          city.buildings.push(building.id);
        }

        await writeContentFile("world.json", data);

        return {
          content: [
            {
              type: "text",
              text: `Successfully added building: ${building.name} (${building.id}) to ${building.cityId}`,
            },
          ],
        };
      }

      case "modify_realm": {
        const realm = (args as any).realm;

        if (!realm.id || !realm.name) {
          return {
            content: [
              {
                type: "text",
                text: "Realm must have at least id and name",
              },
            ],
            isError: true,
          };
        }

        const data = await readContentFile("world.json");
        const existingIndex = data.realms.findIndex((r: any) => r.id === realm.id);

        if (existingIndex >= 0) {
          // Update existing realm
          data.realms[existingIndex] = { ...data.realms[existingIndex], ...realm };
          await writeContentFile("world.json", data);
          return {
            content: [
              {
                type: "text",
                text: `Successfully updated realm: ${realm.name} (${realm.id})`,
              },
            ],
          };
        } else {
          // Add new realm
          data.realms.push(realm);
          await writeContentFile("world.json", data);
          return {
            content: [
              {
                type: "text",
                text: `Successfully added new realm: ${realm.name} (${realm.id})`,
              },
            ],
          };
        }
      }

      case "list_realms": {
        const data = await readContentFile("world.json");
        const realmList = data.realms.map((r: any) => ({
          id: r.id,
          name: r.name,
          theme: r.theme,
          level: r.level,
          cities: r.cities,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(realmList, null, 2),
            },
          ],
        };
      }

      case "list_cities": {
        const realmId = (args as any).realmId;
        const data = await readContentFile("world.json");

        let cities = data.cities;
        if (realmId) {
          cities = cities.filter((c: any) => c.realmId === realmId);
        }

        const cityList = cities.map((c: any) => ({
          id: c.id,
          name: c.name,
          realmId: c.realmId,
          population: c.population,
          buildingCount: c.buildings ? c.buildings.length : 0,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cityList, null, 2),
            },
          ],
        };
      }

      case "get_world_schema": {
        const schema = {
          description: "World data structure for the RPG game",
          realms: {
            structure: {
              id: "string (unique identifier)",
              name: "string (display name)",
              theme: "string (e.g., 'medieval', 'desert-coastal')",
              description: "string (detailed description)",
              level: "string (e.g., 'starter', 'mid-level')",
              recommendedLevel: "string (e.g., '1-10')",
              climate: "string (e.g., 'temperate', 'hot desert')",
              cities: "string[] (array of city IDs)",
              lore: "string (background story)",
            },
          },
          cities: {
            structure: {
              id: "string (unique identifier)",
              name: "string (display name)",
              realmId: "string (parent realm ID)",
              description: "string (detailed description)",
              population: "number",
              climate: "string",
              government: "string",
              notable: "string (notable features)",
              buildings: "string[] (array of building IDs)",
              atmosphere: "string",
              safeZone: "boolean",
            },
          },
          buildings: {
            structure: {
              id: "string (unique identifier)",
              name: "string (display name)",
              type: "string (e.g., 'tavern', 'blacksmith')",
              cityId: "string (parent city ID)",
              description: "string (detailed description)",
              services: "string[] (available services)",
              occupants: "string[] (NPC IDs)",
              interiorDescription: "string",
              openHours: "string",
              specialties: "string[]",
            },
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(schema, null, 2),
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

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RPG Content MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
