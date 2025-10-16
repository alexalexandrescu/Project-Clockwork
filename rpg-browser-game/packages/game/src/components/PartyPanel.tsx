import React, { useState } from 'react';
import { cn } from '../utils/cn';
import Box from './tui/Box';
import Button from './tui/Button';
import Input from './tui/Input';
import { useGameStore, type PartyMember } from '../store/gameStore';

/**
 * Props for the PartyPanel component
 */
export interface PartyPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Party management UI component
 *
 * Displays party members with health bars, session code display,
 * and join/leave controls for multiplayer sessions.
 *
 * @example
 * ```tsx
 * <PartyPanel />
 * ```
 */
const PartyPanel: React.FC<PartyPanelProps> = ({ className }) => {
  const partyMembers = useGameStore((state) => state.partyMembers);
  const sessionCode = useGameStore((state) => state.sessionCode);
  const setSessionCode = useGameStore((state) => state.setSessionCode);
  const player = useGameStore((state) => state.player);

  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  /**
   * Handle creating a new party session
   */
  const handleCreateParty = () => {
    // Generate a random 6-character session code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(code);
    // TODO: Create party session in backend
    console.log('Creating party with code:', code);
  };

  /**
   * Handle joining a party session
   */
  const handleJoinParty = () => {
    if (joinCode.trim()) {
      setSessionCode(joinCode.toUpperCase());
      setShowJoinInput(false);
      setJoinCode('');
      // TODO: Join party session in backend
      console.log('Joining party with code:', joinCode);
    }
  };

  /**
   * Handle leaving the party
   */
  const handleLeaveParty = () => {
    setSessionCode(null);
    // TODO: Leave party session in backend
    console.log('Leaving party');
  };

  /**
   * Copy session code to clipboard
   */
  const handleCopyCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      // TODO: Show toast notification
      console.log('Session code copied to clipboard');
    }
  };

  /**
   * Render a health bar for a party member
   */
  const renderHealthBar = (member: PartyMember) => {
    const healthPercent = (member.health / member.maxHealth) * 100;
    const barWidth = Math.floor(healthPercent / 5); // 20 characters max

    // Determine color based on health percentage
    let healthColor = 'text-terminal-green';
    if (healthPercent < 25) {
      healthColor = 'text-terminal-red';
    } else if (healthPercent < 50) {
      healthColor = 'text-terminal-yellow';
    }

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-terminal-fg">HP</span>
          <span className={cn('font-mono', healthColor)}>
            {member.health}/{member.maxHealth}
          </span>
        </div>

        {/* ASCII health bar */}
        <div className="font-mono text-xs">
          <span className="text-terminal-fg-dim">[</span>
          <span className={healthColor}>{'█'.repeat(barWidth)}</span>
          <span className="text-terminal-fg-dim">
            {'░'.repeat(20 - barWidth)}
          </span>
          <span className="text-terminal-fg-dim">]</span>
        </div>
      </div>
    );
  };

  // Add current player to party members if in a party
  const allMembers: PartyMember[] = sessionCode && player
    ? [
        {
          id: player.id,
          name: player.name,
          level: player.level,
          health: player.health,
          maxHealth: player.maxHealth,
          class: 'Player',
        },
        ...partyMembers,
      ]
    : [];

  return (
    <Box
      title="Party"
      variant="single"
      footer={sessionCode ? `Session: ${sessionCode}` : 'Solo'}
      className={cn('h-full flex flex-col', className)}
    >
      <div className="space-y-4">
        {/* Session controls */}
        {!sessionCode ? (
          <div className="space-y-2">
            <Button
              onClick={handleCreateParty}
              variant="primary"
              className="w-full"
            >
              Create Party
            </Button>

            {!showJoinInput ? (
              <Button
                onClick={() => setShowJoinInput(true)}
                variant="default"
                className="w-full"
              >
                Join Party
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  value={joinCode}
                  onChange={setJoinCode}
                  onSubmit={handleJoinParty}
                  placeholder="Enter session code..."
                  prefix="#"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleJoinParty}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    disabled={!joinCode.trim()}
                  >
                    Join
                  </Button>
                  <Button
                    onClick={() => {
                      setShowJoinInput(false);
                      setJoinCode('');
                    }}
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="text-xs text-terminal-fg-dim italic text-center pt-2">
              Team up for party quests and shared adventures
            </div>
          </div>
        ) : (
          <>
            {/* Session info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-terminal-fg text-sm">Session Code:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-terminal-green-bright font-bold">
                    {sessionCode}
                  </span>
                  <Button
                    onClick={handleCopyCode}
                    variant="default"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleLeaveParty}
                variant="default"
                size="sm"
                className="w-full"
              >
                Leave Party
              </Button>
            </div>

            {/* Party members list */}
            <div className="space-y-3 pt-2 border-t border-terminal-fg">
              <div className="text-terminal-fg-bright font-bold text-sm">
                Members ({allMembers.length})
              </div>

              {allMembers.length === 0 ? (
                <div className="text-terminal-fg-dim text-sm italic text-center py-4">
                  Waiting for party members...
                </div>
              ) : (
                <div className="space-y-3">
                  {allMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-2 bg-terminal-bg-light border border-terminal-fg rounded"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-terminal-fg-bright font-bold">
                            {member.name}
                          </span>
                          {member.id === player?.id && (
                            <span className="text-terminal-cyan text-xs">(You)</span>
                          )}
                        </div>
                        <span className="text-terminal-fg-dim text-xs">
                          Lv.{member.level} {member.class}
                        </span>
                      </div>

                      {renderHealthBar(member)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Party benefits info */}
        {sessionCode && allMembers.length > 1 && (
          <div className="text-xs text-terminal-green italic border-t border-terminal-fg pt-2">
            ✓ Party bonus: +{allMembers.length * 5}% XP
          </div>
        )}
      </div>
    </Box>
  );
};

export default PartyPanel;
