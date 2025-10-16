import { GameWorld } from '@rpg/engine';
import { 
  loadAllData, 
  getNPCs, 
  getItems, 
  getFood,
  getQuests,
  getWorld 
} from '@rpg/data';

/**
 * Initialize game world with data from JSON files
 */
export async function initializeGameData(gameWorld: GameWorld): Promise<void> {
  console.log('Loading game data...');
  
  // Load all data
  const data = await loadAllData();
  
  // Register entity types
  for (const [typeName, typeDef] of Object.entries(data.types.entityTypes)) {
    gameWorld.typeRegistry.register({
      type: typeName,
      requiredComponents: typeDef.requiredComponents,
      optionalComponents: typeDef.optionalComponents,
    });
  }
  
  // Register templates
  for (const [templateId, template] of Object.entries(data.templates.templates)) {
    gameWorld.entityFactory.registerTemplate({
      id: templateId,
      type: template.type,
      components: template.components,
      extends: template.extends,
    });
  }
  
  console.log('Registered types and templates');
  
  // Create world entities
  const world = getWorld();
  
  // Create realm entities
  for (const realm of world.realms) {
    const realmEntity = gameWorld.entityFactory.createFromType('realm', {
      identity: {
        name: realm.name,
        description: realm.description,
      },
      properties: {
        theme: realm.theme,
        difficulty: realm.difficulty,
      },
    });
    gameWorld.entityManager.add(realmEntity);
    
    // Create city entities
    for (const city of realm.cities) {
      const cityEntity = gameWorld.entityFactory.createFromType('city', {
        identity: {
          name: city.name,
          description: city.description,
        },
        position: {
          realm: realm.name,
          city: city.name,
        },
        properties: {
          population: city.population,
        },
      });
      gameWorld.entityManager.add(cityEntity);
    }
  }
  
  // Create NPC entities
  const npcs = getNPCs();
  for (const npc of npcs) {
    const npcEntity = gameWorld.entityFactory.createFromType('npc', {
      identity: {
        name: npc.name,
        title: npc.title,
        description: npc.appearance,
      },
      position: npc.location,
      stats: npc.stats,
      schedule: npc.schedule ? { activities: npc.schedule, currentActivity: '' } : undefined,
      dialogue: npc.dialogue,
      business: npc.business,
      inventory: npc.inventory,
    });
    gameWorld.entityManager.add(npcEntity);
  }
  
  // Create item entities
  const items = getItems();
  for (const item of items) {
    const itemEntity = gameWorld.entityFactory.createFromType('item', {
      identity: {
        name: item.name,
        description: item.description,
      },
      item: {
        itemType: item.itemType,
        value: item.value,
        weight: item.weight,
        stackable: item.stackable || false,
        maxStack: item.maxStack,
        equipSlot: item.equipSlot,
      },
      effects: item.effects,
      craftable: item.craftable,
    });
    gameWorld.entityManager.add(itemEntity);
  }
  
  // Create food entities
  const foods = getFood();
  for (const food of foods) {
    const foodEntity = gameWorld.entityFactory.createFromType('food', {
      identity: {
        name: food.name,
        description: food.description,
      },
      properties: {
        cuisine: food.cuisine,
        rarity: food.rarity,
      },
      item: {
        itemType: 'consumable',
        value: food.value,
        weight: food.weight,
        stackable: true,
        maxStack: food.stackSize,
      },
      effects: {
        onConsume: food.effects,
      },
    });
    gameWorld.entityManager.add(foodEntity);
  }
  
  // Create quest entities
  const quests = getQuests();
  for (const quest of quests) {
    const questEntity = gameWorld.entityFactory.createFromType('quest', {
      identity: {
        name: quest.name,
        description: quest.description,
      },
      quest: {
        questId: quest.id,
        objectives: quest.objectives,
        rewards: quest.rewards,
        isPartyQuest: quest.partySize && quest.partySize > 1,
      },
      properties: {
        difficulty: quest.difficulty,
        category: quest.category,
        questGiver: quest.questGiver,
        location: quest.location,
      },
    });
    gameWorld.entityManager.add(questEntity);
  }
  
  console.log('Game data loaded:', gameWorld.entityManager.getStats());
  
  // Save to database
  await gameWorld.save('initial_data');
}
