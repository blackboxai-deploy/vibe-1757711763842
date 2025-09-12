// Game types and interfaces for the Ludo game

export type PlayerColor = 'red' | 'blue';
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type TokenStatus = 'home' | 'board' | 'safe' | 'finished';

export interface Position {
  x: number;
  y: number;
}

export interface GameToken {
  id: string;
  playerId: string;
  color: PlayerColor;
  position: number; // Board position (0-83, -1 for home, 84 for finished)
  isSelected: boolean;
  canMove: boolean;
  status: TokenStatus;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isOnline: boolean;
  isCurrentTurn: boolean;
  tokens: GameToken[];
  score: number; // Number of tokens that reached home
}

export interface DiceRoll {
  value: number;
  playerId: string;
  timestamp: number;
  isRolling: boolean;
}

export interface GameRoom {
  id: string;
  code: string;
  players: Player[];
  maxPlayers: number;
  status: GameStatus;
  createdAt: number;
  lastActivity: number;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  dice: DiceRoll;
  gameStatus: GameStatus;
  winner: Player | null;
  moveHistory: GameMove[];
  canRollDice: boolean;
  canMoveToken: boolean;
  validMoves: string[]; // Token IDs that can move
}

export interface GameMove {
  id: string;
  playerId: string;
  tokenId: string;
  from: number;
  to: number;
  diceValue: number;
  timestamp: number;
  isCapture: boolean;
  capturedTokenId?: string;
}

export interface RoomCreationResponse {
  success: boolean;
  room?: GameRoom;
  error?: string;
}

export interface RoomJoinResponse {
  success: boolean;
  room?: GameRoom;
  playerId?: string;
  error?: string;
}

export interface GameResponse {
  success: boolean;
  gameState?: GameState;
  error?: string;
}

// WebSocket message types
export type SocketMessage = 
  | { type: 'PLAYER_JOINED'; payload: Player }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string } }
  | { type: 'GAME_STATE_UPDATE'; payload: GameState }
  | { type: 'DICE_ROLLED'; payload: DiceRoll }
  | { type: 'TOKEN_MOVED'; payload: GameMove }
  | { type: 'GAME_FINISHED'; payload: { winner: Player } }
  | { type: 'ERROR'; payload: { message: string } };

// Board configuration constants
export const BOARD_CONFIG = {
  TOTAL_SQUARES: 84,
  HOME_POSITION: -1,
  FINISHED_POSITION: 84,
  TOKENS_PER_PLAYER: 4,
  SAFE_SQUARES: {
    red: [1, 9, 14, 22, 27, 35, 40, 48] as number[],
    blue: [22, 30, 35, 43, 48, 56, 61, 69] as number[]
  },
  START_SQUARES: {
    red: 1,
    blue: 22
  },
  HOME_STRETCH_START: {
    red: 75,
    blue: 18
  }
} as const;

// Animation configurations
export const ANIMATION_CONFIG = {
  TOKEN_MOVE_DURATION: 0.5,
  DICE_ROLL_DURATION: 1.0,
  BOUNCE_SCALE: 1.1,
  HOVER_SCALE: 1.05
} as const;