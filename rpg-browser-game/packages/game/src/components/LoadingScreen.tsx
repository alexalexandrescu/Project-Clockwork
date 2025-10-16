import React from 'react';
import { cn } from '../utils/cn';
import Box from './tui/Box';

/**
 * Props for the LoadingScreen component
 */
export interface LoadingScreenProps {
  /** Loading progress from 0 to 1 */
  progress: number;
  /** Current loading status message */
  status: string;
}

/**
 * Entertaining loading messages shown during LLM initialization
 */
const LOADING_MESSAGES = [
  'Teaching the AI to count to potato...',
  'Convincing NPCs they exist...',
  'Rolling for initiative...',
  'Calibrating dice physics...',
  'Summoning digital dragons...',
  'Optimizing dungeon generation...',
  'Bribing the RNG gods...',
  'Loading loot tables...',
  'Warming up quest generators...',
  'Compiling ancient prophecies...',
  'Consulting the oracle...',
  'Mapping forgotten realms...',
  'Preparing witty comebacks...',
  'Training merchant haggle AI...',
  'Installing plot armor...',
  'Debugging fate...',
];

/**
 * LLM loading UI component with progress bar and entertaining messages
 *
 * Displays a centered loading screen with progress indication while
 * the LLM model is being loaded and initialized.
 *
 * @example
 * ```tsx
 * <LoadingScreen
 *   progress={0.65}
 *   status="Loading model weights..."
 * />
 * ```
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, status }) => {
  // Get a consistent random message based on progress
  const messageIndex = Math.floor(progress * LOADING_MESSAGES.length);
  const loadingMessage =
    LOADING_MESSAGES[Math.min(messageIndex, LOADING_MESSAGES.length - 1)];

  // Calculate progress bar width and percentage
  const progressPercent = Math.round(progress * 100);
  const barWidth = Math.floor(progress * 50); // 50 characters wide

  return (
    <div className="flex items-center justify-center min-h-screen bg-terminal-bg">
      <div className="w-full max-w-2xl px-4">
        <Box title="Loading Game" variant="double" className="w-full">
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-terminal-green-bright mb-2">
                TERMINAL QUEST
              </h1>
              <p className="text-terminal-fg-bright">Initializing AI Engine...</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-terminal-fg">Progress</span>
                <span className="text-terminal-green-bright font-mono">
                  {progressPercent}%
                </span>
              </div>

              {/* ASCII progress bar */}
              <div className="font-mono">
                <div className="flex border border-terminal-fg">
                  {/* Filled portion */}
                  <div
                    className="bg-terminal-green h-4"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {/* Empty portion */}
                  <div
                    className="bg-terminal-bg-light"
                    style={{ width: `${100 - progressPercent}%` }}
                  />
                </div>

                {/* Text representation */}
                <div className="mt-2 text-terminal-fg">
                  [
                  <span className="text-terminal-green-bright">
                    {'='.repeat(barWidth)}
                  </span>
                  <span className="text-terminal-fg-dim">
                    {'.'.repeat(50 - barWidth)}
                  </span>
                  ]
                </div>
              </div>
            </div>

            {/* Status message */}
            <div className="space-y-2">
              <div className="text-terminal-fg-bright">
                <span className="text-terminal-green-bright">&gt;</span> {status}
              </div>

              {/* Entertaining message */}
              <div className="text-terminal-fg italic text-sm">
                <span className="text-terminal-yellow">*</span> {loadingMessage}
              </div>
            </div>

            {/* Loading spinner */}
            <div className="text-center text-terminal-fg-dim font-mono">
              <div className="inline-block animate-pulse">
                {progress < 0.25 && '|'}
                {progress >= 0.25 && progress < 0.5 && '/'}
                {progress >= 0.5 && progress < 0.75 && '-'}
                {progress >= 0.75 && '\\'}
              </div>
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default LoadingScreen;
