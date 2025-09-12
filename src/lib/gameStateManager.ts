import { GameState, Player } from '@/types/game';
import { LudoGameLogic } from './gameLogic';
import { RoomManager } from './roomUtils';

export class GameStateManager {
  private static gameStates = new Map<string, GameState>();

  /**
   * Initialize game state for a room
   */
  static initializeGameState(roomId: string): GameState | null {
    const room = RoomManager.getRoomById(roomId);
    if (!room || room.players.length < 2) {
      return null;
    }

    const gameState = LudoGameLogic.initializeGame(room.players);
    gameState.roomId = roomId;
    
    this.gameStates.set(roomId, gameState);
    return gameState;
  }

  /**
   * Get game state for a room
   */
  static getGameState(roomId: string): GameState | null {
    let gameState = this.gameStates.get(roomId);
    
    // If game state doesn't exist, try to initialize it
    if (!gameState) {
      const room = RoomManager.getRoomById(roomId);
      if (room && room.players.length === 2) {
        const initializedState = this.initializeGameState(roomId);
        if (initializedState) {
          gameState = initializedState;
        }
      }
    }

    return gameState || null;
  }

  /**
   * Update game state
   */
  static updateGameState(roomId: string, gameState: GameState): boolean {
    if (!this.gameStates.has(roomId)) {
      return false;
    }

    this.gameStates.set(roomId, gameState);
    RoomManager.updateActivity(roomId);
    return true;
  }

  /**
   * Roll dice for a player
   */
  static rollDice(roomId: string, playerId: string): GameState | null {
    const gameState = this.getGameState(roomId);
    if (!gameState) {
      return null;
    }

    const updatedState = LudoGameLogic.rollDice(gameState, playerId);
    this.updateGameState(roomId, updatedState);
    
    return updatedState;
  }

  /**
   * Move a token
   */
  static moveToken(roomId: string, playerId: string, tokenId: string, newPosition?: number): GameState | null {
    const gameState = this.getGameState(roomId);
    if (!gameState) {
      return null;
    }

    const updatedState = LudoGameLogic.moveToken(gameState, playerId, tokenId, newPosition);
    this.updateGameState(roomId, updatedState);

    // Update room status if game is finished
    if (updatedState.gameStatus === 'finished') {
      RoomManager.updateRoomStatus(roomId, 'finished');
    }
    
    return updatedState;
  }

  /**
   * Add player to game
   */
  static addPlayerToGame(roomId: string, player: Player): GameState | null {
    let gameState = this.getGameState(roomId);
    
    if (!gameState) {
      // Initialize new game state
      const room = RoomManager.getRoomById(roomId);
      if (!room) return null;
      
      gameState = LudoGameLogic.initializeGame(room.players);
      gameState.roomId = roomId;
      this.gameStates.set(roomId, gameState);
      return gameState;
    }

    const updatedState = LudoGameLogic.addPlayer(gameState, player);
    this.updateGameState(roomId, updatedState);
    
    return updatedState;
  }

  /**
   * Remove player from game
   */
  static removePlayerFromGame(roomId: string, playerId: string): GameState | null {
    const gameState = this.getGameState(roomId);
    if (!gameState) {
      return null;
    }

    const updatedState = LudoGameLogic.removePlayer(gameState, playerId);
    this.updateGameState(roomId, updatedState);
    
    return updatedState;
  }

  /**
   * Clean up game state when room is deleted
   */
  static cleanupGameState(roomId: string): void {
    this.gameStates.delete(roomId);
  }

  /**
   * Get all active games count
   */
  static getActiveGamesCount(): number {
    return this.gameStates.size;
  }

  /**
   * Clean up inactive game states (older than 2 hours)
   */
  static cleanupInactiveGameStates(): number {
    let cleanedUp = 0;
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);

    for (const [roomId, gameState] of this.gameStates.entries()) {
      const room = RoomManager.getRoomById(roomId);
      
      // Clean up if room doesn't exist or is inactive
      if (!room || room.lastActivity < twoHoursAgo) {
        this.gameStates.delete(roomId);
        cleanedUp++;
      }
    }

    return cleanedUp;
  }

  /**
   * Validate player's turn
   */
  static isPlayerTurn(roomId: string, playerId: string): boolean {
    const gameState = this.getGameState(roomId);
    if (!gameState) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer?.id === playerId;
  }

  /**
   * Get player's valid moves
   */
  static getValidMoves(roomId: string, playerId: string): string[] {
    const gameState = this.getGameState(roomId);
    if (!gameState || !this.isPlayerTurn(roomId, playerId)) {
      return [];
    }

    return gameState.validMoves;
  }
}

// Start cleanup interval for game states (run every 15 minutes)
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    const cleaned = GameStateManager.cleanupInactiveGameStates();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} inactive game states`);
    }
  }, 15 * 60 * 1000);
}