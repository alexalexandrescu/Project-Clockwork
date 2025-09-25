// Character system for managing character stats, progression, and abilities

export interface Character {
  id: string
  name: string
  level: number
  experience: number
  attributes: {
    strength: number
    agility: number
    intelligence: number
    endurance: number
  }
  skills: Map<string, number>
  inventory: Array<{ id: string; quantity: number }>
}

export class CharacterSystem {
  private characters: Map<string, Character> = new Map()

  constructor() {
    console.log('👤 Character system initialized')
  }

  createCharacter(name: string, playerId: string): Character {
    const character: Character = {
      id: playerId,
      name,
      level: 1,
      experience: 0,
      attributes: {
        strength: 10,
        agility: 10,
        intelligence: 10,
        endurance: 10
      },
      skills: new Map(),
      inventory: []
    }

    this.characters.set(playerId, character)
    return character
  }

  getCharacter(playerId: string): Character | undefined {
    return this.characters.get(playerId)
  }

  addExperience(playerId: string, amount: number): void {
    const character = this.characters.get(playerId)
    if (!character) return

    character.experience += amount
    this.checkLevelUp(character)
  }

  private checkLevelUp(character: Character): void {
    const experienceNeeded = this.getExperienceForLevel(character.level + 1)

    if (character.experience >= experienceNeeded) {
      character.level++
      character.experience -= experienceNeeded
      this.onLevelUp(character)
    }
  }

  private getExperienceForLevel(level: number): number {
    return level * 100 // Simple progression formula
  }

  private onLevelUp(character: Character): void {
    // Grant attribute points on level up
    character.attributes.strength++
    character.attributes.agility++
    character.attributes.intelligence++
    character.attributes.endurance++

    console.log(`🎉 ${character.name} leveled up to level ${character.level}!`)
  }
}