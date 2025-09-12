'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerPanel } from '@/components/game/PlayerPanel';
import { DiceComponent } from '@/components/game/DiceComponent';
import { GameStatus } from '@/components/game/GameStatus';
import { GameState, Player, SocketMessage } from '@/types/game';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { io, Socket } from 'socket.io-client';

export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize socket connection and load game state
  useEffect(() => {
    if (!roomId) return;

    // Get player info from localStorage
    const playerData = localStorage.getItem('ludoPlayer');
    if (!playerData) {
      router.push('/');
      return;
    }

    const player = JSON.parse(playerData);
    setCurrentPlayer(player);

    // Initialize socket connection  
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true
    });

    setSocket(socketInstance);

    // Socket event handlers
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionError('');
      console.log('Connected to server');
      
      // Join the game room
      socketInstance.emit('join-room', { roomId, player });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketInstance.on('connect_error', (error) => {
      console.log('WebSocket connection failed, using polling fallback');
      setIsConnected(false);
      // Don't set as error, just use polling
    });

    socketInstance.on('game-state', (data: SocketMessage) => {
      if (data.type === 'GAME_STATE_UPDATE') {
        setGameState(data.payload);
        setIsLoading(false);
      }
    });

    socketInstance.on('error', (data: SocketMessage) => {
      if (data.type === 'ERROR') {
        setConnectionError(data.payload.message);
      }
    });

    // Load initial game state immediately  
    loadGameState();

    // Set up polling interval for real-time updates
    const pollingInterval = setInterval(() => {
      loadGameState();
    }, 3000); // Poll every 3 seconds for game updates

    // Cleanup polling
    const originalCleanup = () => {
      socketInstance.disconnect();
      clearInterval(pollingInterval);
    };

    // Cleanup on unmount
    return originalCleanup;
  }, [roomId, router]);

  const loadGameState = async () => {
    try {
      const response = await fetch(`/api/game/${roomId}/state`);
      const data = await response.json();
      
      if (data.success && data.gameState) {
        setGameState(data.gameState);
        setConnectionError(''); // Clear any previous errors
        setIsLoading(false);
      } else {
        setConnectionError(data.error || 'Failed to load game');
        setIsLoading(false);
      }
    } catch (error) {
      setConnectionError('Failed to connect to game');
      console.error('Load game state error:', error);
      setIsLoading(false);
    }
  };

  const rollDice = async () => {
    if (!currentPlayer || !gameState || !gameState.canRollDice) return;

    try {
      const response = await fetch(`/api/game/${roomId}/roll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId: currentPlayer.id }),
      });

      const data = await response.json();
      if (data.success) {
        // Game state will be updated via socket
      } else {
        console.error('Roll dice error:', data.error);
      }
    } catch (error) {
      console.error('Roll dice network error:', error);
    }
  };

  const moveToken = async (tokenId: string, newPosition: number) => {
    if (!currentPlayer || !gameState) return;

    try {
      const response = await fetch(`/api/game/${roomId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          playerId: currentPlayer.id, 
          tokenId, 
          newPosition 
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Game state will be updated via socket
      } else {
        console.error('Move token error:', data.error);
      }
    } catch (error) {
      console.error('Move token network error:', error);
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId, playerId: currentPlayer?.id });
      socket.disconnect();
    }
    localStorage.removeItem('ludoPlayer');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-gray-600">Loading game...</p>
        </motion.div>
      </div>
    );
  }

  if (connectionError && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div 
          className="text-center space-y-4 bg-white p-8 rounded-lg shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600">Connection Error</h2>
          <p className="text-gray-600">{connectionError}</p>
          <div className="space-y-2">
            <Button onClick={loadGameState} variant="outline">
              Try Again
            </Button>
            <Button onClick={leaveRoom} variant="ghost">
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl">🎲</div>
          <p className="text-lg text-gray-600">Setting up game...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">Ludo Game</h1>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Room: <span className="font-mono font-bold">{roomId}</span>
            </div>
            <Button onClick={leaveRoom} variant="outline" size="sm">
              Leave Game
            </Button>
          </div>
        </motion.div>

        {/* Game Status */}
        <GameStatus 
          gameState={gameState} 
          currentPlayer={currentPlayer}
          connectionError={connectionError}
        />

        {/* Main Game Area */}
        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Player Panels */}
          <motion.div 
            className="lg:col-span-1 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {gameState.players.map((player, index) => (
              <PlayerPanel 
                key={player.id} 
                player={player} 
                isCurrentPlayer={currentPlayer?.id === player.id}
                isCurrentTurn={gameState.currentPlayerIndex === index}
              />
            ))}
          </motion.div>

          {/* Game Board */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <GameBoard 
              gameState={gameState}
              currentPlayer={currentPlayer}
              onTokenMove={moveToken}
            />
          </motion.div>

          {/* Game Controls */}
          <motion.div 
            className="lg:col-span-1 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DiceComponent 
              dice={gameState.dice}
              canRoll={gameState.canRollDice && currentPlayer?.id === gameState.players[gameState.currentPlayerIndex]?.id}
              onRoll={rollDice}
            />
            
            {/* Game Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Game Info</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Players: {gameState.players.length}/2</div>
                <div>Status: {gameState.gameStatus}</div>
                <div>Turn: {gameState.players[gameState.currentPlayerIndex]?.name || 'Waiting...'}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}