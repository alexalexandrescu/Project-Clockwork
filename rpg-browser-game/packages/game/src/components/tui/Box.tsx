import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Border variant types for the Box component
 */
export type BoxVariant = 'single' | 'double' | 'rounded';

/**
 * Props for the Box component
 */
export interface BoxProps {
  /** Content to be displayed inside the box */
  children: React.ReactNode;
  /** Optional title displayed at the top of the box */
  title?: string;
  /** Optional footer displayed at the bottom of the box */
  footer?: string;
  /** Border style variant */
  variant?: BoxVariant;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ASCII bordered container component for terminal-style UI
 *
 * @example
 * ```tsx
 * <Box title="Inventory" variant="double">
 *   <p>Items go here</p>
 * </Box>
 * ```
 */
const Box: React.FC<BoxProps> = ({
  children,
  title,
  footer,
  variant = 'single',
  className,
}) => {
  // Map variants to Tailwind border utilities
  const borderClasses = {
    single: 'border',
    double: 'border-2',
    rounded: 'border rounded',
  };

  return (
    <div
      className={cn(
        'bg-terminal-bg-light',
        borderClasses[variant],
        'border-terminal-fg',
        'text-terminal-fg',
        className
      )}
    >
      {title && (
        <div
          className={cn(
            'px-4 py-1',
            'border-b',
            variant === 'double' ? 'border-b-2' : 'border-b',
            'border-terminal-fg',
            'text-terminal-fg-bright',
            'font-bold'
          )}
        >
          {title}
        </div>
      )}

      <div className="p-4">{children}</div>

      {footer && (
        <div
          className={cn(
            'px-4 py-1',
            'border-t',
            variant === 'double' ? 'border-t-2' : 'border-t',
            'border-terminal-fg',
            'text-terminal-fg',
            'text-sm'
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Box;
