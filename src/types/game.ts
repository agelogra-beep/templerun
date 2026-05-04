export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum Lane {
  LEFT = -1,
  CENTER = 0,
  RIGHT = 1,
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  coins: number;
}

export type ObstacleType = 'STONE' | 'FIRE' | 'HOLE' | 'WALL';
export type PowerUpType = 'MAGNET';
