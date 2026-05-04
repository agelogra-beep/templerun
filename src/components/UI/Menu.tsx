import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Trophy } from 'lucide-react';

interface MenuProps {
  onStart: () => void;
  highScore: number;
}

export default function Menu({ onStart, highScore }: MenuProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-jungle-dark/60 backdrop-blur-sm cursor-pointer"
      onClick={onStart}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-jungle-dark via-jungle-mid to-jungle-light opacity-80" />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <h1 className="text-7xl md:text-9xl font-black text-gold mb-4 tracking-tighter uppercase italic game-title-shadow">
          JUNGLE RUN
        </h1>
        <p className="text-white/60 mb-12 text-lg font-medium tracking-widest uppercase">The Temple Awaits</p>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="group relative z-10 flex items-center gap-3 px-16 py-6 bg-jungle-green hover:brightness-110 text-white font-black text-3xl rounded-full transition-all border-b-8 border-[#3a5a2a] shadow-2xl uppercase tracking-widest"
      >
        PLAY NOW
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 relative z-10 flex flex-col items-center gap-4 text-white/80"
      >
        {highScore > 0 && (
          <div className="flex items-center gap-2 font-bold text-gold">
            <Trophy className="w-5 h-5" />
            <span>BEST RECORD: {highScore.toLocaleString()}</span>
          </div>
        )}
        <p className="text-xs font-bold text-white/30 animate-pulse uppercase tracking-[0.2em] md:block hidden">PRESS SPACE TO START</p>
        <p className="text-xs font-bold text-white/30 animate-pulse uppercase tracking-[0.2em] md:hidden block">TAP TO BEGIN TREK</p>
      </motion.div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 md:gap-12 text-white/30 text-[10px] uppercase font-black tracking-[0.2em] z-10 w-full justify-center px-4">
        <div className="flex flex-col items-center gap-2">
          <span className="px-3 py-2 border-2 border-white/20 rounded-lg text-white/60 md:block hidden">A D</span>
          <span className="md:hidden">LEFT/RIGHT</span>
          <span>MOVE</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="px-3 py-2 border-2 border-white/20 rounded-lg text-white/60 md:block hidden">W</span>
          <span className="md:hidden">UP</span>
          <span>JUMP</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="px-3 py-2 border-2 border-white/20 rounded-lg text-white/60 md:block hidden">S</span>
          <span className="md:hidden">DOWN</span>
          <span>SLIDE</span>
        </div>
      </div>
    </div>
  );
}
