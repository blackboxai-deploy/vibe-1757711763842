import { GameRoom, Player, PlayerColor } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

export class RoomManager {
  private static rooms = new Map<string, GameRoom>();
  private static roomCodes = new Map<string, string>(); // code -> roomId mapping

  /**
   * Generate a unique 6-digit room code
   */
  static generateRoomCode(): string {
    let code: string;
    let attempts = 0;
    do {
      // Generate a proper 6-character alphanumeric code
      code = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
      if (attempts > 100) break; // Safety check
    } while (this.roomCodes.has(code));
    
    return code;
  }

  /**
   * Create a new game room
   */
  static createRoom(playerName: string): { success: boolean; room?: GameRoom; playerId?: string; error?: string } {
    try {
      const roomId = uuidv4();
      const roomCode = this.generateRoomCode();
      const playerId = uuidv4();
      
      // Create first player (always red)
      const player: Player = {
        id: playerId,
        name: playerName,
        color: 'red',
        isOnline: true,
        isCurrentTurn: true,
        tokens: [],
        score: 0
      };

      const room: GameRoom = {
        id: roomId,
        code: roomCode,
        players: [player],
        maxPlayers: 2,
        status: 'waiting',
        createdAt: Date.now(),
        lastActivity: Date.now()
      };

      this.rooms.set(roomId, room);
      this.roomCodes.set(roomCode, roomId);

      return { success: true, room, playerId };
    } catch (error) {
      return { success: false, error: 'Failed to create room' };
    }
  }

  /**
   * Join an existing room
   */
  static joinRoom(roomCode: string, playerName: string): { success: boolean; room?: GameRoom; playerId?: string; error?: string } {
    try {
      const roomId = this.roomCodes.get(roomCode.toUpperCase());
      if (!roomId) {
        return { success: false, error: 'Room not found' };
      }

      const room = this.rooms.get(roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      if (room.players.length >= room.maxPlayers) {
        return { success: false, error: 'Room is full' };
      }

      if (room.status === 'finished') {
        return { success: false, error: 'Game has already finished' };
      }

      const playerId = uuidv4();
      
      // Create second player (always blue)
      const player: Player = {
        id: playerId,
        name: playerName,
        color: 'blue',
        isOnline: true,
        isCurrentTurn: false,
        tokens: [],
        score: 0
      };

      room.players.push(player);
      room.lastActivity = Date.now();

      // Start the game when room is full
      if (room.players.length === room.maxPlayers) {
        room.status = 'playing';
      }

      return { success: true, room, playerId };
    } catch (error) {
      return { success: false, error: 'Failed to join room' };
    }
  }

  /**
   * Get room by ID
   */
  static getRoomById(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Get room by code
   */
  static getRoomByCode(code: string): GameRoom | null {
    const roomId = this.roomCodes.get(code.toUpperCase());
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  /**
   * Update room activity timestamp
   */
  static updateActivity(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivity = Date.now();
    }
  }

  /**
   * Set player online status
   */
  static setPlayerOnlineStatus(roomId: string, playerId: string, isOnline: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    player.isOnline = isOnline;
    room.lastActivity = Date.now();
    
    return true;
  }

  /**
   * Remove player from room
   */
  static removePlayerFromRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    room.players.splice(playerIndex, 1);
    room.lastActivity = Date.now();

    // If room is empty, clean it up
    if (room.players.length === 0) {
      this.cleanupRoom(roomId);
    } else {
      // Reset room status if not enough players
      if (room.players.length < room.maxPlayers && room.status === 'playing') {
        room.status = 'waiting';
      }
    }

    return true;
  }

  /**
   * Clean up room and its code mapping
   */
  static cleanupRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      this.roomCodes.delete(room.code);
      this.rooms.delete(roomId);
    }
  }

  /**
   * Clean up inactive rooms (older than 1 hour)
   */
  static cleanupInactiveRooms(): number {
    let cleanedUp = 0;
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.lastActivity < oneHourAgo) {
        this.cleanupRoom(roomId);
        cleanedUp++;
      }
    }

    return cleanedUp;
  }

  /**
   * Get room statistics
   */
  static getStats() {
    const totalRooms = this.rooms.size;
    const activeRooms = Array.from(this.rooms.values()).filter(room => 
      room.status === 'playing'
    ).length;
    const waitingRooms = Array.from(this.rooms.values()).filter(room => 
      room.status === 'waiting'
    ).length;

    return {
      totalRooms,
      activeRooms,
      waitingRooms,
      totalPlayers: Array.from(this.rooms.values()).reduce((sum, room) => 
        sum + room.players.length, 0
      )
    };
  }

  /**
   * Validate room code format
   */
  static isValidRoomCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
  }

  /**
   * Get available color for new player
   */
  static getAvailableColor(room: GameRoom): PlayerColor | null {
    const usedColors = room.players.map(p => p.color);
    const availableColors: PlayerColor[] = ['red', 'blue'];
    
    for (const color of availableColors) {
      if (!usedColors.includes(color)) {
        return color;
      }
    }
    
    return null;
  }

  /**
   * Update room status
   */
  static updateRoomStatus(roomId: string, status: GameRoom['status']): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.status = status;
    room.lastActivity = Date.now();
    
    return true;
  }
}

// Start cleanup interval (run every 10 minutes)
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    const cleaned = RoomManager.cleanupInactiveRooms();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} inactive rooms`);
    }
  }, 10 * 60 * 1000);
}