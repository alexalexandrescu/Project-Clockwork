import { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Game from './components/Game';
import { BrowserLLM } from '@rpg/engine/io';
import { GameWorld } from '@rpg/engine';
import { useGameStore } from './store/gameStore';

/**
 * Root application component
 */
function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Starting...');
  const [error, setError] = useState<string | null>(null);
  const [gameWorld, setGameWorld] = useState<GameWorld | null>(null);

  const { setLLMLoaded, setLLMLoading } = useGameStore();

  useEffect(() => {
    initializeGame();
  }, []);

  async function initializeGame() {
    try {
      setLoadingStatus('Initializing game world...');
      
      // Create game world
      const world = new GameWorld({ headless: false });
      await world.initialize();
      setGameWorld(world);
      
      setLoadingProgress(0.3);
      setLoadingStatus('Loading AI model...');
      setLLMLoading(true);

      // Initialize LLM
      const llm = BrowserLLM.getInstance();
      await llm.initialize((progress) => {
        setLoadingProgress(0.3 + progress.progress * 0.7);
        setLoadingStatus(`Loading AI: ${progress.text}`);
      });

      setLLMLoaded(true);
      setLLMLoading(false);
      
      setLoadingProgress(1);
      setLoadingStatus('Ready!');
      
      // Start game
      setTimeout(() => {
        world.start();
        setIsInitializing(false);
      }, 500);
      
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLLMLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-terminal-bg text-terminal-red">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Error</h1>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 border border-terminal-red hover:bg-terminal-red hover:text-terminal-bg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <LoadingScreen 
        progress={loadingProgress} 
        status={loadingStatus} 
      />
    );
  }

  return gameWorld ? <Game gameWorld={gameWorld} /> : null;
}

export default App;
