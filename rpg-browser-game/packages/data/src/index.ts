/**
 * @rpg/data - Game Content Data Loader
 *
 * This module provides functions to load all game content data from JSON files.
 * It handles loading, parsing, and exporting game data for entities, items, quests, etc.
 */

import typesData from '../content/types.json';
import templatesData from '../content/templates.json';
import buildingsData from '../content/buildings.json';
import worldData from '../content/world.json';
import npcsData from '../content/npcs.json';
import itemsData from '../content/items.json';
import foodData from '../content/food.json';
import questsData from '../content/quests.json';

// Type definitions for game data structures
export interface EntityType {
  description: string;
  required: string[];
  properties: Record<string, any>;
}

export interface NPCTemplate {
  type: string;
  personality: {
    traits: string[];
    mood: string;
  };
  baseDialogue?: {
    greeting: string[];
    topics: Record<string, string[]>;
    farewell: string[];
  };
  schedule?: Array<{
    time: string;
    action: string;
    location: string;
  }>;
  stats?: {
    health?: number;
    attack?: number;
    defense?: number;
    level?: number;
  };
  loot?: {
    gold: { min: number; max: number };
    items: string[];
    dropRate: number;
  };
  behavior?: string;
  experience?: number;
}

export interface NPC {
  id: string;
  name: string;
  type: string;
  templateId?: string;
  locationId: string;
  personality: {
    traits: string[];
    mood: string;
  };
  appearance?: string;
  dialogue: {
    greeting: string[];
    topics: Record<string, string[]>;
    farewell: string[];
  };
  schedule: Array<{
    time: string;
    action: string;
    location: string;
  }>;
  inventory?: string[];
  stats?: {
    health?: number;
    attack?: number;
    defense?: number;
    level?: number;
  };
  services?: string[];
  merchantType?: string;
  questGiver?: boolean;
  quests?: string[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  rarity: string;
  value: number;
  stackable: boolean;
  maxStack?: number;
  stats?: Record<string, any>;
  effects?: Array<{
    type: string;
    value: number;
    duration?: number;
    trigger?: string;
  }>;
  requirements?: {
    level?: number;
    strength?: number;
    intelligence?: number;
  };
  weight: number;
}

export interface Food {
  id: string;
  name: string;
  description: string;
  value: number;
  rarity: string;
  effects: {
    health?: number;
    stamina?: number;
    mana?: number;
    buffs?: Array<{
      stat: string;
      value: number;
      duration: number;
    }>;
  };
  stackable: boolean;
  maxStack: number;
  weight: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: string;
  difficulty: string;
  questGiverId: string;
  locationId: string;
  requiredLevel: number;
  partySize?: number;
  objectives: Array<{
    type: string;
    target: string;
    count: number;
    description: string;
    optional?: boolean;
  }>;
  rewards: {
    gold: number;
    experience: number;
    items?: string[];
    reputation?: number;
  };
  bonusRewards?: {
    gold?: number;
    experience?: number;
    items?: string[];
    condition: string;
  };
  dialogue: {
    start: string;
    progress: string;
    complete: string;
  };
  prerequisites?: string[];
  recommendedPartySize?: number;
  hints?: string[];
  teachingPoints?: string[];
}

export interface Building {
  id: string;
  name: string;
  type: string;
  cityId: string;
  description: string;
  services: string[];
  occupants: string[];
  interiorDescription: string;
  openHours?: string;
  specialties?: string[];
}

export interface City {
  id: string;
  name: string;
  realmId: string;
  description: string;
  population: number;
  climate: string;
  government: string;
  notable: string;
  buildings: string[];
  atmosphere: string;
  safeZone: boolean;
}

export interface Realm {
  id: string;
  name: string;
  theme: string;
  description: string;
  level: string;
  recommendedLevel: string;
  climate: string;
  cities: string[];
  lore: string;
}

export interface BuildingType {
  name: string;
  description: string;
  services: string[];
  defaultOccupants: string[];
  interiorElements: string[];
  atmosphere: string;
  typicalItems: string[];
}

// Data loading functions
export function loadTypes() {
  return typesData;
}

export function loadTemplates() {
  return templatesData;
}

export function loadBuildings() {
  return buildingsData;
}

export function loadWorld() {
  return worldData;
}

export function loadNPCs(): { npcs: NPC[] } {
  return npcsData as { npcs: NPC[] };
}

export function loadItems(): { items: Item[]; itemSets: Record<string, string[]> } {
  return itemsData as { items: Item[]; itemSets: Record<string, string[]> };
}

export function loadFood(): { foods: Food[]; foodCategories: Record<string, string[]>; foodByLocation: Record<string, string[]> } {
  return foodData as { foods: Food[]; foodCategories: Record<string, string[]>; foodByLocation: Record<string, string[]> };
}

export function loadQuests(): { quests: Quest[]; questCategories: Record<string, string[]>; questChains: Record<string, string[]> } {
  return questsData as { quests: Quest[]; questCategories: Record<string, string[]>; questChains: Record<string, string[]> };
}

// Utility functions for querying data

/**
 * Get an NPC by ID
 */
export function getNPCById(id: string): NPC | undefined {
  const { npcs } = loadNPCs();
  return npcs.find(npc => npc.id === id);
}

/**
 * Get NPCs by location
 */
export function getNPCsByLocation(locationId: string): NPC[] {
  const { npcs } = loadNPCs();
  return npcs.filter(npc => npc.locationId === locationId);
}

/**
 * Get NPCs by type
 */
export function getNPCsByType(type: string): NPC[] {
  const { npcs } = loadNPCs();
  return npcs.filter(npc => npc.type === type);
}

/**
 * Get quest givers
 */
export function getQuestGivers(): NPC[] {
  const { npcs } = loadNPCs();
  return npcs.filter(npc => npc.questGiver === true);
}

/**
 * Get an item by ID
 */
export function getItemById(id: string): Item | undefined {
  const { items } = loadItems();
  return items.find(item => item.id === id);
}

/**
 * Get items by type
 */
export function getItemsByType(type: string): Item[] {
  const { items } = loadItems();
  return items.filter(item => item.type === type);
}

/**
 * Get items by rarity
 */
export function getItemsByRarity(rarity: string): Item[] {
  const { items } = loadItems();
  return items.filter(item => item.rarity === rarity);
}

/**
 * Get a quest by ID
 */
export function getQuestById(id: string): Quest | undefined {
  const { quests } = loadQuests();
  return quests.find(quest => quest.id === id);
}

/**
 * Get quests by difficulty
 */
export function getQuestsByDifficulty(difficulty: string): Quest[] {
  const { quests } = loadQuests();
  return quests.filter(quest => quest.difficulty === difficulty);
}

/**
 * Get quests by type
 */
export function getQuestsByType(type: string): Quest[] {
  const { quests } = loadQuests();
  return quests.filter(quest => quest.type === type);
}

/**
 * Get quests available at a given level
 */
export function getQuestsForLevel(level: number): Quest[] {
  const { quests } = loadQuests();
  return quests.filter(quest => quest.requiredLevel <= level);
}

/**
 * Get a building by ID
 */
export function getBuildingById(id: string): Building | undefined {
  const { buildings } = loadWorld();
  return buildings.find(building => building.id === id);
}

/**
 * Get buildings by city
 */
export function getBuildingsByCity(cityId: string): Building[] {
  const { buildings } = loadWorld();
  return buildings.filter(building => building.cityId === cityId);
}

/**
 * Get a city by ID
 */
export function getCityById(id: string): City | undefined {
  const { cities } = loadWorld();
  return cities.find(city => city.id === id);
}

/**
 * Get cities by realm
 */
export function getCitiesByRealm(realmId: string): City[] {
  const { cities } = loadWorld();
  return cities.filter(city => city.realmId === realmId);
}

/**
 * Get a realm by ID
 */
export function getRealmById(id: string): Realm | undefined {
  const { realms } = loadWorld();
  return realms.find(realm => realm.id === id);
}

/**
 * Get all realms
 */
export function getAllRealms(): Realm[] {
  const { realms } = loadWorld();
  return realms;
}

/**
 * Get food by ID
 */
export function getFoodById(id: string): Food | undefined {
  const { foods } = loadFood();
  return foods.find(food => food.id === id);
}

/**
 * Get food by location
 */
export function getFoodByLocation(locationName: string): Food[] {
  const { foods, foodByLocation } = loadFood();
  const foodIds = foodByLocation[locationName] || [];
  return foods.filter(food => foodIds.includes(food.id));
}

/**
 * Get NPC template by ID
 */
export function getTemplateById(id: string): NPCTemplate | undefined {
  const templates = loadTemplates();
  return templates.npcTemplates?.[id] || templates.enemyTemplates?.[id];
}

/**
 * Get building type by ID
 */
export function getBuildingTypeById(id: string): BuildingType | undefined {
  const { buildingTypes } = loadBuildings();
  return buildingTypes[id];
}

/**
 * Load all game data at once
 */
export function loadAllGameData() {
  return {
    types: loadTypes(),
    templates: loadTemplates(),
    buildings: loadBuildings(),
    world: loadWorld(),
    npcs: loadNPCs(),
    items: loadItems(),
    food: loadFood(),
    quests: loadQuests(),
  };
}

// Export all data as named exports for convenience
export const gameData = {
  types: typesData,
  templates: templatesData,
  buildings: buildingsData,
  world: worldData,
  npcs: npcsData,
  items: itemsData,
  food: foodData,
  quests: questsData,
};

// Default export
export default {
  loadTypes,
  loadTemplates,
  loadBuildings,
  loadWorld,
  loadNPCs,
  loadItems,
  loadFood,
  loadQuests,
  getNPCById,
  getNPCsByLocation,
  getNPCsByType,
  getQuestGivers,
  getItemById,
  getItemsByType,
  getItemsByRarity,
  getQuestById,
  getQuestsByDifficulty,
  getQuestsByType,
  getQuestsForLevel,
  getBuildingById,
  getBuildingsByCity,
  getCityById,
  getCitiesByRealm,
  getRealmById,
  getAllRealms,
  getFoodById,
  getFoodByLocation,
  getTemplateById,
  getBuildingTypeById,
  loadAllGameData,
  gameData,
};
