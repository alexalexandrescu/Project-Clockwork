import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages guilds
 */
export class GuildSystem extends System {
  private guilds: Map<string, any> = new Map();

  update(context: SystemUpdateContext): void {}

  createGuild(name: string, leaderId: string): string {
    const guildId = 'guild_' + Date.now();
    this.guilds.set(guildId, {
      name,
      leaderId,
      members: [leaderId],
      level: 1,
      reputation: 0,
    });
    this.eventBus.emit('guild:created', { guildId, name, leaderId });
    return guildId;
  }

  joinGuild(guildId: string, playerId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;
    
    guild.members.push(playerId);
    this.eventBus.emit('guild:member_joined', { guildId, playerId });
    return true;
  }
}
