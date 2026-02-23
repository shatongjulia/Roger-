
import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../GameEngine';
import { GameStatus } from '../types';
import { Trophy, RotateCcw, Play, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const starsRef = useRef<{ x: number; y: number; size: number; opacity: number }[]>([]);
  const dustRef = useRef<{ x: number; y: number; r: number }[]>([]);
  const [gameState, setGameState] = useState<{
    score: number;
    status: GameStatus;
    ammo: { left: number; mid: number; right: number };
  }>({
    score: 0,
    status: 'START',
    ammo: { left: 200, mid: 400, right: 200 }
  });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    engineRef.current = new GameEngine(width, height);
    
    const initBackground = (w: number, h: number) => {
      // Initialize stars
      const stars = [];
      for (let i = 0; i < 150; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 1.5,
          opacity: Math.random()
        });
      }
      starsRef.current = stars;

      // Initialize Milky Way dust
      const dust = [];
      for (let i = 0; i < 30; i++) {
        dust.push({
          x: (Math.random() - 0.5) * w * 2,
          y: (Math.random() - 0.5) * h * 0.4,
          r: Math.random() * 60 + 30
        });
      }
      dustRef.current = dust;
    };

    initBackground(width, height);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = (time: number) => {
      if (!engineRef.current || !ctx) return;

      engineRef.current.update(time);
      
      // Clear with Space Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#020617'); // Deep space blue
      bgGradient.addColorStop(1, '#0f172a'); // Slightly lighter near ground
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Nebula Effects
      ctx.globalCompositeOperation = 'screen';
      const nebula1 = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.3, 0, canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.4);
      nebula1.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
      nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nebula2 = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.6, 0, canvas.width * 0.8, canvas.height * 0.6, canvas.width * 0.3);
      nebula2.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
      nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Milky Way Band
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      const milkyWay = ctx.createLinearGradient(-canvas.width, 0, canvas.width, 0);
      milkyWay.addColorStop(0, 'rgba(255, 255, 255, 0)');
      milkyWay.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
      milkyWay.addColorStop(0.45, 'rgba(255, 255, 255, 0.12)');
      milkyWay.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
      milkyWay.addColorStop(0.55, 'rgba(255, 255, 255, 0.12)');
      milkyWay.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
      milkyWay.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = milkyWay;
      ctx.fillRect(-canvas.width, -canvas.height * 0.25, canvas.width * 2, canvas.height * 0.5);
      
      // Add "dust" to Milky Way
      ctx.globalCompositeOperation = 'overlay';
      dustRef.current.forEach(d => {
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        g.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';

      // Draw Stars
      ctx.fillStyle = '#fff';
      starsRef.current.forEach(star => {
        ctx.globalAlpha = star.opacity * (0.5 + 0.5 * Math.sin(time / 1000 + star.x));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Moon
      const moonX = canvas.width * 0.85;
      const moonY = canvas.height * 0.15;
      const moonRadius = 30;
      
      // Moon Glow
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * 2);
      moonGlow.addColorStop(0, 'rgba(255, 255, 230, 0.2)');
      moonGlow.addColorStop(1, 'rgba(255, 255, 230, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Moon Body (Crescent)
      ctx.fillStyle = '#fefce8';
      ctx.beginPath();
      // Outer arc
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner arc (shadow) - using background color to "cut"
      ctx.fillStyle = '#020617'; // Match top of gradient
      ctx.beginPath();
      ctx.arc(moonX - 12, moonY - 8, moonRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw Ground
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 20);
      ctx.lineTo(canvas.width, canvas.height - 20);
      ctx.stroke();

      // Draw Cities
      engineRef.current.cities.forEach(city => {
        if (!city.isDestroyed) {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(city.x - 10, city.y - 10, 20, 10);
          ctx.fillRect(city.x - 5, city.y - 15, 10, 5);
        } else {
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(city.x - 10, city.y - 5, 20, 5);
        }
      });

      // Draw Batteries
      engineRef.current.batteries.forEach((battery, idx) => {
        if (!battery.isDestroyed) {
          // Battery Base Glow
          const baseGlow = ctx.createRadialGradient(battery.x, battery.y - 10, 0, battery.x, battery.y - 10, 25);
          baseGlow.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
          baseGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = baseGlow;
          ctx.beginPath();
          ctx.arc(battery.x, battery.y - 10, 25, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(battery.x - 15, battery.y);
          ctx.lineTo(battery.x + 15, battery.y);
          ctx.lineTo(battery.x, battery.y - 20);
          ctx.closePath();
          ctx.fill();

          // Cannon detail
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(battery.x, battery.y - 10);
          ctx.lineTo(battery.x, battery.y - 25);
          ctx.stroke();
          
          // Ammo bar
          const barWidth = 30;
          const ammoPercent = battery.ammo / battery.maxAmmo;
          ctx.fillStyle = '#333';
          ctx.fillRect(battery.x - 15, battery.y + 5, barWidth, 4);
          ctx.fillStyle = ammoPercent > 0.2 ? '#10b981' : '#ef4444';
          ctx.fillRect(battery.x - 15, battery.y + 5, barWidth * ammoPercent, 4);
        } else {
          ctx.fillStyle = '#450a0a';
          ctx.beginPath();
          ctx.moveTo(battery.x - 15, battery.y);
          ctx.lineTo(battery.x + 15, battery.y);
          ctx.lineTo(battery.x, battery.y - 5);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Draw Rockets
      engineRef.current.rockets.forEach(r => {
        // Calculate direction for trail
        const dx = r.target.x - r.x;
        const dy = r.target.y - r.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / dist;
        const uy = dy / dist;

        // Draw Glow Trail
        const trailLength = 40;
        const trailGradient = ctx.createLinearGradient(r.x, r.y, r.x - ux * trailLength, r.y - uy * trailLength);
        trailGradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)'); // Red
        trailGradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.4)'); // Orange
        trailGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - ux * trailLength, r.y - uy * trailLength);
        ctx.stroke();

        // Draw Rocket Head Glow
        const headGlow = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 6);
        headGlow.addColorStop(0, '#fff');
        headGlow.addColorStop(0.3, '#ef4444');
        headGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Interceptors
      engineRef.current.interceptors.forEach(i => {
        // Trail Glow
        const trailGradient = ctx.createLinearGradient(i.start.x, i.start.y, i.x, i.y);
        trailGradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
        trailGradient.addColorStop(1, 'rgba(6, 182, 212, 0.5)');
        
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(i.start.x, i.start.y);
        ctx.lineTo(i.x, i.y);
        ctx.stroke();

        // Head Glow
        const headGlow = ctx.createRadialGradient(i.x, i.y, 0, i.x, i.y, 8);
        headGlow.addColorStop(0, '#fff');
        headGlow.addColorStop(0.4, '#06b6d4');
        headGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(i.x, i.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(i.x, i.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Target marker: Pulsing Crosshair
        const pulse = Math.sin(time / 200) * 2 + 5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time / 200) * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Circle
        ctx.arc(i.target.x, i.target.y, pulse, 0, Math.PI * 2);
        // Cross
        ctx.moveTo(i.target.x - pulse - 2, i.target.y);
        ctx.lineTo(i.target.x + pulse + 2, i.target.y);
        ctx.moveTo(i.target.x, i.target.y - pulse - 2);
        ctx.lineTo(i.target.x, i.target.y + pulse + 2);
        ctx.stroke();
      });

      // Draw Explosions
      engineRef.current.explosions.forEach(e => {
        // Outer Shockwave
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - e.elapsed / e.duration})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 1.2, 0, Math.PI * 2);
        ctx.stroke();

        const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.2, '#67e8f9'); // Cyan core
        gradient.addColorStop(0.5, '#fbbf24'); // Yellow
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Red fade
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update React State for UI
      setGameState({
        score: engineRef.current.score,
        status: engineRef.current.status,
        ammo: {
          left: engineRef.current.batteries[0].ammo,
          mid: engineRef.current.batteries[1].ammo,
          right: engineRef.current.batteries[2].ammo
        }
      });

      animationId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current || !engineRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      engineRef.current.resize(w, h);
      initBackground(w, h);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!engineRef.current || gameState.status !== 'PLAYING') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    engineRef.current.fireInterceptor(x, y);
  };

  const startGame = () => {
    engineRef.current?.init();
    setGameState(prev => ({ ...prev, status: 'PLAYING' }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden cursor-crosshair touch-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleClick}
        onTouchStart={handleClick}
        className="block"
      />

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md border border-white/10 p-4 rounded-xl">
          <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Score / 得分</div>
          <div className="text-3xl font-mono font-bold text-white">{gameState.score} <span className="text-sm text-white/30">/ 500</span></div>
        </div>

        <div className="flex gap-2">
          {[
            { label: 'L', val: gameState.ammo.left },
            { label: 'M', val: gameState.ammo.mid },
            { label: 'R', val: gameState.ammo.right }
          ].map((b, i) => (
            <div key={i} className="bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded-lg text-center min-w-[60px]">
              <div className="text-[10px] text-white/40">{b.label}</div>
              <div className={`text-sm font-mono font-bold ${b.val < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                {b.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {gameState.status === 'START' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.h1 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase italic"
            >
              Roger <span className="text-blue-500">Nova</span> Defense
              <br />
              <span className="text-2xl md:text-3xl font-normal text-white/50">Roger新星防御</span>
            </motion.h1>
            <p className="text-white/60 max-w-md mb-8 leading-relaxed">
              Protect your cities from falling rockets. Click to intercept.
              <br />
              保护你的城市免受火箭袭击。点击发射拦截导弹。
            </p>
            <button
              onClick={startGame}
              className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
            >
              <div className="relative z-10 flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                START MISSION / 开始任务
              </div>
            </button>
          </motion.div>
        )}

        {gameState.status === 'WON' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-emerald-500/20 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/50">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2 uppercase italic">Mission Success!</h2>
            <h3 className="text-xl text-white/80 mb-8">任务成功！</h3>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-white text-black font-bold rounded-full flex items-center gap-2 hover:bg-emerald-50 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              PLAY AGAIN / 再玩一次
            </button>
          </motion.div>
        )}

        {gameState.status === 'LOST' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-red-500/20 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-600/50">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2 uppercase italic">Defenses Breached</h2>
            <h3 className="text-xl text-white/80 mb-8">防御被攻破</h3>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-white text-black font-bold rounded-full flex items-center gap-2 hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              RETRY MISSION / 重试任务
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Overlay (Bottom) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-30 text-[10px] text-white uppercase tracking-[0.2em] whitespace-nowrap">
        Predict rocket trajectory • 预判火箭轨迹
      </div>
    </div>
  );
};
