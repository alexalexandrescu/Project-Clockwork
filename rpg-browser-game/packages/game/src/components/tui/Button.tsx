import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'default';

/**
 * Button size types
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Button component
 */
export interface ButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button is selected (shows arrows) */
  selected?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Terminal-styled button component with selection indicators
 *
 * @example
 * ```tsx
 * <Button variant="primary" selected onClick={handleClick}>
 *   Start Game
 * </Button>
 * ```
 */
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  selected = false,
  disabled = false,
  className,
}) => {
  // Define color schemes for each variant
  const variantClasses = {
    primary: {
      normal: 'bg-terminal-green text-terminal-bg hover:bg-terminal-green-bright',
      disabled: 'bg-terminal-fg/30 text-terminal-fg/50 cursor-not-allowed',
    },
    secondary: {
      normal:
        'bg-terminal-cyan text-terminal-bg hover:bg-terminal-cyan-bright',
      disabled: 'bg-terminal-fg/30 text-terminal-fg/50 cursor-not-allowed',
    },
    danger: {
      normal: 'bg-terminal-red text-terminal-bg hover:bg-terminal-red-bright',
      disabled: 'bg-terminal-fg/30 text-terminal-fg/50 cursor-not-allowed',
    },
    default: {
      normal: 'bg-terminal-bg-light text-terminal-fg-bright border border-terminal-fg hover:bg-terminal-bg',
      disabled: 'bg-terminal-fg/30 text-terminal-fg/50 cursor-not-allowed border border-terminal-fg/30',
    },
  };

  // Define size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const colors = disabled
    ? variantClasses[variant].disabled
    : variantClasses[variant].normal;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        sizeClasses[size],
        'font-mono font-bold',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-terminal-cyan',
        colors,
        className
      )}
      type="button"
    >
      {selected ? (
        <span>
          <span className="text-terminal-amber-bright">&gt; </span>
          {children}
          <span className="text-terminal-amber-bright"> &lt;</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
