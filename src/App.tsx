import React, { useState, useEffect } from 'react';
import { GameStatus } from './types/game';
import Game from './components/Game/Game';
import Menu from './components/UI/Menu';
import GameOver from './components/UI/GameOver';

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('temple_runner_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleStart = () => {
    setScore(0);
    setStatus(GameStatus.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('temple_runner_high_score', finalScore.toString());
    }
    setStatus(GameStatus.GAME_OVER);
  };

  return (
    <div className="relative w-full h-screen bg-neutral-900 overflow-hidden font-sans">
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
