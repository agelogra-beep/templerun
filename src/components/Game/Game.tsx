import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Lane } from '../../types/game';

interface GameProps {
  onGameOver: (score: number) => void;
}

export default function Game({ onGameOver }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    player: THREE.Group;
    obstacles: THREE.Object3D[];
    coins: THREE.Object3D[];
    powerUps: THREE.Object3D[];
    lanes: number[];
    currentLane: Lane;
    targetX: number;
    score: number;
    speed: number;
    clock: THREE.Clock;
    groundParts: THREE.Mesh[];
    isJumping: boolean;
    jumpVelocity: number;
    isSliding: boolean;
    slideTime: number;
    magnetActive: boolean;
    magnetTime: number;
    animationId?: number;
  }>({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(75, 1, 0.1, 1000),
    renderer: new THREE.WebGLRenderer({ antialias: true }),
    player: new THREE.Group(),
    obstacles: [],
    coins: [],
    powerUps: [],
    lanes: [-2, 0, 2],
    currentLane: Lane.CENTER,
    targetX: 0,
    score: 0,
    speed: 0.15,
    clock: new THREE.Clock(),
    groundParts: [],
    isJumping: false,
    jumpVelocity: 0,
    isSliding: false,
    slideTime: 0,
    magnetActive: false,
    magnetTime: 0,
  });

  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const { scene, camera, renderer, lanes, player } = gameRef.current;
    
    // Renderer Setup
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Scene Setup
    scene.background = new THREE.Color(0x0d1a0d); // jungle-dark
    scene.fog = new THREE.Fog(0x0d1a0d, 10, 40);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Dimmer, more moody
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Player (The Boy Adventurer)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2a5a8a }); // Muted blue shirt
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.position.y = 0.5;
    player.add(body);

    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xf5d1b0 }); // Skin tone
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    head.castShadow = true;
    player.add(head);

    const legGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a }); // Earth brown pants
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.15, 0.25, 0);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.15, 0.25, 0);
    player.add(legL, legR);

    player.position.set(0, 0, 0);
    scene.add(player);

    // Initial Camera
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, -2);

    // Ground Gaps Logic
    const floorGaps: number[] = [];

    // Ground
    const createGround = (z: number) => {
      const gGeo = new THREE.BoxGeometry(7, 1, 10);
      const gMat = new THREE.MeshStandardMaterial({ 
        color: 0x3e2d1d, // earth-dark
        roughness: 0.9
      });
      const ground = new THREE.Mesh(gGeo, gMat);
      ground.position.set(0, -0.5, z);
      ground.receiveShadow = true;
      
      // Add track texture details
      const lineGeo = new THREE.PlaneGeometry(0.1, 10);
      const lineMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, transparent: true, opacity: 0.5 });
      const lineL = new THREE.Mesh(lineGeo, lineMat);
      lineL.rotation.x = -Math.PI / 2;
      lineL.position.set(-1, 0.51, 0);
      const lineR = new THREE.Mesh(lineGeo, lineMat);
      lineR.rotation.x = -Math.PI / 2;
      lineR.position.set(1, 0.51, 0);
      ground.add(lineL, lineR);

      scene.add(ground);
      return ground;
    };

    gameRef.current.groundParts = [
      createGround(0),
      createGround(-10),
      createGround(-20),
      createGround(-30),
      createGround(-40)
    ];

    // Input Handling Helpers
    const goLeft = () => {
      if (gameRef.current.currentLane > Lane.LEFT) gameRef.current.currentLane--;
    };
    const goRight = () => {
      if (gameRef.current.currentLane < Lane.RIGHT) gameRef.current.currentLane++;
    };
    const jump = () => {
      if (!gameRef.current.isJumping) {
        gameRef.current.isJumping = true;
        gameRef.current.jumpVelocity = 0.25;
      }
    };
    const slide = () => {
      if (!gameRef.current.isSliding) {
        gameRef.current.isSliding = true;
        gameRef.current.slideTime = 1;
      }
    };

    // Keyboard Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'ArrowLeft' || e.key === 'q') goLeft();
      if (e.key === 'd' || e.key === 'ArrowRight' || e.key === 'e') goRight();
      if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') jump();
      if (e.key === 's' || e.key === 'ArrowDown') slide();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Touch Controls (Swipe Detection)
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (Math.abs(dx) > minSwipeDistance) {
          if (dx > 0) goRight();
          else goLeft();
        }
      } else {
        // Vertical swipe
        if (Math.abs(dy) > minSwipeDistance) {
          if (dy < 0) jump();
          else slide();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    // Helpers
    const spawnCoin = (z: number) => {
      const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12);
      const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.3 });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set(lanes[Math.floor(Math.random() * 3)], 0.5, z);
      scene.add(coin);
      gameRef.current.coins.push(coin);
    };

    const spawnObstacle = (z: number) => {
      const types: ('STONE' | 'FIRE' | 'WALL' | 'HOLE')[] = ['STONE', 'FIRE', 'WALL', 'HOLE'];
      const type = types[Math.floor(Math.random() * types.length)];
      const lane = lanes[Math.floor(Math.random() * 3)];
      
      let mesh: THREE.Mesh;
      if (type === 'STONE') {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        mesh.position.set(lane, 0.6, z);
      } else if (type === 'FIRE') {
        mesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 1, 8),
          new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff0000 })
        );
        mesh.position.set(lane, 0.5, z);
      } else if (type === 'WALL') {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.8, 0.3),
          new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        mesh.position.set(lane, 1.2, z); 
      } else {
        // HOLE - A dark plane on the floor to represent a pit
        mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2.5),
          new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(lane, 0.01, z);
      }
      mesh.castShadow = true;
      (mesh as any).obstacleType = type;
      scene.add(mesh);
      gameRef.current.obstacles.push(mesh);
    };

    const spawnPowerUp = (z: number) => {
      const magGeo = new THREE.TorusGeometry(0.2, 0.1, 8, 16);
      const magMat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5 });
      const mag = new THREE.Mesh(magGeo, magMat);
      mag.position.set(lanes[Math.floor(Math.random() * 3)], 0.5, z);
      scene.add(mag);
      gameRef.current.powerUps.push(mag);
    };

    // Game Loop
    let lastSpawnZ = -10;
    const animate = () => {
      const delta = gameRef.current.clock.getDelta();
      gameRef.current.animationId = requestAnimationFrame(animate);

      // Speed progression
      gameRef.current.speed += 0.00001;

      // Update Target X for lane movement
      gameRef.current.targetX = lanes[gameRef.current.currentLane + 1];
      player.position.x += (gameRef.current.targetX - player.position.x) * 0.15;

      // Jump Logic
      if (gameRef.current.isJumping) {
        player.position.y += gameRef.current.jumpVelocity;
        gameRef.current.jumpVelocity -= 0.015;
        if (player.position.y <= 0) {
          player.position.y = 0;
          gameRef.current.isJumping = false;
        }
      }

      // Slide Logic
      if (gameRef.current.isSliding) {
        player.scale.y = 0.5;
        gameRef.current.slideTime -= delta;
        if (gameRef.current.slideTime <= 0) {
          player.scale.y = 1;
          gameRef.current.isSliding = false;
        }
      }

      // Power Up Logic
      if (gameRef.current.magnetActive) {
        gameRef.current.magnetTime -= delta;
        if (gameRef.current.magnetTime <= 0) {
          gameRef.current.magnetActive = false;
        }
      }

      // Move Ground & Objects
      gameRef.current.groundParts.forEach((ground) => {
        ground.position.z += gameRef.current.speed * 60 * delta;
        if (ground.position.z > 10) {
          ground.position.z -= 50;
        }
      });

      // Spawn Logic
      if (Math.abs(lastSpawnZ - player.position.z) > 4) {
        const spawnZ = -20;
        const rand = Math.random();
        if (rand < 0.3) spawnObstacle(spawnZ);
        else if (rand < 0.8) spawnCoin(spawnZ);
        else if (rand < 0.85) spawnPowerUp(spawnZ);
        lastSpawnZ = player.position.z;
      }

      // Update Obstacles
      for (let i = gameRef.current.obstacles.length - 1; i >= 0; i--) {
        const obj = gameRef.current.obstacles[i];
        const type = (obj as any).obstacleType;
        obj.position.z += gameRef.current.speed * 60 * delta;
        
        // Collision
        const pBox = new THREE.Box3().setFromObject(player);
        const oBox = new THREE.Box3().setFromObject(obj);
        
        const isColliding = pBox.intersectsBox(oBox);

        // Special collision for HOLE and WALL
        let failed = false;
        if (isColliding) {
          if (type === 'HOLE' && !gameRef.current.isJumping) failed = true;
          else if (type === 'WALL' && !gameRef.current.isSliding) failed = true;
          else if (type === 'STONE' || type === 'FIRE') failed = true;
        }

        if (failed) {
          cancelAnimationFrame(gameRef.current.animationId!);
          onGameOver(Math.floor(gameRef.current.score));
          return;
        }

        if (obj.position.z > 5) {
          scene.remove(obj);
          gameRef.current.obstacles.splice(i, 1);
        }
      }

      // Update Coins
      for (let i = gameRef.current.coins.length - 1; i >= 0; i--) {
        const coin = gameRef.current.coins[i];
        coin.position.z += gameRef.current.speed * 60 * delta;
        coin.rotation.z += 0.05;

        if (gameRef.current.magnetActive) {
          const dist = player.position.distanceTo(coin.position);
          if (dist < 4) {
            coin.position.lerp(player.position, 0.1);
          }
        }

        const pBox = new THREE.Box3().setFromObject(player);
        const cBox = new THREE.Box3().setFromObject(coin);
        if (pBox.intersectsBox(cBox)) {
          scene.remove(coin);
          gameRef.current.coins.splice(i, 1);
          gameRef.current.score += 50;
          setCurrentScore(Math.floor(gameRef.current.score));
          continue;
        }

        if (coin.position.z > 5) {
          scene.remove(coin);
          gameRef.current.coins.splice(i, 1);
        }
      }

      // Update PowerUps
      for (let i = gameRef.current.powerUps.length - 1; i >= 0; i--) {
        const p = gameRef.current.powerUps[i];
        p.position.z += gameRef.current.speed * 60 * delta;
        p.rotation.y += 0.1;

        const pBox = new THREE.Box3().setFromObject(player);
        const ppBox = new THREE.Box3().setFromObject(p);
        if (pBox.intersectsBox(ppBox)) {
          scene.remove(p);
          gameRef.current.powerUps.splice(i, 1);
          gameRef.current.magnetActive = true;
          gameRef.current.magnetTime = 5;
          continue;
        }

        if (p.position.z > 5) {
          scene.remove(p);
          gameRef.current.powerUps.splice(i, 1);
        }
      }

      gameRef.current.score += delta * 10;
      setCurrentScore(Math.floor(gameRef.current.score));

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      if (gameRef.current.animationId) cancelAnimationFrame(gameRef.current.animationId);
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-none">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
        <div className="stat-box px-8 py-3 rounded-2xl shadow-2xl flex flex-col items-center">
          <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.3em] mb-1">Trek Distance</p>
          <p className="text-4xl font-black text-gold leading-none tracking-tighter">
            {currentScore.toLocaleString()}
          </p>
        </div>
        
        {gameRef.current.magnetActive && (
          <motion.div 
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            className="stat-box w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-cyan-400 group relative"
          >
            <div className="w-8 h-8 bg-black rounded-lg border-2 border-white flex flex-col justify-between p-1">
              <div className="h-1/3 bg-cyan-400 rounded-sm" />
              <div className="h-1/3 bg-white/20 rounded-sm" />
            </div>
            <div className="absolute -bottom-2 px-2 py-0.5 bg-cyan-400 text-[8px] font-black text-black rounded-full">ACTIVE</div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-10 left-10 text-white/20 font-black text-[10px] tracking-widest hidden md:block">
        INTENSITY: {Math.floor(gameRef.current.speed * 1000)}
      </div>
    </div>
  );
}
