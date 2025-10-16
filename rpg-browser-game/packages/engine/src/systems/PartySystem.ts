import { System } from './System.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Manages multiplayer parties
 */
export class PartySystem extends System {
  private parties: Map<string, Set<string>> = new Map();

  update(context: SystemUpdateContext): void {}

  createParty(leaderId: string): string {
    const partyId = 'party_' + Date.now();
    this.parties.set(partyId, new Set([leaderId]));
    this.eventBus.emit('party:created', { partyId, leaderId });
    return partyId;
  }

  joinParty(partyId: string, playerId: string): boolean {
    const party = this.parties.get(partyId);
    if (!party || party.size >= 4) return false;
    
    party.add(playerId);
    this.eventBus.emit('party:member_joined', { partyId, playerId });
    return true;
  }

  leaveParty(partyId: string, playerId: string): boolean {
    const party = this.parties.get(partyId);
    if (!party) return false;
    
    party.delete(playerId);
    this.eventBus.emit('party:member_left', { partyId, playerId });
    
    if (party.size === 0) {
      this.parties.delete(partyId);
      this.eventBus.emit('party:disbanded', { partyId });
    }
    
    return true;
  }

  getPartyMembers(partyId: string): string[] {
    return Array.from(this.parties.get(partyId) || []);
  }
}
