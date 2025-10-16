import { WebRTCManager } from './WebRTCManager.ts';

export interface SessionInfo {
  code: string;
  isHost: boolean;
  members: string[];
}

/**
 * Manages multiplayer sessions
 */
export class SessionManager {
  private webrtc: WebRTCManager;
  private isHost: boolean = false;
  private members: Set<string> = new Set();

  constructor() {
    this.webrtc = new WebRTCManager();
  }

  /**
   * Create and host a new session
   */
  createSession(playerId: string): string {
    const code = this.webrtc.createSession();
    this.isHost = true;
    this.members.add(playerId);
    return code;
  }

  /**
   * Join existing session
   */
  async joinSession(code: string, playerId: string): Promise<boolean> {
    const success = await this.webrtc.joinSession(code);
    if (success) {
      this.isHost = false;
      this.members.add(playerId);
    }
    return success;
  }

  /**
   * Leave current session
   */
  leaveSession(playerId: string): void {
    this.members.delete(playerId);
    if (this.members.size === 0 || (this.isHost && this.members.size === 1)) {
      this.webrtc.close();
      this.isHost = false;
    }
  }

  /**
   * Broadcast game state update
   */
  broadcastState(state: any): void {
    this.webrtc.broadcast({
      type: 'state_update',
      data: state,
      timestamp: Date.now(),
    });
  }

  /**
   * Send player action
   */
  sendAction(action: any): void {
    this.webrtc.broadcast({
      type: 'player_action',
      data: action,
      timestamp: Date.now(),
    });
  }

  /**
   * Get session info
   */
  getSessionInfo(): SessionInfo | null {
    const code = this.webrtc.getSessionCode();
    if (!code) return null;

    return {
      code,
      isHost: this.isHost,
      members: Array.from(this.members),
    };
  }

  /**
   * Check if hosting
   */
  isHosting(): boolean {
    return this.isHost;
  }

  /**
   * Get member count
   */
  getMemberCount(): number {
    return this.members.size;
  }
}
