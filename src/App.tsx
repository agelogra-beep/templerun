import React, { useState, useCallback } from 'react';
import { GameStatus } from './types/game';
import Game from './components/Game/Game';
import Menu from './components/UI/Menu';
import GameOver from './components/UI/GameOver';

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      const saved = localStorage.getItem('temple_runner_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  const handleStart = useCallback(() => {
    setScore(0);
    setStatus(GameStatus.PLAYING);
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        localStorage.setItem('temple_runner_high_score', finalScore.toString());
      } catch (e) {
        console.error("Failed to save high score");
      }
    }
    setStatus(GameStatus.GAME_OVER);
  }, [highScore]);

  return (
    <div className="relative w-full h-screen bg-jungle-dark overflow-hidden font-sans">
      {status === GameStatus.MENU && (
        <Menu onStart={handleStart} highScore={highScore} />
      )}
      
      {status === GameStatus.PLAYING && (
        <Game onGameOver={handleGameOver} />
      )}

      {status === GameStatus.GAME_OVER && (
        <GameOver 
          score={score} 
          highScore={highScore} 
          onRestart={handleStart} 
          onMenu={() => setStatus(GameStatus.MENU)} 
        />
      )}
    </div>
  );
}
