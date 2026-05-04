import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Home, Trophy } from 'lucide-react';

interface GameOverProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOver({ score, highScore, onRestart, onMenu }: GameOverProps) {
  const isBest = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-jungle-dark/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-jungle-mid border-4 border-earth-mid p-10 rounded-[2.5rem] text-center shadow-2xl max-w-md w-full mx-4"
      >
        <h2 className="text-5xl font-black text-red-500 mb-2 uppercase italic tracking-tighter italic">TREK FAILED</h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-10">You've been claimed by the wild</p>

        <div className="space-y-3 mb-10">
          <div className="stat-box p-6 rounded-2xl">
            <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-1">Score</p>
            <p className="text-4xl font-black text-gold leading-none">{score.toLocaleString()}</p>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-white/60 font-bold text-sm tracking-widest">
            <Trophy className={`w-4 h-4 ${isBest ? 'text-gold' : ''}`} />
            <span className="uppercase">Record: {highScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="group flex items-center justify-center gap-3 w-full py-5 bg-jungle-green hover:brightness-110 text-white font-black text-xl rounded-2xl transition-all border-b-4 border-[#3a5a2a] active:border-b-0 active:translate-y-1"
          >
            <RotateCcw className="w-6 h-6" />
            TRY AGAIN
          </button>
          
          <button
            onClick={onMenu}
            className="flex items-center justify-center gap-3 w-full py-3 bg-transparent hover:bg-white/5 text-white/40 hover:text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all border border-white/5"
          >
            <Home className="w-4 h-4" />
            CAMP HUB
          </button>
        </div>
      </motion.div>
    </div>
  );
}
