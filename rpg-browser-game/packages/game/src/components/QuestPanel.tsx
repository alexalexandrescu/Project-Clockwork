import React, { useState } from 'react';
import { cn } from '../utils/cn';
import Box from './tui/Box';
import { useGameStore } from '../store/gameStore';

/**
 * Quest objective interface
 */
interface QuestObjective {
  id: string;
  description: string;
  required: number;
  current: number;
  completed: boolean;
}

/**
 * Quest interface
 */
interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: {
    gold?: number;
    experience?: number;
    items?: string[];
  };
  isPartyQuest: boolean;
  completed: boolean;
}

/**
 * Props for the QuestPanel component
 */
export interface QuestPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Quest log UI component
 *
 * Displays active quests with objective progress bars and
 * completion status indicators.
 *
 * @example
 * ```tsx
 * <QuestPanel />
 * ```
 */
const QuestPanel: React.FC<QuestPanelProps> = ({ className }) => {
  const player = useGameStore((state) => state.player);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  // TODO: Get quests from game engine/player state
  // For now, using mock data structure
  const quests: Quest[] = player?.equipment?.activeQuests || [];

  // Get selected quest
  const selectedQuest = quests.find((q) => q.id === selectedQuestId) || quests[0];

  // Separate active and completed quests
  const activeQuests = quests.filter((q) => !q.completed);
  const completedQuests = quests.filter((q) => q.completed);

  /**
   * Render a progress bar for an objective
   */
  const renderProgressBar = (objective: QuestObjective) => {
    const progress = Math.min((objective.current / objective.required) * 100, 100);
    const barWidth = Math.floor(progress / 5); // 20 characters max

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className={cn(
            'flex-1 truncate',
            objective.completed ? 'text-terminal-green line-through' : 'text-terminal-fg'
          )}>
            {objective.completed && '✓ '}
            {objective.description}
          </span>
          <span className={cn(
            'ml-2 font-mono',
            objective.completed ? 'text-terminal-green' : 'text-terminal-fg-dim'
          )}>
            {objective.current}/{objective.required}
          </span>
        </div>

        {/* ASCII progress bar */}
        <div className="font-mono text-xs">
          <span className="text-terminal-fg-dim">[</span>
          <span className={cn(
            objective.completed ? 'text-terminal-green' : 'text-terminal-yellow'
          )}>
            {'='.repeat(barWidth)}
          </span>
          <span className="text-terminal-fg-dim">
            {'.'.repeat(20 - barWidth)}
          </span>
          <span className="text-terminal-fg-dim">]</span>
          <span className="ml-2 text-terminal-fg-dim">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  };

  /**
   * Render quest rewards
   */
  const renderRewards = (quest: Quest) => {
    const rewards: string[] = [];

    if (quest.rewards.gold) {
      rewards.push(`${quest.rewards.gold}g`);
    }
    if (quest.rewards.experience) {
      rewards.push(`${quest.rewards.experience} XP`);
    }
    if (quest.rewards.items && quest.rewards.items.length > 0) {
      rewards.push(`${quest.rewards.items.length} item(s)`);
    }

    return rewards.length > 0 ? rewards.join(', ') : 'None';
  };

  return (
    <Box
      title="Quests"
      variant="single"
      footer={`Active: ${activeQuests.length} | Completed: ${completedQuests.length}`}
      className={cn('h-full flex flex-col', className)}
    >
      {quests.length === 0 ? (
        <div className="flex items-center justify-center h-full text-terminal-fg-dim italic">
          No active quests
        </div>
      ) : (
        <div className="flex flex-col h-full -mx-4 -mt-4 -mb-4">
          {/* Quest list */}
          <div className="border-b border-terminal-fg">
            {activeQuests.map((quest) => (
              <div
                key={quest.id}
                className={cn(
                  'px-4 py-2 cursor-pointer font-mono text-sm',
                  'hover:bg-terminal-bg',
                  'border-b border-terminal-fg/30',
                  'transition-colors',
                  selectedQuest?.id === quest.id &&
                    'bg-terminal-bg border-l-2 border-terminal-yellow'
                )}
                onClick={() => setSelectedQuestId(quest.id)}
              >
                <div className="flex items-center gap-2">
                  {quest.isPartyQuest && (
                    <span className="text-terminal-cyan" title="Party Quest">
                      ★
                    </span>
                  )}
                  <span className="text-terminal-fg-bright truncate">
                    {quest.title}
                  </span>
                </div>
              </div>
            ))}

            {completedQuests.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs text-terminal-fg-dim font-bold">
                  COMPLETED
                </div>
                {completedQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className={cn(
                      'px-4 py-2 cursor-pointer font-mono text-sm',
                      'hover:bg-terminal-bg',
                      'border-b border-terminal-fg/30',
                      'transition-colors',
                      'text-terminal-fg-dim line-through',
                      selectedQuest?.id === quest.id &&
                        'bg-terminal-bg border-l-2 border-terminal-green'
                    )}
                    onClick={() => setSelectedQuestId(quest.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-terminal-green">✓</span>
                      <span className="truncate">{quest.title}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Quest details */}
          {selectedQuest && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Quest title and description */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={cn(
                    'font-bold text-lg',
                    selectedQuest.completed
                      ? 'text-terminal-green'
                      : 'text-terminal-yellow-bright'
                  )}>
                    {selectedQuest.title}
                  </h3>
                  {selectedQuest.isPartyQuest && (
                    <span className="text-terminal-cyan text-sm">[Party]</span>
                  )}
                </div>
                <p className="text-terminal-fg text-sm">
                  {selectedQuest.description}
                </p>
              </div>

              {/* Objectives */}
              <div>
                <h4 className="text-terminal-fg-bright font-bold mb-2 text-sm">
                  Objectives:
                </h4>
                <div className="space-y-3">
                  {selectedQuest.objectives.map((objective) => (
                    <div key={objective.id}>
                      {renderProgressBar(objective)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewards */}
              <div>
                <h4 className="text-terminal-fg-bright font-bold mb-1 text-sm">
                  Rewards:
                </h4>
                <p className="text-terminal-fg text-sm">
                  {renderRewards(selectedQuest)}
                </p>
              </div>

              {/* Completion status */}
              {selectedQuest.completed && (
                <div className="text-terminal-green text-sm italic border-t border-terminal-fg pt-2">
                  ✓ Quest completed!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Box>
  );
};

export default QuestPanel;
