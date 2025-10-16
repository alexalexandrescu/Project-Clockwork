import { System } from './System.ts';
import type { EntityManager } from '../core/EntityManager.ts';
import type { EventBus } from '../core/EventBus.ts';
import type { SystemUpdateContext, PositionComponent } from '../types/index.ts';

/**
 * Movement destination specification
 */
export interface MovementDestination {
  realm: string;
  city: string;
  building?: string;
  room?: string;
}

/**
 * Movement validation result
 */
export interface MovementValidation {
  canMove: boolean;
  reason?: string;
}

/**
 * Movement event data
 */
export interface MovementEventData {
  entityId: string;
  entityType: string;
  from: PositionComponent;
  to: PositionComponent;
}

/**
 * MovementSystem - Handles entity movement between locations
 *
 * Manages movement of players and NPCs between realms, cities, buildings, and rooms.
 * Validates movement destinations and updates position components.
 *
 * Events emitted:
 * - 'entity:moved' - Any entity moved
 * - 'player:entered_location' - Player entered a new location
 * - 'npc:arrived' - NPC arrived at destination
 */
export class MovementSystem extends System {
  private movementQueue: Array<{
    entityId: string;
    destination: MovementDestination;
    timestamp: number;
  }> = [];

  /**
   * Creates a new MovementSystem
   * @param entityManager - Entity manager instance
   * @param eventBus - Event bus instance
   */
  constructor(entityManager: EntityManager, eventBus: EventBus) {
    super(entityManager, eventBus);
  }

  /**
   * Initialize the system
   */
  initialize(): void {
    // Subscribe to time events to process scheduled movements
    this.eventBus.subscribe('time:minute_changed', () => {
      this.processScheduledMovements();
    });
  }

  /**
   * Update the movement system
   * @param context - Update context
   */
  update(context: SystemUpdateContext): void {
    if (!this.enabled) return;

    // Process any queued movements
    this.processMovementQueue();
  }

  /**
   * Move an entity to a new location
   * @param entityId - ID of entity to move
   * @param destination - Destination location
   * @returns True if movement was successful, false otherwise
   */
  moveEntity(entityId: string, destination: MovementDestination): boolean {
    const entity = this.entityManager.get(entityId);

    if (!entity) {
      console.warn(`MovementSystem: Entity ${entityId} not found`);
      return false;
    }

    // Validate movement
    const validation = this.canMove(entityId, destination);
    if (!validation.canMove) {
      console.warn(`MovementSystem: Cannot move entity ${entityId} - ${validation.reason}`);
      return false;
    }

    // Get current position
    const currentPosition = entity.components.position as PositionComponent | undefined;
    const previousPosition: PositionComponent = currentPosition
      ? { ...currentPosition }
      : { realm: 'unknown', city: 'unknown' };

    // Update position component
    const newPosition: PositionComponent = {
      realm: destination.realm,
      city: destination.city,
      building: destination.building,
      room: destination.room,
    };

    entity.components.position = newPosition;

    // Update entity in manager (triggers re-indexing)
    this.entityManager.update(entityId, {
      components: {
        ...entity.components,
        position: newPosition,
      },
    });

    // Emit movement events
    const eventData: MovementEventData = {
      entityId,
      entityType: entity.type,
      from: previousPosition,
      to: newPosition,
    };

    this.eventBus.emit('entity:moved', eventData, 'MovementSystem');

    // Emit type-specific events
    if (entity.type === 'player') {
      this.eventBus.emit('player:entered_location', {
        ...eventData,
        location: this.formatLocationString(newPosition),
      }, 'MovementSystem');
    } else if (entity.type === 'npc') {
      this.eventBus.emit('npc:arrived', {
        ...eventData,
        npcId: entityId,
        location: this.formatLocationString(newPosition),
      }, 'MovementSystem');
    }

    return true;
  }

