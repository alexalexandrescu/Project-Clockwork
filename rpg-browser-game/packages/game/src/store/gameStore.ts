import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Player state interface
 */
export interface Player {
  id: string;
  name: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  gold: number;
  inventory: any[];
  equipment: Record<string, any>;
  stats: {
    strength: number;
    dexterity: number;
    intelligence: number;
    vitality: number;
  };
}

/**
 * Party member interface
 */
export interface PartyMember {
  id: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  class: string;
}

/**
 * Game store state interface
 */
export interface GameState {
  // State
  player: Player | null;
  isPlaying: boolean;
  gameTime: number;
  llmLoaded: boolean;
  llmLoading: boolean;
  llmProgress: number;
  partyMembers: PartyMember[];
  sessionCode: string | null;
  showInventory: boolean;
  showQuests: boolean;
  showParty: boolean;

  // Actions
  setPlayer: (player: Player | null) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  setLLMLoading: (loading: boolean) => void;
  setLLMLoaded: (loaded: boolean) => void;
  setGameTime: (time: number) => void;
  toggleInventory: () => void;
  toggleQuests: () => void;
  toggleParty: () => void;
  setPartyMembers: (members: PartyMember[]) => void;
  setSessionCode: (code: string | null) => void;
}

/**
 * Zustand game store with persistence for player and gameTime
 */
export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Initial state
      player: null,
      isPlaying: false,
      gameTime: 0,
      llmLoaded: false,
      llmLoading: false,
      llmProgress: 0,
      partyMembers: [],
      sessionCode: null,
      showInventory: false,
      showQuests: false,
      showParty: false,

      // Actions
      setPlayer: (player) => set({ player }),

      updatePlayer: (updates) =>
        set((state) => ({
          player: state.player ? { ...state.player, ...updates } : null,
        })),

      setLLMLoading: (loading) => set({ llmLoading: loading }),

      setLLMLoaded: (loaded) => set({ llmLoaded: loaded }),

      setGameTime: (time) => set({ gameTime: time }),

      toggleInventory: () =>
        set((state) => ({ showInventory: !state.showInventory })),

      toggleQuests: () => set((state) => ({ showQuests: !state.showQuests })),

      toggleParty: () => set((state) => ({ showParty: !state.showParty })),

      setPartyMembers: (members) => set({ partyMembers: members }),

      setSessionCode: (code) => set({ sessionCode: code }),
    }),
    {
      name: 'rpg-game-storage',
      // Only persist player and gameTime
      partialize: (state) => ({
        player: state.player,
        gameTime: state.gameTime,
      }),
    }
  )
);

export default useGameStore;
