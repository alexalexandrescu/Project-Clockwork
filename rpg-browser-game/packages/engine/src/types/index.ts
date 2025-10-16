/**
 * Core type definitions for the game engine
 */

export interface Entity {
  id: string;
  type: string;
  components: Record<string, Component>;
}

export type Component = Record<string, any>;

export interface EntityQuery {
  type?: string;
  realm?: string;
  city?: string;
  hasComponent?: string[];
  where?: (entity: Entity) => boolean;
}

export interface GameEvent {
  type: string;
  data: any;
  timestamp: number;
  source?: string;
}

export interface SystemUpdateContext {
  deltaTime: number;
  totalTime: number;
  tickCount: number;
}

export type EventCallback = (event: GameEvent) => void;

export type SystemPhase = 'preUpdate' | 'earlyUpdate' | 'update' | 'lateUpdate' | 'postUpdate';

/**
 * Common component interfaces
 */

export interface IdentityComponent {
  name: string;
  title?: string;
  description?: string;
}

export interface PositionComponent {
  realm: string;
  city: string;
  building?: string;
  room?: string;
}

export interface StatsComponent {
  health: number;
  maxHealth: number;
  mana?: number;
  maxMana?: number;
  stamina?: number;
  maxStamina?: number;
  strength?: number;
  agility?: number;
  intelligence?: number;
  charisma?: number;
}

export interface InventoryComponent {
  items: string[]; // entity IDs
  capacity: number;
  gold: number;
}

export interface ScheduleComponent {
  activities: Array<{
    hour: number;
    action: string;
    location?: PositionComponent;
    duration?: number;
  }>;
  currentActivity?: string;
}

export interface BusinessComponent {
  type: 'tavern' | 'shop' | 'blacksmith' | 'temple' | 'guild';
  inventory?: string[]; // Items for sale
  services?: string[];
  isOpen: boolean;
  openHours: { start: number; end: number };
  priceModifier: number;
}

export interface DialogueComponent {
  greeting: string;
  farewell: string;
  conversations: Record<string, {
    prompt: string;
    response: string;
    conditions?: any;
    effects?: any;
  }>;
}

export interface QuestComponent {
  questId: string;
  objectives: Record<string, {
    description: string;
    required: number;
    current: number;
    completed: boolean;
  }>;
  rewards: {
    gold?: number;
    experience?: number;
    items?: string[];
    reputation?: Record<string, number>;
  };
  isPartyQuest?: boolean;
}

export interface CombatComponent {
  attackPower: number;
  defense: number;
  isHostile: boolean;
  target?: string;
  skills?: Array<{
    id: string;
    name: string;
    damage: number;
    manaCost: number;
    cooldown: number;
  }>;
}

export interface ItemComponent {
  itemType: 'weapon' | 'armor' | 'consumable' | 'quest' | 'misc';
  value: number;
  weight: number;
  stackable: boolean;
  maxStack?: number;
  effects?: Record<string, any>;
  equipSlot?: 'weapon' | 'head' | 'chest' | 'legs' | 'feet' | 'accessory';
}

export interface CraftableComponent {
  recipe: Array<{
    itemId: string;
    quantity: number;
  }>;
  craftingSkill: string;
  craftingLevel: number;
  craftingTime: number;
}

export interface PropertiesComponent {
  [key: string]: any;
}

export interface EffectsComponent {
  onConsume?: {
    health?: number;
    mana?: number;
    stamina?: number;
    buffs?: Array<{
      type: string;
      value: number;
      duration: number;
    }>;
  };
}

export interface AIComponent {
  personality: 'friendly' | 'neutral' | 'hostile' | 'cowardly' | 'aggressive';
  state: 'idle' | 'patrolling' | 'pursuing' | 'fleeing' | 'attacking';
  awarenessRadius: number;
  memory: Array<{
    type: string;
    entityId: string;
    timestamp: number;
    details: any;
  }>;
}