  /**
   * Check if an entity can move to a destination
   * @param entityId - ID of entity to check
   * @param destination - Destination to validate
   * @returns Validation result with reason if movement is not allowed
   */
  canMove(entityId: string, destination: MovementDestination): MovementValidation {
    const entity = this.entityManager.get(entityId);

    if (!entity) {
      return {
        canMove: false,
        reason: 'Entity does not exist',
      };
    }

    // Check if entity has position component
    if (!entity.components.position) {
      // Allow first-time positioning
      return { canMove: true };
    }

    // Validate destination exists
    if (!this.validateDestination(destination)) {
      return {
        canMove: false,
        reason: 'Destination does not exist',
      };
    }

    // Check realm accessibility
    const realmExists = this.checkRealmExists(destination.realm);
    if (!realmExists) {
      return {
        canMove: false,
        reason: `Realm '${destination.realm}' does not exist`,
      };
    }

    // Check city accessibility within realm
    const cityExists = this.checkCityExists(destination.realm, destination.city);
    if (!cityExists) {
      return {
        canMove: false,
        reason: `City '${destination.city}' does not exist in realm '${destination.realm}'`,
      };
    }

    // If building is specified, check it exists
    if (destination.building) {
      const buildingExists = this.checkBuildingExists(
        destination.realm,
        destination.city,
        destination.building
      );

      if (!buildingExists) {
        return {
          canMove: false,
          reason: `Building '${destination.building}' does not exist in ${destination.city}`,
        };
      }

      // If room is specified, check it exists
      if (destination.room) {
        const roomExists = this.checkRoomExists(
          destination.realm,
          destination.city,
          destination.building,
          destination.room
        );

        if (!roomExists) {
          return {
            canMove: false,
            reason: `Room '${destination.room}' does not exist in building '${destination.building}'`,
          };
        }
      }
    }

    // Additional entity-specific checks
    if (entity.type === 'player') {
      // Check if player has required access/permissions
      // Could check for locked areas, required items, etc.
      // For now, allow all player movement
    }

    return { canMove: true };
  }

  /**
   * Validate that a destination has required fields
   * @param destination - Destination to validate
   * @returns True if valid
   */
  private validateDestination(destination: MovementDestination): boolean {
    return Boolean(destination.realm && destination.city);
  }

  /**
   * Check if a realm exists in the game world
   * @param realm - Realm name to check
   * @returns True if realm exists
   */
  private checkRealmExists(realm: string): boolean {
    // Query for any entity (e.g., city, building) in this realm
    const entitiesInRealm = this.entityManager.query({
      realm,
    });

    // If we find any entities, the realm exists
    // Alternatively, could check for a specific 'realm' entity type
    return entitiesInRealm.length > 0 || realm === 'default';
  }

  /**
   * Check if a city exists in a realm
   * @param realm - Realm name
   * @param city - City name
   * @returns True if city exists
   */
  private checkCityExists(realm: string, city: string): boolean {
    const cities = this.entityManager.query({
      type: 'city',
      realm,
      where: (entity) => entity.components.identity?.name === city,
    });

    return cities.length > 0 || city === 'default';
  }

  /**
   * Check if a building exists in a city
   * @param realm - Realm name
   * @param city - City name
   * @param building - Building name
   * @returns True if building exists
   */
  private checkBuildingExists(realm: string, city: string, building: string): boolean {
    const buildings = this.entityManager.query({
      type: 'building',
      realm,
      city,
      where: (entity) => entity.components.identity?.name === building,
    });

    return buildings.length > 0;
  }

  /**
   * Check if a room exists in a building
   * @param realm - Realm name
   * @param city - City name
   * @param building - Building name
   * @param room - Room name
   * @returns True if room exists
   */
  private checkRoomExists(realm: string, city: string, building: string, room: string): boolean {
    const rooms = this.entityManager.query({
      type: 'room',
      realm,
      city,
      where: (entity) =>
        entity.components.position?.building === building &&
        entity.components.identity?.name === room,
    });

    return rooms.length > 0;
  }

