import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lane } from '../../types/game';

interface GameObject {
  id: number;
  type: 'STONE' | 'FIRE' | 'HOLE' | 'WALL' | 'COIN' | 'MAGNET';
  lane: number;
  y: number; // 0 (top) to 100 (bottom)
}

interface GameProps {
  onGameOver: (score: number) => void;
}

export default function Game({ onGameOver }: GameProps) {
  const [currentLane, setCurrentLane] = useState<number>(0); // -1, 0, 1
  const [score, setScore] = useState(0);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [isJumping, setIsJumping] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [isMagnetActive, setIsMagnetActive] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  
  const gameRef = useRef({
    score: 0,
    speed: 1,
    lane: 0,
    isJumping: false,
    isSliding: false,
    isMagnetActive: false,
    magnetTime: 0,
    lastSpawn: 0,
    gameActive: true,
    objectId: 0
  });

  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);

  const gameOver = useCallback(() => {
    if (!gameRef.current.gameActive) return;
    gameRef.current.gameActive = false;
    onGameOver(Math.floor(gameRef.current.score));
  }, [onGameOver]);

  const update = useCallback((time: number) => {
    if (!gameRef.current.gameActive) return;
    
    if (lastTimeRef.current !== undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      
      // Update Game State
      gameRef.current.score += deltaTime * 10 * gameRef.current.speed;
      gameRef.current.speed += deltaTime * 0.01;
      
      if (gameRef.current.isMagnetActive) {
        gameRef.current.magnetTime -= deltaTime;
        if (gameRef.current.magnetTime <= 0) {
          gameRef.current.isMagnetActive = false;
          setIsMagnetActive(false);
        }
      }

      setObjects(prev => {
        const next = prev.map(obj => {
          let newY = obj.y + (gameRef.current.speed * 80 * deltaTime);
          
          // Magnet logic
          if (gameRef.current.isMagnetActive && obj.type === 'COIN' && newY > 40 && newY < 85) {
            const laneDiff = gameRef.current.lane - obj.lane;
            return { ...obj, y: newY, lane: obj.lane + laneDiff * 0.1 };
          }
          
          return { ...obj, y: newY };
        }).filter(obj => obj.y < 120);

        // Collision Check
        for (let i = 0; i < next.length; i++) {
          const obj = next[i];
          // Detect if object is in the player "hit zone" (roughly y: 80-90)
          if (obj.y > 75 && obj.y < 90 && Math.abs(obj.lane - gameRef.current.lane) < 0.5) {
            if (obj.type === 'COIN') {
              gameRef.current.score += 50;
              next.splice(i, 1);
              i--;
            } else if (obj.type === 'MAGNET') {
              gameRef.current.isMagnetActive = true;
              gameRef.current.magnetTime = 8;
              setIsMagnetActive(true);
              next.splice(i, 1);
              i--;
            } else {
              // Obstacle Collision
              let hit = false;
              if (obj.type === 'HOLE' && !gameRef.current.isJumping) hit = true;
              if (obj.type === 'WALL' && !gameRef.current.isSliding) hit = true;
              if (obj.type === 'STONE' || obj.type === 'FIRE') {
                if (!gameRef.current.isJumping) hit = true; 
              }
              
              if (hit) {
                gameOver();
                return prev;
              }
            }
          }
        }

        // Spawning
        gameRef.current.lastSpawn += deltaTime * gameRef.current.speed;
        if (gameRef.current.lastSpawn > 0.8) {
          gameRef.current.lastSpawn = 0;
          const rand = Math.random();
          let type: GameObject['type'] = 'COIN';
          
          if (rand < 0.15) type = 'STONE';
          else if (rand < 0.30) type = 'FIRE';
          else if (rand < 0.45) type = 'HOLE';
          else if (rand < 0.55) type = 'WALL';
          else if (rand < 0.95) type = 'COIN';
          else type = 'MAGNET';

          next.push({
            id: gameRef.current.objectId++,
            type,
            lane: Math.floor(Math.random() * 3) - 1,
            y: -20
          });
        }

        return [...next];
      });

      setScore(Math.floor(gameRef.current.score));
      setGameSpeed(gameRef.current.speed);
    }
    
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(update);
  }, [gameOver]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  // Input Handling
  const goLeft = useCallback(() => {
    gameRef.current.lane = Math.max(-1, gameRef.current.lane - 1);
    setCurrentLane(gameRef.current.lane);
  }, []);

  const goRight = useCallback(() => {
    gameRef.current.lane = Math.min(1, gameRef.current.lane + 1);
    setCurrentLane(gameRef.current.lane);
  }, []);

  const jump = useCallback(() => {
    if (gameRef.current.isJumping || gameRef.current.isSliding) return;
    gameRef.current.isJumping = true;
    setIsJumping(true);
    setTimeout(() => {
      gameRef.current.isJumping = false;
      setIsJumping(false);
    }, 600);
  }, []);

  const slide = useCallback(() => {
    if (gameRef.current.isJumping || gameRef.current.isSliding) return;
    gameRef.current.isSliding = true;
    setIsSliding(true);
    setTimeout(() => {
      gameRef.current.isSliding = false;
      setIsSliding(false);
    }, 700);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') goLeft();
      if (e.key === 'd' || e.key === 'ArrowRight') goRight();
      if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') jump();
      if (e.key === 's' || e.key === 'ArrowDown') slide();
    };

    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) dx > 0 ? goRight() : goLeft();
      } else {
        if (Math.abs(dy) > 30) dy < 0 ? jump() : slide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goLeft, goRight, jump, slide]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-jungle-dark select-none touch-none">
      {/* Jungle Backdrop Scrolling */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-x-0 h-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-10" />
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-[600px] h-full bg-jungle-mid flex border-x-8 border-earth-mid shadow-2xl">
          <div className="absolute inset-y-0 left-1/3 w-[2px] bg-white/5" />
          <div className="absolute inset-y-0 right-1/3 w-[2px] bg-white/5" />
        </div>
      </div>

      {/* Game Content */}
      <div className="relative z-10 w-full max-w-[600px] h-full mx-auto px-4">
        <AnimatePresence>
          {objects.map(obj => (
            <motion.div
              key={obj.id}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                left: `${(obj.lane + 1) * 33.33 + 16.66}%`,
                top: `${obj.y}%`,
                scale: 0.5 + (obj.y / 100) * 0.5,
                opacity: 1
              }}
              className="absolute pointer-events-none"
              style={{
                transform: `translate(-50%, -50%)`,
                zIndex: Math.floor(obj.y)
              }}
            >
              {obj.type === 'COIN' && (
                <div className="w-10 h-10 bg-gold rounded-full border-4 border-amber-600 shadow-[0_0_15px_rgba(255,215,0,0.5)] flex items-center justify-center">
                  <span className="text-amber-800 font-black text-xs">$</span>
                </div>
              )}
              {obj.type === 'STONE' && (
                <div className="w-16 h-14 bg-earth-mid rounded-2xl shadow-inner border-b-4 border-black/40 rotate-12" />
              )}
              {obj.type === 'FIRE' && (
                <div className="w-12 h-16 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 rounded-full blur-[1px] animate-pulse" />
              )}
              {obj.type === 'HOLE' && (
                <div className="w-20 h-8 bg-black/80 rounded-[50%] blur-[1px] border-2 border-earth-dark" />
              )}
              {obj.type === 'WALL' && (
                <div className="w-48 h-12 bg-earth-dark border-t-8 border-earth-mid rounded-b-xl flex justify-center items-end pb-1 translate-x-[-15%]">
                  <div className="w-1/2 h-1 bg-white/10" />
                </div>
              )}
              {obj.type === 'MAGNET' && (
                <div className="w-12 h-12 bg-red-600 rounded-t-xl border-4 border-white shadow-[0_0_20px_rgba(34,211,238,0.5)] flex flex-col p-1">
                  <div className="flex-1 bg-cyan-400 rounded-sm" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Player */}
        <motion.div
          animate={{
            x: `${currentLane * 120}px`, // Simplified lane movement
            y: isJumping ? -180 : 0,
            scaleY: isSliding ? 0.4 : 1,
            scaleX: isSliding ? 1.2 : 1,
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-16 h-28 z-[100]"
        >
          {/* Shadow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-4 bg-black/40 blur-md rounded-full scale-x-150" />
          
          {/* Boy Character Design */}
          <div className="relative w-full h-full">
            <div className="w-10 h-10 bg-[#f5d1b0] rounded-full mx-auto relative z-20 shadow-inner overflow-hidden">
               <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full" />
               <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full" />
               <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full" />
            </div>
            <div className="w-12 h-14 bg-[#2a5a8a] rounded-xl mx-auto -mt-1 relative z-10 shadow-lg" />
            <div className="flex justify-between w-10 mx-auto -mt-1">
              <div className="w-4 h-8 bg-[#5a4a3a] rounded-b-lg shadow-md" />
              <div className="w-4 h-8 bg-[#5a4a3a] rounded-b-lg shadow-md" />
            </div>
          </div>
          
          {isMagnetActive && (
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-[-30px] border-4 border-dashed border-cyan-400/50 rounded-full"
            />
          )}
        </motion.div>
      </div>

      {/* HUD */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-[100] pointer-events-none">
        <div className="stat-box px-10 py-3 rounded-2xl flex flex-col items-center min-w-[160px] shadow-2xl">
          <span className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-1">Score</span>
          <span className="text-4xl font-black text-gold tracking-tight">{score.toLocaleString()}</span>
        </div>
        
        {isMagnetActive && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="stat-box w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-cyan-400"
          >
            <div className="w-8 h-8 bg-black rounded-lg border-2 border-white flex flex-col p-1">
              <div className="h-1/3 bg-cyan-400 rounded-sm" />
            </div>
            <div className="absolute -bottom-2 px-2 py-0.5 bg-cyan-400 text-[8px] font-black text-black rounded-full uppercase">Mag</div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-6 left-6 text-white/20 font-black text-[10px] tracking-widest z-[100]">
        INTENSITY: {Math.floor(gameSpeed * 100)}%
      </div>
    </div>
  );
}
