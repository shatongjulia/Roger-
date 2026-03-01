
import { Point, Rocket, Interceptor, Explosion, City, Battery, GameStatus, Difficulty } from './types';

const INTERCEPTOR_SPEED = 0.015;
const EXPLOSION_MAX_RADIUS = 40;
const EXPLOSION_DURATION = 1000; // ms

export class GameEngine {
  score = 0;
  status: GameStatus = 'START';
  difficulty: Difficulty = 'MEDIUM';
  winningScore = 1000;
  rocketSpeedMin = 0.0002;
  rocketSpeedMax = 0.0008;
  spawnRateBase = 0.01;
  spawnRateFactor = 2500;
  
  rockets: Rocket[] = [];
  interceptors: Interceptor[] = [];
  explosions: Explosion[] = [];
  cities: City[] = [];
  batteries: Battery[] = [];
  lastTime = 0;
  width = 0;
  height = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.init();
  }

  init(difficulty: Difficulty = 'MEDIUM') {
    this.score = 0;
    this.status = 'START';
    this.difficulty = difficulty;
    this.rockets = [];
    this.interceptors = [];
    this.explosions = [];
    
    // Set difficulty parameters
    switch (difficulty) {
      case 'EASY':
        this.winningScore = 500;
        this.rocketSpeedMin = 0.0001;
        this.rocketSpeedMax = 0.0005;
        this.spawnRateBase = 0.005;
        this.spawnRateFactor = 3000;
        break;
      case 'MEDIUM':
        this.winningScore = 1000;
        this.rocketSpeedMin = 0.0002;
        this.rocketSpeedMax = 0.0008;
        this.spawnRateBase = 0.01;
        this.spawnRateFactor = 2500;
        break;
      case 'HARD':
        this.winningScore = 2000;
        this.rocketSpeedMin = 0.0004;
        this.rocketSpeedMax = 0.0012;
        this.spawnRateBase = 0.02;
        this.spawnRateFactor = 2000;
        break;
    }
    
    // Initialize cities
    const cityY = this.height - 30;
    this.cities = [
      { id: 'c1', x: this.width * 0.2, y: cityY, isDestroyed: false },
      { id: 'c2', x: this.width * 0.3, y: cityY, isDestroyed: false },
      { id: 'c3', x: this.width * 0.4, y: cityY, isDestroyed: false },
      { id: 'c4', x: this.width * 0.6, y: cityY, isDestroyed: false },
      { id: 'c5', x: this.width * 0.7, y: cityY, isDestroyed: false },
      { id: 'c6', x: this.width * 0.8, y: cityY, isDestroyed: false },
    ];

    // Initialize batteries
    const batteryY = this.height - 40;
    this.batteries = [
      { id: 'b1', x: this.width * 0.1, y: batteryY, ammo: 200, maxAmmo: 200, isDestroyed: false },
      { id: 'b2', x: this.width * 0.5, y: batteryY, ammo: 400, maxAmmo: 400, isDestroyed: false },
      { id: 'b3', x: this.width * 0.9, y: batteryY, ammo: 200, maxAmmo: 200, isDestroyed: false },
    ];
  }

  resize(width: number, height: number) {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    
    this.width = width;
    this.height = height;

    this.cities.forEach(c => { c.x *= scaleX; c.y *= scaleY; });
    this.batteries.forEach(b => { b.x *= scaleX; b.y *= scaleY; });
    this.rockets.forEach(r => {
      r.x *= scaleX; r.y *= scaleY;
      r.target.x *= scaleX; r.target.y *= scaleY;
    });
    this.interceptors.forEach(i => {
      i.x *= scaleX; i.y *= scaleY;
      i.start.x *= scaleX; i.start.y *= scaleY;
      i.target.x *= scaleX; i.target.y *= scaleY;
    });
    this.explosions.forEach(e => { e.x *= scaleX; e.y *= scaleY; });
  }

  spawnRocket() {
    if (this.status !== 'PLAYING') return;
    
    const targets = [...this.cities.filter(c => !c.isDestroyed), ...this.batteries.filter(b => !b.isDestroyed)];
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const startX = Math.random() * this.width;
    
    this.rockets.push({
      id: Math.random().toString(36).substr(2, 9),
      x: startX,
      y: 0,
      target: { x: target.x, y: target.y },
      speed: this.rocketSpeedMin + Math.random() * (this.rocketSpeedMax - this.rocketSpeedMin),
      progress: 0,
      isDestroyed: false
    });
  }

  fireInterceptor(targetX: number, targetY: number) {
    if (this.status !== 'PLAYING') return;

    // Find best battery (closest with ammo)
    let bestBattery: Battery | null = null;
    let minDist = Infinity;

    this.batteries.forEach(b => {
      if (!b.isDestroyed && b.ammo > 0) {
        const dist = Math.sqrt(Math.pow(b.x - targetX, 2) + Math.pow(b.y - targetY, 2));
        if (dist < minDist) {
          minDist = dist;
          bestBattery = b;
        }
      }
    });

    if (bestBattery) {
      (bestBattery as Battery).ammo--;
      this.interceptors.push({
        id: Math.random().toString(36).substr(2, 9),
        x: (bestBattery as Battery).x,
        y: (bestBattery as Battery).y,
        start: { x: (bestBattery as Battery).x, y: (bestBattery as Battery).y },
        target: { x: targetX, y: targetY },
        speed: INTERCEPTOR_SPEED,
        progress: 0,
        isExploded: false
      });
    }
  }

  update(time: number) {
    if (this.status !== 'PLAYING') return;
    const dt = time - (this.lastTime || time);
    this.lastTime = time;

    // Spawn rockets periodically
    if (Math.random() < this.spawnRateBase + (this.score / this.spawnRateFactor)) {
      this.spawnRocket();
    }

    // Update rockets
    this.rockets.forEach(r => {
      const dx = r.target.x - r.x;
      const dy = r.target.y - r.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        r.isDestroyed = true;
        this.handleImpact(r.target);
      } else {
        const moveDist = r.speed * dt * 100;
        const ratio = Math.min(moveDist / dist, 1);
        r.x += dx * ratio;
        r.y += dy * ratio;
      }
    });
    this.rockets = this.rockets.filter(r => !r.isDestroyed);

    // Update interceptors
    this.interceptors.forEach(i => {
      const dx = i.target.x - i.x;
      const dy = i.target.y - i.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        i.isExploded = true;
        this.explosions.push({
          id: Math.random().toString(36).substr(2, 9),
          x: i.target.x,
          y: i.target.y,
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          duration: EXPLOSION_DURATION,
          elapsed: 0
        });
      } else {
        const moveDist = i.speed * dt * 100;
        const ratio = Math.min(moveDist / dist, 1);
        i.x += dx * ratio;
        i.y += dy * ratio;
      }
    });
    this.interceptors = this.interceptors.filter(i => !i.isExploded);

    // Update explosions
    this.explosions.forEach(e => {
      e.elapsed += dt;
      const halfLife = e.duration / 2;
      if (e.elapsed < halfLife) {
        e.radius = (e.elapsed / halfLife) * e.maxRadius;
      } else {
        e.radius = (1 - (e.elapsed - halfLife) / halfLife) * e.maxRadius;
      }

      // Check collision with rockets
      this.rockets.forEach(r => {
        const dist = Math.sqrt(Math.pow(r.x - e.x, 2) + Math.pow(r.y - e.y, 2));
        if (dist < e.radius) {
          r.isDestroyed = true;
          this.score += 20;
          if (this.score >= this.winningScore) {
            this.status = 'WON';
          }
        }
      });
    });
    this.explosions = this.explosions.filter(e => e.elapsed < e.duration);

    // Check game over
    const activeBatteries = this.batteries.filter(b => !b.isDestroyed);
    if (activeBatteries.length === 0) {
      this.status = 'LOST';
    }
  }

  handleImpact(point: Point) {
    // Check if hit city or battery
    this.cities.forEach(c => {
      const dist = Math.sqrt(Math.pow(c.x - point.x, 2) + Math.pow(c.y - point.y, 2));
      if (dist < 20) c.isDestroyed = true;
    });
    this.batteries.forEach(b => {
      const dist = Math.sqrt(Math.pow(b.x - point.x, 2) + Math.pow(b.y - point.y, 2));
      if (dist < 20) b.isDestroyed = true;
    });
  }

  getAmmo() {
    return {
      left: this.batteries[0]?.ammo || 0,
      mid: this.batteries[1]?.ammo || 0,
      right: this.batteries[2]?.ammo || 0
    };
  }
}