  /**
   * Queue a movement for later processing
   * @param entityId - Entity to move
   * @param destination - Where to move
   * @param delay - Delay in milliseconds (optional)
   */
  queueMovement(entityId: string, destination: MovementDestination, delay: number = 0): void {
    this.movementQueue.push({
      entityId,
      destination,
      timestamp: Date.now() + delay,
    });
  }

  /**
   * Process queued movements
   */
  private processMovementQueue(): void {
    const now = Date.now();
    const readyMovements = this.movementQueue.filter(m => m.timestamp <= now);

    for (const movement of readyMovements) {
      this.moveEntity(movement.entityId, movement.destination);
    }

    // Remove processed movements
    this.movementQueue = this.movementQueue.filter(m => m.timestamp > now);
  }

  /**
   * Process scheduled movements based on NPC schedules
   */
  private processScheduledMovements(): void {
    // Get all entities with schedules
    const scheduledEntities = this.entityManager.getByComponent('schedule');

    for (const entity of scheduledEntities) {
      const schedule = entity.components.schedule;
      if (!schedule || !schedule.activities) continue;

      // Check if any activity should trigger movement
      // This is a simple implementation - could be enhanced
      // with more sophisticated scheduling logic
    }
  }

  /**
   * Get all entities at a specific location
   * @param location - Location to check
   * @returns Array of entities at the location
   */
  getEntitiesAtLocation(location: Partial<MovementDestination>): string[] {
    const query: any = {};

    if (location.realm) query.realm = location.realm;
    if (location.city) query.city = location.city;

    const entities = this.entityManager.query(query);

    return entities
      .filter(entity => {
        const pos = entity.components.position as PositionComponent;
        if (!pos) return false;

        if (location.building && pos.building !== location.building) return false;
        if (location.room && pos.room !== location.room) return false;

        return true;
      })
      .map(e => e.id);
  }

  /**
   * Format a position as a readable string
   * @param position - Position to format
   * @returns Formatted location string
   */
  private formatLocationString(position: PositionComponent): string {
    let location = `${position.city}, ${position.realm}`;

    if (position.building) {
      location += ` - ${position.building}`;
    }

    if (position.room) {
      location += ` (${position.room})`;
    }

    return location;
  }

  /**
   * Get distance between two positions (simplified)
   * @param pos1 - First position
   * @param pos2 - Second position
   * @returns Distance metric (0 = same location, higher = further)
   */
  getDistance(pos1: PositionComponent, pos2: PositionComponent): number {
    let distance = 0;

    if (pos1.realm !== pos2.realm) distance += 1000;
    if (pos1.city !== pos2.city) distance += 100;
    if (pos1.building !== pos2.building) distance += 10;
    if (pos1.room !== pos2.room) distance += 1;

    return distance;
  }

  /**
   * Teleport an entity (instant movement, bypasses normal validation)
   * @param entityId - Entity to teleport
   * @param destination - Destination
   * @returns True if successful
   */
  teleport(entityId: string, destination: MovementDestination): boolean {
    const entity = this.entityManager.get(entityId);

    if (!entity) {
      return false;
    }

    const previousPosition = entity.components.position as PositionComponent | undefined;
    const from: PositionComponent = previousPosition || { realm: 'unknown', city: 'unknown' };

    const newPosition: PositionComponent = {
      realm: destination.realm,
      city: destination.city,
      building: destination.building,
      room: destination.room,
    };

    entity.components.position = newPosition;

    this.entityManager.update(entityId, {
      components: {
        ...entity.components,
        position: newPosition,
      },
    });

    this.eventBus.emit('entity:teleported', {
      entityId,
      entityType: entity.type,
      from,
      to: newPosition,
    }, 'MovementSystem');

    return true;
  }

  /**
   * Cleanup the system
   */
  cleanup(): void {
    this.movementQueue = [];
  }
}
