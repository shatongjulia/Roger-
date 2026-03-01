
export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
}

export interface Rocket extends Entity {
  target: Point;
  speed: number;
  progress: number; // 0 to 1
  isDestroyed: boolean;
}

export interface Interceptor extends Entity {
  start: Point;
  target: Point;
  speed: number;
  progress: number; // 0 to 1
  isExploded: boolean;
}

export interface Explosion extends Point {
  id: string;
  radius: number;
  maxRadius: number;
  duration: number;
  elapsed: number;
}

export interface City extends Point {
  id: string;
  isDestroyed: boolean;
}

export interface Battery extends Point {
  id: string;
  ammo: number;
  maxAmmo: number;
  isDestroyed: boolean;
}

export type GameStatus = 'START' | 'PLAYING' | 'WON' | 'LOST';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface GameState {
  score: number;
  status: GameStatus;
  rockets: Rocket[];
  interceptors: Interceptor[];
  explosions: Explosion[];
  cities: City[];
  batteries: Battery[];
}
