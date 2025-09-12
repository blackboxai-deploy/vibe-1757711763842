import { GameState, Player, GameToken, GameMove, PlayerColor, BOARD_CONFIG } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

export class LudoGameLogic {
  
  /**
   * Initialize a new game state with players
   */
  static initializeGame(players: Player[]): GameState {
    // Initialize tokens for each player
    const playersWithTokens = players.map(player => ({
      ...player,
      tokens: Array.from({ length: BOARD_CONFIG.TOKENS_PER_PLAYER }).map((_, index) => ({
        id: `${player.id}_token_${index}`,
        playerId: player.id,
        color: player.color,
        position: BOARD_CONFIG.HOME_POSITION,
        isSelected: false,
        canMove: false,
        status: 'home' as const
      }))
    }));

    return {
      roomId: '',
      players: playersWithTokens,
      currentPlayerIndex: 0,
      dice: {
        value: 0,
        playerId: '',
        timestamp: Date.now(),
        isRolling: false
      },
      gameStatus: players.length === 2 ? 'playing' : 'waiting',
      winner: null,
      moveHistory: [],
      canRollDice: true,
      canMoveToken: false,
      validMoves: []
    };
  }

  /**
   * Roll dice and update game state
   */
  static rollDice(gameState: GameState, playerId: string): GameState {
    if (!gameState.canRollDice || 
        gameState.players[gameState.currentPlayerIndex].id !== playerId) {
      return gameState;
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Calculate valid moves after dice roll
    const validMoves = this.calculateValidMoves(currentPlayer, diceValue);

    const newGameState: GameState = {
      ...gameState,
      dice: {
        value: diceValue,
        playerId,
        timestamp: Date.now(),
        isRolling: false
      },
      canRollDice: false,
      canMoveToken: validMoves.length > 0,
      validMoves
    };

    // If no valid moves, end turn (unless rolled 6)
    if (validMoves.length === 0) {
      if (diceValue !== 6) {
        return this.endTurn(newGameState);
      } else {
        // Rolled 6 but can't move, get another roll
        return {
          ...newGameState,
          canRollDice: true,
          canMoveToken: false
        };
      }
    }

    return newGameState;
  }

  /**
   * Calculate valid moves for a player with given dice value
   */
  static calculateValidMoves(player: Player, diceValue: number): string[] {
    const validMoves: string[] = [];

    for (const token of player.tokens) {
      if (this.canTokenMove(token, diceValue, player.color)) {
        validMoves.push(token.id);
      }
    }

    return validMoves;
  }

  /**
   * Check if a token can move with the given dice value
   */
  static canTokenMove(token: GameToken, diceValue: number, playerColor: PlayerColor): boolean {
    // Token at home can only move with 6
    if (token.position === BOARD_CONFIG.HOME_POSITION) {
      return diceValue === 6;
    }

    // Token already finished cannot move
    if (token.position === BOARD_CONFIG.FINISHED_POSITION) {
      return false;
    }

    // Check if move would go beyond finish
    const newPosition = token.position + diceValue;
    const homeStretchStart = BOARD_CONFIG.HOME_STRETCH_START[playerColor];
    
    // If in home stretch, check if move is valid
    if (token.position >= homeStretchStart) {
      return newPosition <= BOARD_CONFIG.FINISHED_POSITION;
    }

    // Regular board move
    return newPosition < BOARD_CONFIG.TOTAL_SQUARES;
  }

  /**
   * Move a token and update game state
   */
  static moveToken(gameState: GameState, playerId: string, tokenId: string, newPosition?: number): GameState {
    if (!gameState.canMoveToken || 
        !gameState.validMoves.includes(tokenId) ||
        gameState.players[gameState.currentPlayerIndex].id !== playerId) {
      return gameState;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const token = currentPlayer.tokens.find(t => t.id === tokenId);
    
    if (!token) return gameState;

    const diceValue = gameState.dice.value;
    const calculatedNewPosition = this.calculateNewPosition(token, diceValue, currentPlayer.color);
    const finalPosition = newPosition ?? calculatedNewPosition;

    // Create move record
    const move: GameMove = {
      id: uuidv4(),
      playerId,
      tokenId,
      from: token.position,
      to: finalPosition,
      diceValue,
      timestamp: Date.now(),
      isCapture: false
    };

    // Check for captures
    const capturedToken = this.checkForCapture(gameState, finalPosition, currentPlayer.id);
    if (capturedToken) {
      move.isCapture = true;
      move.capturedTokenId = capturedToken.id;
    }

    // Update game state
    const updatedPlayers = gameState.players.map(player => {
      if (player.id === playerId) {
        // Update current player's token
        return {
          ...player,
          tokens: player.tokens.map(t => 
            t.id === tokenId 
              ? { ...t, position: finalPosition, status: this.getTokenStatus(finalPosition) }
              : t
          )
        };
      } else if (capturedToken && capturedToken.playerId === player.id) {
        // Send captured token home
        return {
          ...player,
          tokens: player.tokens.map(t =>
            t.id === capturedToken.id
              ? { ...t, position: BOARD_CONFIG.HOME_POSITION, status: 'home' as const }
              : t
          )
        };
      }
      return player;
    });

    const updatedGameState: GameState = {
      ...gameState,
      players: updatedPlayers,
      moveHistory: [...gameState.moveHistory, move],
      canRollDice: false,
      canMoveToken: false,
      validMoves: []
    };

    // Check for win condition
    const winner = this.checkWinCondition(updatedPlayers);
    if (winner) {
      return {
        ...updatedGameState,
        gameStatus: 'finished',
        winner
      };
    }

    // If rolled 6 or captured, get another turn
    if (diceValue === 6 || move.isCapture) {
      return {
        ...updatedGameState,
        canRollDice: true
      };
    }

    // End turn
    return this.endTurn(updatedGameState);
  }

  /**
   * Calculate new position for a token
   */
  static calculateNewPosition(token: GameToken, diceValue: number, playerColor: PlayerColor): number {
    if (token.position === BOARD_CONFIG.HOME_POSITION && diceValue === 6) {
      return BOARD_CONFIG.START_SQUARES[playerColor];
    }

    const newPosition = token.position + diceValue;
    const homeStretchStart = BOARD_CONFIG.HOME_STRETCH_START[playerColor];

    // Handle home stretch
    if (token.position >= homeStretchStart && newPosition > BOARD_CONFIG.TOTAL_SQUARES - 1) {
      return BOARD_CONFIG.FINISHED_POSITION;
    }

    // Handle board wrap-around
    return newPosition % BOARD_CONFIG.TOTAL_SQUARES;
  }

  /**
   * Check if a move captures an opponent token
   */
  static checkForCapture(gameState: GameState, position: number, currentPlayerId: string): GameToken | null {
    // Can't capture on safe squares
    const allSafeSquares = [
      ...BOARD_CONFIG.SAFE_SQUARES.red,
      ...BOARD_CONFIG.SAFE_SQUARES.blue
    ];

    if (allSafeSquares.includes(position)) {
      return null;
    }

    // Find opponent tokens on this position
    for (const player of gameState.players) {
      if (player.id !== currentPlayerId) {
        for (const token of player.tokens) {
          if (token.position === position) {
            return token;
          }
        }
      }
    }

    return null;
  }

  /**
   * Get token status based on position
   */
  static getTokenStatus(position: number): 'home' | 'board' | 'safe' | 'finished' {
    if (position === BOARD_CONFIG.HOME_POSITION) return 'home';
    if (position === BOARD_CONFIG.FINISHED_POSITION) return 'finished';
    
    const allSafeSquares = [
      ...BOARD_CONFIG.SAFE_SQUARES.red,
      ...BOARD_CONFIG.SAFE_SQUARES.blue
    ];
    
    if (allSafeSquares.includes(position)) return 'safe';
    
    return 'board';
  }

  /**
   * Check if any player has won
   */
  static checkWinCondition(players: Player[]): Player | null {
    for (const player of players) {
      const finishedTokens = player.tokens.filter(token => 
        token.position === BOARD_CONFIG.FINISHED_POSITION
      ).length;
      
      if (finishedTokens === BOARD_CONFIG.TOKENS_PER_PLAYER) {
        return player;
      }
    }
    return null;
  }

  /**
   * End current player's turn
   */
  static endTurn(gameState: GameState): GameState {
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    return {
      ...gameState,
      currentPlayerIndex: nextPlayerIndex,
      canRollDice: true,
      canMoveToken: false,
      validMoves: []
    };
  }

  /**
   * Add a player to the game
   */
  static addPlayer(gameState: GameState, player: Player): GameState {
    if (gameState.players.length >= 2) {
      return gameState; // Game is full
    }

    const playerWithTokens = {
      ...player,
      tokens: Array.from({ length: BOARD_CONFIG.TOKENS_PER_PLAYER }).map((_, index) => ({
        id: `${player.id}_token_${index}`,
        playerId: player.id,
        color: player.color,
        position: BOARD_CONFIG.HOME_POSITION,
        isSelected: false,
        canMove: false,
        status: 'home' as const
      }))
    };

    const updatedPlayers = [...gameState.players, playerWithTokens];
    
    return {
      ...gameState,
      players: updatedPlayers,
      gameStatus: updatedPlayers.length === 2 ? 'playing' : 'waiting'
    };
  }

  /**
   * Remove a player from the game
   */
  static removePlayer(gameState: GameState, playerId: string): GameState {
    const updatedPlayers = gameState.players.filter(p => p.id !== playerId);
    
    // If current player left, adjust current player index
    let newCurrentPlayerIndex = gameState.currentPlayerIndex;
    if (newCurrentPlayerIndex >= updatedPlayers.length) {
      newCurrentPlayerIndex = 0;
    }

    return {
      ...gameState,
      players: updatedPlayers,
      currentPlayerIndex: newCurrentPlayerIndex,
      gameStatus: updatedPlayers.length < 2 ? 'waiting' : 'playing'
    };
  }
}