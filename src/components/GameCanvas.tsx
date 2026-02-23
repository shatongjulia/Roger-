
import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../GameEngine';
import { GameStatus } from '../types';
import { Trophy, RotateCcw, Play, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = (time: number) => {
      if (!engineRef.current || !ctx) return;

      engineRef.current.update(time);
      
      // Clear
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Ground
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

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
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(battery.x - 15, battery.y);
          ctx.lineTo(battery.x + 15, battery.y);
          ctx.lineTo(battery.x, battery.y - 20);
          ctx.closePath();
          ctx.fill();
          
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
      ctx.lineWidth = 1;
      engineRef.current.rockets.forEach(r => {
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - (r.target.x - r.x) * 0.1, r.y - (r.target.y - r.y) * 0.1);
        ctx.stroke();
        
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Interceptors
      engineRef.current.interceptors.forEach(i => {
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(i.start.x, i.start.y);
        ctx.lineTo(i.x, i.y);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(i.x, i.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Target marker X
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(i.target.x - 3, i.target.y - 3);
        ctx.lineTo(i.target.x + 3, i.target.y + 3);
        ctx.moveTo(i.target.x + 3, i.target.y - 3);
        ctx.lineTo(i.target.x - 3, i.target.y + 3);
        ctx.stroke();
      });

      // Draw Explosions
      engineRef.current.explosions.forEach(e => {
        const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.4, '#fbbf24');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        
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
          <div className="text-3xl font-mono font-bold text-white">{gameState.score} <span className="text-sm text-white/30">/ 200</span></div>
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
