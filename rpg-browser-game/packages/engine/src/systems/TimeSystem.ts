import { System } from './System.ts';
import type { EntityManager } from '../core/EntityManager.ts';
import type { EventBus } from '../core/EventBus.ts';
import type { SystemUpdateContext } from '../types/index.ts';

/**
 * Time of day categorization
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Game time structure
 */
export interface GameTime {
  year: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * TimeSystem - Manages game time and day/night cycle
 *
 * Tracks the passage of time in the game world with configurable time scale.
 * Emits events for time changes and day/night transitions.
 *
 * Events emitted:
 * - 'time:minute_changed' - Every game minute
 * - 'time:hour_changed' - Every game hour
 * - 'time:day_changed' - Every new day
 * - 'time:night_began' - When night starts (20:00)
 * - 'time:day_began' - When day starts (06:00)
 */
export class TimeSystem extends System {
  private gameTime: GameTime;
  private timeScale: number; // Real seconds per game minute
  private accumulatedTime: number = 0;
  private previousHour: number = 0;
  private previousDay: number = 0;
  private isDaytime: boolean = true;

  /**
   * Creates a new TimeSystem
   * @param entityManager - Entity manager instance
   * @param eventBus - Event bus instance
   * @param initialTime - Starting time (defaults to day 1, 08:00)
   * @param timeScale - Real seconds per game minute (default: 1 = 1 real second = 1 game minute)
   */
  constructor(
    entityManager: EntityManager,
    eventBus: EventBus,
    initialTime: Partial<GameTime> = {},
    timeScale: number = 1
  ) {
    super(entityManager, eventBus);

    this.gameTime = {
      year: initialTime.year ?? 1,
      day: initialTime.day ?? 1,
      hour: initialTime.hour ?? 8,
      minute: initialTime.minute ?? 0,
    };

    this.timeScale = timeScale;
    this.previousHour = this.gameTime.hour;
    this.previousDay = this.gameTime.day;
    this.isDaytime = this.calculateDaytime(this.gameTime.hour);
  }

  /**
   * Initialize the system
   */
  initialize(): void {
    // Emit initial time state
    this.eventBus.emit('time:initialized', {
      time: { ...this.gameTime },
      timeOfDay: this.getTimeOfDay(),
      isDaytime: this.isDaytime,
    }, 'TimeSystem');
  }

  /**
   * Update the time system
   * @param context - Update context with delta time
   */
  update(context: SystemUpdateContext): void {
    if (!this.enabled) return;

    // Accumulate real-world time
    this.accumulatedTime += context.deltaTime;

    // Check if a game minute has passed (based on time scale)
    const minuteInSeconds = this.timeScale;

    while (this.accumulatedTime >= minuteInSeconds) {
      this.accumulatedTime -= minuteInSeconds;
      this.advanceMinute();
    }
  }

  /**
   * Advance time by one game minute
   */
  private advanceMinute(): void {
    this.gameTime.minute += 1;

    // Handle minute overflow
    if (this.gameTime.minute >= 60) {
      this.gameTime.minute = 0;
      this.advanceHour();
    }

    // Emit minute changed event
    this.eventBus.emit('time:minute_changed', {
      time: { ...this.gameTime },
      timeOfDay: this.getTimeOfDay(),
    }, 'TimeSystem');
  }

  /**
   * Advance time by one game hour
   */
  private advanceHour(): void {
    this.gameTime.hour += 1;

    // Handle hour overflow
    if (this.gameTime.hour >= 24) {
      this.gameTime.hour = 0;
      this.advanceDay();
    }

    // Emit hour changed event
    this.eventBus.emit('time:hour_changed', {
      time: { ...this.gameTime },
      timeOfDay: this.getTimeOfDay(),
    }, 'TimeSystem');

    // Check for day/night transitions
    this.checkDayNightTransition();
  }

  /**
   * Advance time by one game day
   */
  private advanceDay(): void {
    this.gameTime.day += 1;

    // Handle day overflow (365 days per year)
    if (this.gameTime.day > 365) {
      this.gameTime.day = 1;
      this.gameTime.year += 1;
    }

    // Emit day changed event
    this.eventBus.emit('time:day_changed', {
      time: { ...this.gameTime },
      timeOfDay: this.getTimeOfDay(),
    }, 'TimeSystem');
  }

