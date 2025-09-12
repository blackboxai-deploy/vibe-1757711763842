'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameState, Player, GameToken } from '@/types/game';
import { GameToken as TokenComponent } from './GameToken';

interface GameBoardProps {
  gameState: GameState;
  currentPlayer: Player | null;
  onTokenMove: (tokenId: string, newPosition: number) => void;
}

export function GameBoard({ gameState, currentPlayer, onTokenMove }: GameBoardProps) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);

  // Ludo board layout: 15x15 grid with specific path
  const boardSquares = generateBoardLayout();

  const handleSquareClick = useCallback((squareIndex: number) => {
    if (!selectedToken || !currentPlayer) return;

    // Validate move and call onTokenMove
    if (gameState.validMoves.includes(selectedToken)) {
      onTokenMove(selectedToken, squareIndex);
      setSelectedToken(null);
    }
  }, [selectedToken, currentPlayer, gameState.validMoves, onTokenMove]);

  const handleTokenClick = useCallback((token: GameToken) => {
    if (!currentPlayer || token.playerId !== currentPlayer.id) return;
    
    if (gameState.validMoves.includes(token.id)) {
      setSelectedToken(token.id === selectedToken ? null : token.id);
    }
  }, [currentPlayer, gameState.validMoves, selectedToken]);

  const renderBoardSquare = (squareIndex: number, rowIndex: number, colIndex: number) => {
    const isPath = boardSquares[squareIndex];
    const isHovered = hoveredSquare === squareIndex;
    const canMoveTo = selectedToken && gameState.validMoves.includes(selectedToken);
    
    // Get tokens on this square
    const tokensHere = gameState.players
      .flatMap(player => player.tokens)
      .filter(token => token.position === squareIndex);

    return (
      <motion.div
        key={`${rowIndex}-${colIndex}`}
        className={`
          relative w-8 h-8 border border-gray-300 cursor-pointer transition-all duration-200
          ${isPath ? 'bg-white' : 'bg-gray-100'}
          ${isHovered && canMoveTo ? 'bg-yellow-200 border-yellow-400' : ''}
          ${getSquareSpecialStyle(squareIndex)}
        `}
        onClick={() => isPath && handleSquareClick(squareIndex)}
        onMouseEnter={() => isPath && canMoveTo && setHoveredSquare(squareIndex)}
        onMouseLeave={() => setHoveredSquare(null)}
        whileHover={isPath && canMoveTo ? { scale: 1.1 } : {}}
      >
        {/* Render tokens on this square */}
        {tokensHere.map((token, tokenIndex) => (
          <TokenComponent
            key={token.id}
            token={token}
            isSelected={selectedToken === token.id}
            canSelect={gameState.validMoves.includes(token.id)}
            onClick={() => handleTokenClick(token)}
            stackIndex={tokenIndex}
          />
        ))}
      </motion.div>
    );
  };

  const renderHomeArea = (color: 'red' | 'blue', position: 'top-left' | 'bottom-right') => {
    const homeTokens = gameState.players
      .find(p => p.color === color)?.tokens
      .filter(token => token.position === -1) || [];

    const gridClass = position === 'top-left' 
      ? 'top-0 left-0' 
      : 'bottom-0 right-0';

    const bgColor = color === 'red' ? 'bg-red-100' : 'bg-blue-100';

    return (
      <motion.div 
        className={`
          absolute ${gridClass} w-24 h-24 ${bgColor} border-2 
          ${color === 'red' ? 'border-red-400' : 'border-blue-400'} 
          rounded-lg grid grid-cols-2 gap-1 p-2
        `}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {Array.from({ length: 4 }).map((_, index) => {
          const token = homeTokens[index];
          return (
            <div key={index} className="relative w-8 h-8 rounded-full border-2 border-gray-300 bg-white">
              {token && (
                <TokenComponent
                  token={token}
                  isSelected={selectedToken === token.id}
                  canSelect={gameState.validMoves.includes(token.id)}
                  onClick={() => handleTokenClick(token)}
                  stackIndex={0}
                />
              )}
            </div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 border-2 border-gray-200">
      <div className="relative">
        {/* Main Board Grid */}
        <motion.div 
          className="grid grid-cols-15 gap-0 border-4 border-gray-400 rounded-lg p-2 bg-gradient-to-br from-green-50 to-green-100"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {Array.from({ length: 225 }).map((_, index) => {
            const row = Math.floor(index / 15);
            const col = index % 15;
            return renderBoardSquare(index, row, col);
          })}
        </motion.div>

        {/* Home Areas */}
        {renderHomeArea('red', 'top-left')}
        {renderHomeArea('blue', 'bottom-right')}

        {/* Center Victory Area */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-yellow-200 to-yellow-300 border-4 border-yellow-500 rounded-full flex items-center justify-center shadow-lg"
          animate={{ 
            boxShadow: ['0 0 10px rgba(255, 193, 7, 0.5)', '0 0 20px rgba(255, 193, 7, 0.8)', '0 0 10px rgba(255, 193, 7, 0.5)'] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-2xl">👑</div>
        </motion.div>
      </div>

      {/* Game Instructions */}
      <motion.div 
        className="mt-4 text-center text-sm text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {selectedToken ? (
          <p className="text-blue-600 font-medium">
            Click on a highlighted square to move your token
          </p>
        ) : gameState.canMoveToken && currentPlayer ? (
          <p>Click on your token to select it, then click where you want to move</p>
        ) : (
          <p>Wait for your turn to play</p>
        )}
      </motion.div>
    </div>
  );
}

// Helper function to generate board layout
function generateBoardLayout(): boolean[] {
  const layout = new Array(225).fill(false);
  
  // Define the path squares (simplified Ludo board path)
  const pathSquares = [
    // Red starting area and path
    16, 17, 18, 19, 20, 21, 31, 46, 61, 76, 91, 106, 121, 136, 151, 166, 181, 196, 211,
    210, 209, 208, 207, 206, 205, 190, 175, 160, 145, 130, 115, 100, 85, 70, 55, 40, 25, 10,
    11, 12, 13, 14, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195,
    194, 193, 192, 191, 176, 161, 146, 131, 116, 101, 86, 71, 56, 41, 26,
    // Blue starting area and path  
    198, 199, 200, 201, 202, 203, 188, 173, 158, 143, 128, 113, 98, 83, 68, 53, 38, 23, 8,
    9, 24, 39, 54, 69, 84, 99, 114, 129, 144, 159, 174, 189, 204,
    // Center path
    112, 127, 142, 157, 172, 187, 102, 117, 132, 147, 162, 177
  ];

  pathSquares.forEach(square => {
    if (square >= 0 && square < 225) {
      layout[square] = true;
    }
  });

  return layout;
}

// Helper function to get special styling for squares
function getSquareSpecialStyle(squareIndex: number): string {
  // Safe squares
  const safeSquares = [16, 31, 46, 61, 76, 91, 106, 121, 198, 188, 173, 158, 143, 128, 113, 98];
  
  if (safeSquares.includes(squareIndex)) {
    return 'bg-green-200 border-green-400';
  }
  
  // Starting squares
  const startSquares = [16, 198];
  if (startSquares.includes(squareIndex)) {
    return 'bg-yellow-200 border-yellow-400';
  }
  
  return '';
}