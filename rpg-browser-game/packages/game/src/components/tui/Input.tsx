import React, { useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

/**
 * Props for the Input component
 */
export interface InputProps {
  /** Current input value */
  value: string;
  /** Change handler for input value */
  onChange: (value: string) => void;
  /** Submit handler (called on Enter key) */
  onSubmit?: () => void;
  /** Prefix displayed before the input (default: ">") */
  prefix?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Command-line style input component with prefix and Enter key support
 *
 * @example
 * ```tsx
 * <Input
 *   value={command}
 *   onChange={setCommand}
 *   onSubmit={handleCommand}
 *   prefix="$"
 *   placeholder="Enter command..."
 * />
 * ```
 */
const Input: React.FC<InputProps> = ({
  value,
  onChange,
  onSubmit,
  prefix = '>',
  placeholder,
  disabled = false,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus on mount
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  /**
   * Handle Enter key press for submission
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  /**
   * Handle input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.value);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        'bg-terminal-bg-light',
        'border border-terminal-fg',
        'px-3 py-2',
        'font-mono',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Prefix */}
      <span className="text-terminal-green-bright font-bold select-none">
        {prefix}
      </span>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex-1',
          'bg-transparent',
          'text-terminal-fg-bright',
          'outline-none',
          'placeholder:text-terminal-fg/50',
          'font-mono',
          disabled && 'cursor-not-allowed'
        )}
      />
    </div>
  );
};

export default Input;