  /**
   * Check and emit day/night transition events
   */
  private checkDayNightTransition(): void {
    const wasDaytime = this.isDaytime;
    this.isDaytime = this.calculateDaytime(this.gameTime.hour);

    // Night began (transition from day to night)
    if (wasDaytime && !this.isDaytime) {
      this.eventBus.emit('time:night_began', {
        time: { ...this.gameTime },
        timeOfDay: this.getTimeOfDay(),
      }, 'TimeSystem');
    }

    // Day began (transition from night to day)
    if (!wasDaytime && this.isDaytime) {
      this.eventBus.emit('time:day_began', {
        time: { ...this.gameTime },
        timeOfDay: this.getTimeOfDay(),
      }, 'TimeSystem');
    }
  }

  /**
   * Calculate if given hour is daytime
   * @param hour - Hour to check (0-23)
   * @returns True if daytime (6:00 - 19:59), false if nighttime
   */
  private calculateDaytime(hour: number): boolean {
    return hour >= 6 && hour < 20;
  }

  /**
   * Get current game time
   * @returns Current time object
   */
  getTime(): Readonly<GameTime> {
    return { ...this.gameTime };
  }

  /**
   * Set game time to specific values
   * @param hour - Hour to set (0-23)
   * @param minute - Minute to set (0-59)
   * @param day - Optional day to set
   * @param year - Optional year to set
   */
  setTime(hour: number, minute: number, day?: number, year?: number): void {
    // Validate inputs
    if (hour < 0 || hour >= 24) {
      throw new Error(`Invalid hour: ${hour}. Must be 0-23.`);
    }
    if (minute < 0 || minute >= 60) {
      throw new Error(`Invalid minute: ${minute}. Must be 0-59.`);
    }
    if (day !== undefined && (day < 1 || day > 365)) {
      throw new Error(`Invalid day: ${day}. Must be 1-365.`);
    }

    const previousTime = { ...this.gameTime };

    this.gameTime.hour = hour;
    this.gameTime.minute = minute;

    if (day !== undefined) {
      this.gameTime.day = day;
    }
    if (year !== undefined) {
      this.gameTime.year = year;
    }

    // Check for transitions
    if (previousTime.day !== this.gameTime.day) {
      this.eventBus.emit('time:day_changed', {
        time: { ...this.gameTime },
        timeOfDay: this.getTimeOfDay(),
      }, 'TimeSystem');
    }

    if (previousTime.hour !== this.gameTime.hour) {
      this.eventBus.emit('time:hour_changed', {
        time: { ...this.gameTime },
        timeOfDay: this.getTimeOfDay(),
      }, 'TimeSystem');

      this.checkDayNightTransition();
    }

    this.eventBus.emit('time:minute_changed', {
      time: { ...this.gameTime },
      timeOfDay: this.getTimeOfDay(),
    }, 'TimeSystem');
  }

  /**
   * Get the current time of day category
   * @returns Time of day: 'morning' (6-11), 'afternoon' (12-17), 'evening' (18-19), 'night' (20-5)
   */
  getTimeOfDay(): TimeOfDay {
    const hour = this.gameTime.hour;

    if (hour >= 6 && hour < 12) {
      return 'morning';
    }
    if (hour >= 12 && hour < 18) {
      return 'afternoon';
    }
    if (hour >= 18 && hour < 20) {
      return 'evening';
    }
    return 'night';
  }

  /**
   * Set the time scale (how fast time passes)
   * @param scale - Real seconds per game minute (e.g., 1 = 1 real second = 1 game minute)
   */
  setTimeScale(scale: number): void {
    if (scale <= 0) {
      throw new Error(`Invalid time scale: ${scale}. Must be positive.`);
    }

    this.timeScale = scale;

    this.eventBus.emit('time:scale_changed', {
      timeScale: this.timeScale,
    }, 'TimeSystem');
  }

  /**
   * Get the current time scale
   * @returns Current time scale value
   */
  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * Check if it's currently daytime
   * @returns True if daytime, false if nighttime
   */
  isDayTime(): boolean {
    return this.isDaytime;
  }

  /**
   * Get formatted time string
   * @returns Formatted time string (e.g., "Day 42, 14:30")
   */
  getFormattedTime(): string {
    const hour = this.gameTime.hour.toString().padStart(2, '0');
    const minute = this.gameTime.minute.toString().padStart(2, '0');
    return `Year ${this.gameTime.year}, Day ${this.gameTime.day}, ${hour}:${minute}`;
  }

  /**
   * Get time in minutes since start of day
   * @returns Minutes since midnight (0-1439)
   */
  getMinutesSinceMidnight(): number {
    return this.gameTime.hour * 60 + this.gameTime.minute;
  }

  /**
   * Get total days since game start
   * @returns Total number of days elapsed
   */
  getTotalDays(): number {
    return (this.gameTime.year - 1) * 365 + this.gameTime.day;
  }

  /**
   * Cleanup the system
   */
  cleanup(): void {
    this.accumulatedTime = 0;
  }
}
