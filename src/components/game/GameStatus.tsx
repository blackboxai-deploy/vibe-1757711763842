'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Player } from '@/types/game';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface GameStatusProps {
  gameState: GameState;
  currentPlayer: Player | null;
  connectionError: string;
}

export function GameStatus({ gameState, currentPlayer, connectionError }: GameStatusProps) {
  
  const getCurrentTurnPlayer = () => {
    return gameState.players[gameState.currentPlayerIndex];
  };

  const isMyTurn = () => {
    return currentPlayer && getCurrentTurnPlayer()?.id === currentPlayer.id;
  };

  const getStatusMessage = () => {
    if (connectionError) {
      return {
        type: 'error' as const,
        icon: '⚠️',
        message: connectionError,
        color: 'bg-red-100 border-red-400 text-red-800'
      };
    }

    if (gameState.gameStatus === 'waiting') {
      return {
        type: 'waiting' as const,
        icon: '⏳',
        message: `Waiting for players... (${gameState.players.length}/2)`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800'
      };
    }

    if (gameState.gameStatus === 'finished' && gameState.winner) {
      const isWinner = currentPlayer?.id === gameState.winner.id;
      return {
        type: 'finished' as const,
        icon: isWinner ? '🎉' : '😢',
        message: isWinner 
          ? 'Congratulations! You won!' 
          : `Game Over! ${gameState.winner.name} won!`,
        color: isWinner 
          ? 'bg-green-100 border-green-400 text-green-800'
          : 'bg-gray-100 border-gray-400 text-gray-800'
      };
    }

    if (gameState.gameStatus === 'playing') {
      const turnPlayer = getCurrentTurnPlayer();
      if (!turnPlayer) {
        return {
          type: 'playing' as const,
          icon: '🎲',
          message: 'Loading game state...',
          color: 'bg-blue-100 border-blue-400 text-blue-800'
        };
      }

      if (isMyTurn()) {
        if (gameState.canRollDice) {
          return {
            type: 'my-turn-roll' as const,
            icon: '🎲',
            message: "It's your turn! Roll the dice to start.",
            color: 'bg-green-100 border-green-400 text-green-800'
          };
        } else if (gameState.canMoveToken) {
          return {
            type: 'my-turn-move' as const,
            icon: '🎯',
            message: "Select a token to move!",
            color: 'bg-blue-100 border-blue-400 text-blue-800'
          };
        } else {
          return {
            type: 'my-turn-wait' as const,
            icon: '⏳',
            message: "Your turn - waiting for valid moves...",
            color: 'bg-yellow-100 border-yellow-400 text-yellow-800'
          };
        }
      } else {
        return {
          type: 'other-turn' as const,
          icon: '⏳',
          message: `${turnPlayer.name}'s turn`,
          color: 'bg-gray-100 border-gray-400 text-gray-800'
        };
      }
    }

    return {
      type: 'unknown' as const,
      icon: '❓',
      message: 'Unknown game state',
      color: 'bg-gray-100 border-gray-400 text-gray-800'
    };
  };

  const status = getStatusMessage();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.message}
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className={`${status.color} border-2`}>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-2xl"
                  animate={
                    status.type === 'my-turn-roll' || status.type === 'my-turn-move'
                      ? { 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }
                      : status.type === 'finished'
                      ? {
                          scale: [1, 1.3, 1],
                          rotate: [0, 15, -15, 0]
                        }
                      : {}
                  }
                  transition={{
                    duration: 1,
                    repeat: status.type.includes('my-turn') || status.type === 'finished' ? Infinity : 0,
                    ease: 'easeInOut'
                  }}
                >
                  {status.icon}
                </motion.span>
                <span className="font-medium text-lg">
                  {status.message}
                </span>
              </div>

              {/* Game Status Badge */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`
                    px-3 py-1 font-medium
                    ${gameState.gameStatus === 'playing' ? 'bg-green-500 text-white' : 
                      gameState.gameStatus === 'waiting' ? 'bg-yellow-500 text-white' :
                      'bg-gray-500 text-white'}
                  `}
                >
                  {gameState.gameStatus.toUpperCase()}
                </Badge>
                
                {gameState.dice.value && (
                  <Badge variant="outline" className="px-3 py-1 bg-blue-500 text-white">
                    Last Roll: {gameState.dice.value}
                  </Badge>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Additional Game Info */}
        {gameState.gameStatus === 'playing' && (
          <motion.div 
            className="mt-3 flex flex-wrap gap-2 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {gameState.validMoves.length > 0 && isMyTurn() && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {gameState.validMoves.length} valid move{gameState.validMoves.length !== 1 ? 's' : ''}
              </Badge>
            )}
            
            {gameState.players.map((player, index) => (
              <Badge 
                key={player.id}
                variant="outline"
                className={`
                  ${index === gameState.currentPlayerIndex 
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800' 
                    : 'bg-gray-100 border-gray-400 text-gray-600'
                  }
                `}
              >
                {player.name}: {player.tokens.filter(t => t.position === 84).length}/4
              </Badge>
            ))}
          </motion.div>
        )}

        {/* Victory Animation */}
        {gameState.gameStatus === 'finished' && gameState.winner && (
          <motion.div 
            className="mt-4 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="text-6xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              🎊
            </motion.div>
            
            <div className="mt-2">
              <div className="text-xl font-bold text-gray-800">
                🏆 {gameState.winner.name} Wins! 🏆
              </div>
              <div className="text-sm text-gray-600 mt-1">
                All tokens reached home successfully!
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}