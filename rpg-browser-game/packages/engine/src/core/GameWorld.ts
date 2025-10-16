import { EntityManager } from './EntityManager.ts';
import { EventBus } from './EventBus.ts';
import { SystemManager } from './SystemManager.ts';
import { GameLoop } from './GameLoop.ts';
import { TypeRegistry } from './TypeRegistry.ts';
import { EntityFactory } from './EntityFactory.ts';
import { db } from '../db/GameDatabase.ts';
import type { Entity, SystemUpdateContext } from '../types/index.ts';

export interface GameWorldOptions {
  headless?: boolean;
  targetFPS?: number;
}

/**
 * Main game world controller
 * Orchestrates all game systems, entities, and the game loop
 */
export class GameWorld {
  // Core managers
  public readonly entityManager: EntityManager;
  public readonly eventBus: EventBus;
  public readonly systemManager: SystemManager;
  public readonly typeRegistry: TypeRegistry;
  public readonly entityFactory: EntityFactory;
  public readonly database = db;

  // Game loop
  private gameLoop: GameLoop;
  private headless: boolean;

  // State
  private initialized: boolean = false;
  private paused: boolean = false;

  constructor(options: GameWorldOptions = {}) {
    this.headless = options.headless || false;
    
    // Initialize core managers
    this.entityManager = new EntityManager();
    this.eventBus = new EventBus();
    this.systemManager = new SystemManager();
    this.typeRegistry = new TypeRegistry();
    this.entityFactory = new EntityFactory(this.typeRegistry);

    // Create game loop
    this.gameLoop = new GameLoop(
      (context) => this.update(context),
      options.targetFPS || 60
    );

    console.log('GameWorld created', { headless: this.headless });
  }

  /**
   * Initialize the game world
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('GameWorld already initialized');
      return;
    }

    console.log('Initializing GameWorld...');

    try {
      await this.loadEntitiesFromDatabase();
      this.initialized = true;
      console.log('GameWorld initialized successfully');
      this.eventBus.emit('world:initialized');
    } catch (error) {
      console.error('Failed to initialize GameWorld:', error);
      throw error;
    }
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (!this.initialized) {
      throw new Error('GameWorld must be initialized before starting');
    }

    if (this.gameLoop.isActive()) {
      console.warn('GameWorld is already running');
      return;
    }

    this.gameLoop.start();
    this.eventBus.emit('world:started');
    console.log('GameWorld started');
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.gameLoop.stop();
    this.eventBus.emit('world:stopped');
    console.log('GameWorld stopped');
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.paused = true;
    this.eventBus.emit('world:paused');
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.paused = false;
    this.eventBus.emit('world:resumed');
  }

  /**
   * Main update function
   */
  private update(context: SystemUpdateContext): void {
    if (this.paused) return;
    this.systemManager.update(context);
  }

  /**
   * Execute a command
   */
  async executeCommand(command: {
    command: string;
    args: string[];
    playerId?: string;
  }): Promise<{ success: boolean; message: string; events?: any[] }> {
    try {
      const events: any[] = [];
      const unsubscribe = this.eventBus.subscribe('*', (event) => {
        events.push(event);
      });

      this.eventBus.emit('command:executed', command);
      unsubscribe();

      return { success: true, message: 'Command executed', events };
    } catch (error) {
      return { success: false, message: `Command failed: ${error}` };
    }
  }

  /**
   * Save game state
   */
  async save(saveName: string): Promise<void> {
    console.log('Saving game...');
    const saveId = 'save_' + Date.now();
    const entities = this.entityManager.getAll();
    const dbEntities = entities.map(entity => ({
      id: entity.id,
      type: entity.type,
      components: entity.components,
      updatedAt: Date.now(),
    }));

    await this.database.bulkPutEntities(dbEntities);
    await this.database.saves.add({
      id: saveId,
      name: saveName,
      timestamp: Date.now(),
      playerData: {},
      worldState: {
        tickCount: this.gameLoop.getTickCount(),
        totalTime: this.gameLoop.getTotalTime(),
      },
    });

    this.eventBus.emit('world:saved', { saveId, name: saveName });
    console.log('Game saved:', saveName);
  }

  /**
   * Load saved game
   */
  async load(saveId: string): Promise<void> {
    console.log('Loading save:', saveId);
    const savedGame = await this.database.saves.get(saveId);
    if (!savedGame) {
      throw new Error('Save not found: ' + saveId);
    }

    this.entityManager.clear();
    await this.loadEntitiesFromDatabase();
    this.eventBus.emit('world:loaded', { saveId });
    console.log('Game loaded:', savedGame.name);
  }

  /**
   * Load entities from database
   */
  private async loadEntitiesFromDatabase(): Promise<void> {
    const dbEntities = await this.database.entities.toArray();
    for (const dbEntity of dbEntities) {
      const entity: Entity = {
        id: dbEntity.id,
        type: dbEntity.type,
        components: dbEntity.components,
      };
      this.entityManager.add(entity);
    }
    console.log('Loaded entities:', dbEntities.length);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      running: this.gameLoop.isActive(),
      paused: this.paused,
      headless: this.headless,
      entities: this.entityManager.getStats(),
      systems: this.systemManager.getStats(),
      loop: this.gameLoop.getStats(),
      events: {
        subscriptions: this.eventBus.getSubscriptionCount(),
        historySize: this.eventBus.getHistory().length,
      },
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down GameWorld...');
    this.stop();
    this.systemManager.clear();
    this.eventBus.clear();
    await this.database.close();
    console.log('GameWorld shut down');
  }
}
