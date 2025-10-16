import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Stat item configuration
 */
export interface Stat {
  /** Label for the stat */
  label: string;
  /** Current value */
  value: number;
  /** Maximum value (optional, for percentage calculation) */
  max?: number;
  /** Custom color override */
  color?: string;
}

/**
 * Props for the StatusBar component
 */
export interface StatusBarProps {
  /** Array of stats to display */
  stats: Stat[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get color class based on percentage (if max is provided)
 */
const getColorClass = (value: number, max?: number, customColor?: string): string => {
  // Use custom color if provided
  if (customColor) {
    return customColor;
  }

  // If no max, use default color
  if (!max) {
    return 'text-terminal-fg-bright';
  }

  // Calculate percentage
  const percentage = (value / max) * 100;

  // Color-code based on percentage thresholds
  if (percentage <= 20) {
    return 'text-terminal-red-bright';
  } else if (percentage <= 50) {
    return 'text-terminal-amber-bright';
  } else if (percentage <= 75) {
    return 'text-terminal-yellow-bright';
  } else {
    return 'text-terminal-green-bright';
  }
};

/**
 * Horizontal stats display component with color-coded values
 *
 * @example
 * ```tsx
 * <StatusBar
 *   stats={[
 *     { label: 'HP', value: 75, max: 100 },
 *     { label: 'MP', value: 30, max: 50 },
 *     { label: 'Gold', value: 1250 },
 *   ]}
 * />
 * ```
 */
const StatusBar: React.FC<StatusBarProps> = ({ stats, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-4 flex-wrap',
        'font-mono',
        'text-sm',
        className
      )}
    >
      {stats.map((stat, index) => {
        const colorClass = getColorClass(stat.value, stat.max, stat.color);
        const displayValue = stat.max
          ? `${stat.value}/${stat.max}`
          : stat.value.toLocaleString();

        return (
          <div key={`${stat.label}-${index}`} className="flex items-center gap-2">
            {/* Label */}
            <span className="text-terminal-fg">{stat.label}:</span>

            {/* Value */}
            <span className={cn('font-bold', colorClass)}>{displayValue}</span>

            {/* Separator (not after last item) */}
            {index < stats.length - 1 && (
              <span className="text-terminal-fg/30">|</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusBar;
