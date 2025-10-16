/**
 * WebRTC P2P connection manager for multiplayer
 * Note: Requires a signaling server for production use
 */
export class WebRTCManager {
  private connections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private sessionCode: string | null = null;

  /**
   * Create a new session
   */
  createSession(): string {
    this.sessionCode = this.generateSessionCode();
    console.log('Session created:', this.sessionCode);
    return this.sessionCode;
  }

  /**
   * Join existing session
   */
  async joinSession(code: string): Promise<boolean> {
    this.sessionCode = code;
    console.log('Attempting to join session:', code);
    // TODO: Implement WebRTC connection via signaling server
    return true;
  }

  /**
   * Send message to all peers
   */
  broadcast(data: any): void {
    const message = JSON.stringify(data);
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    });
  }

  /**
   * Send message to specific peer
   */
  send(peerId: string, data: any): void {
    const channel = this.dataChannels.get(peerId);
    if (channel?.readyState === 'open') {
      channel.send(JSON.stringify(data));
    }
  }

  /**
   * Get session code
   */
  getSessionCode(): string | null {
    return this.sessionCode;
  }

  /**
   * Close all connections
   */
  close(): void {
    this.dataChannels.forEach(channel => channel.close());
    this.connections.forEach(conn => conn.close());
    this.dataChannels.clear();
    this.connections.clear();
    this.sessionCode = null;
  }

  private generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
